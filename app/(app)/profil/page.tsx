// app/(app)/profil/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [generatingCard, setGeneratingCard] = useState(false);

  type Equipe = { id: string; nom: string; logo_url: string; };
  type Competition = { id: string; nom: string; logo_url: string; };

  const [equipes, setEquipes] = useState<Equipe[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedEquipeIds, setSelectedEquipeIds] = useState<string[]>([]);
  const [selectedChampionshipIds, setSelectedChampionshipIds] = useState<string[]>([]);
  const [showEquipeModal, setShowEquipeModal] = useState(false);
  const [showChampModal, setShowChampModal] = useState(false);

  const router = useRouter();
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    setIsAppleDevice(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { router.push('/login'); return; }
      setUser(session.user);

      // --- Profil de base ---
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setUsername(profile.username || '');
        setPrenom(profile.prenom || '');
        setNom(profile.nom || '');
        setAvatarUrl(profile.avatar_url || null);
      }

      // --- Favoris clubs ---
      const { data: favTeams } = await supabase
        .from('profile_teams')
        .select('team_id')
        .eq('profile_id', session.user.id);
      setSelectedEquipeIds(favTeams?.map(t => t.team_id) || []);

      // --- Favoris championnats ---
      const { data: favChamps } = await supabase
        .from('profile_championships')
        .select('championship_id')
        .eq('profile_id', session.user.id);
      setSelectedChampionshipIds(favChamps?.map(c => c.championship_id) || []);

      // --- Toutes les équipes et compétitions ---
      const [equipesRes, compRes] = await Promise.all([
        supabase.from('equipes_clubs').select('id, nom, logo_url'),
        supabase.from('competition').select('id, nom, logo_url')
      ]);

      if (equipesRes.data) setEquipes(equipesRes.data);
      if (compRes.data) setCompetitions(compRes.data);
      setLoading(false);
    };

    getProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { localStorage.removeItem('currentUser'); router.push('/login'); }
      else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') { getProfile(); }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  // --- Avatar ---
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Sélectionnez une image.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;

      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: newAvatarUrl }).eq('id', user.id);
      if (updateError) throw updateError;

      setAvatarUrl(`${newAvatarUrl}?t=${new Date().getTime()}`);
      setMessage('✅ Photo mise à jour !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) { setMessage('❌ Erreur photo : ' + error.message); }
    finally { setUploading(false); }
  };

  // --- Sauvegarde ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('⏳ Enregistrement...');
    try {
      // Update profil de base
      const { error: profileError } = await supabase.from('profiles')
        .update({ username, prenom, nom })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Update favoris clubs
      await supabase.from('profile_teams').delete().eq('profile_id', user.id);
      if (selectedEquipeIds.length > 0) {
        await supabase.from('profile_teams').insert(
          selectedEquipeIds.map(id => ({ profile_id: user.id, team_id: id }))
        );
      }

      // Update favoris championnats
      await supabase.from('profile_championships').delete().eq('profile_id', user.id);
      if (selectedChampionshipIds.length > 0) {
        await supabase.from('profile_championships').insert(
          selectedChampionshipIds.map(id => ({ profile_id: user.id, championship_id: id }))
        );
      }

      await supabase.auth.updateUser({ data: { prenom, nom, username } });
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) { setMessage('❌ Erreur : ' + error.message); }
  };

  // --- Carte ---
  const ajouterACarte = async () => {
    try {
      setGeneratingCard(true);
      setMessage('⏳ Génération de la carte...');
      const response = await fetch('/api/generate-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prenom, nom }) });
      const data = await response.json();
      if (data.link) { window.open(data.link, '_blank'); setMessage('✅ Redirection Wallet...'); setTimeout(() => setMessage(''), 3000); }
      else throw new Error(data.error || "Erreur génération");
    } catch (error: any) { setMessage('❌ Erreur Wallet : ' + error.message); }
    finally { setGeneratingCard(false); }
  };

  // --- Suppression ---
  const confirmerSuppression = async () => {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error: any) { alert("Erreur suppression : " + error.message); setShowDeleteModal(false); }
  };

  if (loading) return <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>Chargement...</div>;

  return (
    <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>MON PROFIL <span style={{ color: '#F97316' }}>.</span></h1>
        </header>

        {message && <div style={{ padding: '15px', backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2', color: message.includes('✅') ? '#166534' : '#991B1B', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', border: '1px solid', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img key={avatarUrl || "default"} src={avatarUrl ?? "/default-avatar.png"} alt="Avatar" onError={e => { (e.target as HTMLImageElement).src = "/default-avatar.png"; }} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <div>
              <label htmlFor="avatar-upload" style={{ background: '#F97316', color: 'white', padding: '10px 20px', borderRadius: '10px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-block' }}>
                {uploading ? '⏳...' : 'Changer de photo'}
              </label>
              <input type="file" id="avatar-upload" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
            </div>
          </div>

          {/* Pseudo / Nom */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Pseudo</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Prénom</label>
              <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' }}>Nom</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' }} required />
            </div>
          </div>

          {/* Favoris et modales */}
          {/* ... (modales clubs et championnats identiques, avec insertion dans profile_teams / profile_championships) */}

          <button type="submit" style={{ background: '#F97316', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '0.95rem' }}>SAUVEGARDER</button>
        </form>
      </div>
    </div>
  );
}