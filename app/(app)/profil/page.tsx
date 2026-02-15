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

  // --- STYLES EN LIGNE ---
  const containerStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#F8FAFC',
  };

  const contentWrapperStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '500px',
    background: 'white',
    padding: '30px',
    borderRadius: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  };

  const profileFormStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '20px' };
  const nameGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' };
  const inputGroupStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '10px' };
  const labelStyle: React.CSSProperties = { fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' };
  const btnStyle: React.CSSProperties = { padding: '16px', borderRadius: '18px', border: '2px solid #F97316', background: 'linear-gradient(135deg, #F97316, #FB923C)', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', width: '100%', fontWeight: '700', boxShadow: '0 6px 15px rgba(249,115,22,0.3)', transition: 'all 0.2s ease' };
  const btnSaveStyle: React.CSSProperties = { background: '#F97316', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '0.95rem' };
  const btnDeleteStyle: React.CSSProperties = { background: 'transparent', color: '#EF4444', border: '2px solid #FEE2E2', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', width: '100%' };
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' };
  const modalContentStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' };

  // --- USEEFFECT POUR CHARGER LE PROFIL ---
  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { router.push('/login'); return; }
      setUser(session.user);

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setUsername(profile.username || '');
        setPrenom(profile.prenom || '');
        setNom(profile.nom || '');
        setAvatarUrl(profile.avatar_url || null);

        // ⚡ Toujours des tableaux
        setSelectedEquipeIds(profile.favorite_team_id ? (Array.isArray(profile.favorite_team_id) ? profile.favorite_team_id : [profile.favorite_team_id]) : []);
        setSelectedChampionshipIds(profile.favorite_championship_id ? (Array.isArray(profile.favorite_championship_id) ? profile.favorite_championship_id : [profile.favorite_championship_id]) : []);
      }

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

  // --- FONCTIONS ---
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('⏳ Enregistrement...');
    try {
      const { error: profileError } = await supabase.from('profiles')
        .update({ username, prenom, nom, favorite_team_id: selectedEquipeIds, favorite_championship_id: selectedChampionshipIds })
        .eq('id', user.id);
      if (profileError) throw profileError;
      await supabase.auth.updateUser({ data: { prenom, nom, username } });
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) { setMessage('❌ Erreur : ' + error.message); }
  };

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

  const confirmerSuppression = async () => {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error: any) { alert("Erreur suppression : " + error.message); setShowDeleteModal(false); }
  };

  // --- RENDER ---
  if (loading) return <div style={containerStyle}>Chargement...</div>;

  return (
    <div style={containerStyle}>
      <div style={contentWrapperStyle}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>MON PROFIL <span style={{ color: '#F97316' }}>.</span></h1>
        </header>

        {message && <div style={{ padding: '15px', backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2', color: message.includes('✅') ? '#166534' : '#991B1B', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', border: '1px solid', textAlign: 'center' }}>{message}</div>}

        <form onSubmit={handleSave} style={profileFormStyle}>
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
          <div style={inputGroupStyle}><label style={labelStyle}>Pseudo</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} style={inputStyle} required /></div>
          <div style={nameGridStyle}>
            <div style={inputGroupStyle}><label style={labelStyle}>Prénom</label><input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} style={inputStyle} required /></div>
            <div style={inputGroupStyle}><label style={labelStyle}>Nom</label><input type="text" value={nom} onChange={e => setNom(e.target.value)} style={inputStyle} required /></div>
          </div>

          {/* Favoris */}
          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: '10px', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '15px' }}>Mes Favoris</h3>

            {/* Clubs */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Clubs favoris</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {selectedEquipeIds.map(id => {
                  const eq = equipes.find(e => e.id === id);
                  if (!eq) return null;
                  return <img key={id} src={eq.logo_url} alt={eq.nom} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />;
                })}
              </div>
              <button type="button" style={btnStyle} onClick={() => setShowEquipeModal(true)}>Choisir mes clubs</button>
            </div>

            {/* Championnats */}
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Championnats favoris</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {selectedChampionshipIds.map(id => {
                  const co = competitions.find(c => c.id === id);
                  if (!co) return null;
                  return <img key={id} src={co.logo_url} alt={co.nom} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px' }} />;
                })}
              </div>
              <button type="button" style={btnStyle} onClick={() => setShowChampModal(true)}>Choisir mes championnats</button>
            </div>
          </div>

          <button type="submit" style={btnSaveStyle}>SAUVEGARDER</button>
          <button type="button" onClick={ajouterACarte} style={{ ...btnSaveStyle, background: '#4285F4', width: '100%', marginTop: '20px' }} disabled={generatingCard}>
            💳 {generatingCard ? '⏳ Génération...' : 'Ajouter à Google Wallet'}
          </button>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={() => setShowDeleteModal(true)} style={btnDeleteStyle}>SUPPRIMER MON COMPTE</button>
          </div>
        </form>

        {/* Modales */}
        {showEquipeModal && (
          <div style={modalOverlayStyle} onClick={() => setShowEquipeModal(false)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
              <h2>Choisir mes clubs</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                {equipes.map(e => (
                  <div key={e.id} style={{ border: selectedEquipeIds.includes(e.id) ? '3px solid #F97316' : '1px solid #ccc', borderRadius: '12px', padding: '10px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const newSelection = selectedEquipeIds.includes(e.id) ? selectedEquipeIds.filter(id => id !== e.id) : [...selectedEquipeIds, e.id];
                      setSelectedEquipeIds(newSelection);
                    }}>
                    {e.logo_url && <img src={e.logo_url} alt={e.nom} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }} />}
                    <div>{e.nom}</div>
                  </div>
                ))}
              </div>
              <button onClick={async () => { setShowEquipeModal(false); await supabase.from('profiles').update({ favorite_team_id: selectedEquipeIds }).eq('id', user.id); }}>Valider</button>
            </div>
          </div>
        )}

        {showChampModal && (
          <div style={modalOverlayStyle} onClick={() => setShowChampModal(false)}>
            <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
              <h2>Choisir mes championnats</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                {competitions.map(c => (
                  <div key={c.id} style={{ border: selectedChampionshipIds.includes(c.id) ? '3px solid #F97316' : '1px solid #ccc', borderRadius: '12px', padding: '10px', textAlign: 'center', cursor: 'pointer' }}
                    onClick={() => {
                      const newSelection = selectedChampionshipIds.includes(c.id) ? selectedChampionshipIds.filter(id => id !== c.id) : [...selectedChampionshipIds, c.id];
                      setSelectedChampionshipIds(newSelection);
                    }}>
                    {c.logo_url && <img src={c.logo_url} alt={c.nom} style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }} />}
                    <div>{c.nom}</div>
                  </div>
                ))}
              </div>
              <button onClick={async () => { setShowChampModal(false); await supabase.from('profiles').update({ favorite_championship_id: selectedChampionshipIds }).eq('id', user.id); }}>Valider</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}