// app/profil/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
// --- IMPORT DU CSS ---
import styles from './page.module.css';

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
  
  const [equipes, setEquipes] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState("");
  const [selectedChampionship, setSelectedChampionship] = useState("");
  
  const [showEquipeModal, setShowEquipeModal] = useState(false);
  const [showChampModal, setShowChampModal] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      setLoading(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        router.push('/login');
        return;
      }
      setUser(session.user);
      
      // Charger le profil
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, prenom, nom, avatar_url, favorite_team_id, favorite_championship_id')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setUsername(profile.username || '');
        setPrenom(profile.prenom || '');
        setNom(profile.nom || '');
        setAvatarUrl(profile.avatar_url || null);
        setSelectedEquipe(profile.favorite_team_id || '');
        setSelectedChampionship(profile.favorite_championship_id || '');
      }

      // Charger les listes de favoris
      const [equipesRes, compRes] = await Promise.all([
        supabase.from('equipes_clubs').select('id, nom_equipe'),
        supabase.from('competitions').select('id, nom')
      ]);
      
      if (equipesRes.data) setEquipes(equipesRes.data);
      if (compRes.data) setCompetitions(compRes.data);
      
      setLoading(false);
    };

    getProfile();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        localStorage.removeItem('currentUser');
        router.push('/login');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getProfile();
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

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

      // CORRECTION 1: Mettre à jour la table profiles pour avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setAvatarUrl(newAvatarUrl);
      setMessage('✅ Photo mise à jour !');
      setTimeout(() => setMessage(''), 3000);
      
      const currentData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentData, avatar_url: newAvatarUrl }));
      window.dispatchEvent(new Event('storage'));
    } catch (error: any) {
      setMessage('❌ Erreur photo : ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('⏳ Enregistrement...');
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username, prenom, nom,
          favorite_team_id: selectedEquipe || null,
          favorite_championship_id: selectedChampionship || null,
        })
        .eq('id', user.id);
      if (profileError) throw profileError;

      await supabase.auth.updateUser({ data: { prenom, nom, username } });
      const currentData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      localStorage.setItem('currentUser', JSON.stringify({ ...currentData, username, prenom, nom }));
      window.dispatchEvent(new Event('storage'));
      setMessage('✅ Profil mis à jour !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ Erreur : ' + error.message);
    }
  };

  const ajouterACarte = async () => {
    try {
      setGeneratingCard(true);
      setMessage('⏳ Génération de la carte...');
      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prenom, nom }),
      });
      const data = await response.json();
      if (data.link) {
        window.open(data.link, '_blank');
        setMessage('✅ Redirection Wallet...');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(data.error || "Erreur génération");
      }
    } catch (error: any) {
      setMessage('❌ Erreur Wallet : ' + error.message);
    } finally {
      setGeneratingCard(false);
    }
  };

  const confirmerSuppression = async () => {
    try {
      const { error } = await supabase.rpc('delete_user');
      if (error) throw error;
      await supabase.auth.signOut();
      localStorage.clear();
      router.push('/login');
    } catch (error: any) {
      alert("Erreur suppression : " + error.message);
      setShowDeleteModal(false);
    }
  };

  // Logique pour afficher le nom dans les boutons
  const getSelectedEquipeName = () => {
    const eq = equipes.find(e => e.id === selectedEquipe);
    return eq ? eq.nom_equipe : "Sélectionner une équipe";
  };

  const getSelectedChampName = () => {
    const ch = competitions.find(c => c.id === selectedChampionship);
    return ch ? ch.nom : "Sélectionner un championnat";
  };

  if (loading) return (
    <div className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className={styles.loadingSpinner}>🏀</div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>MON PROFIL <span style={{ color: '#F97316' }}>.</span></h1>
          <p style={{ color: '#64748B', marginTop: '5px' }}>Gérez votre identité Dunkly.</p>
        </header>

        {message && (
          <div style={{ padding: '15px', backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2', color: message.includes('✅') ? '#166534' : '#991B1B', borderRadius: '12px', marginBottom: '20px', fontWeight: '700', border: '1px solid', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className={styles.profileForm}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            {/* AFFICHAGE PHOTO CORRIGÉ */}
            <img src={avatarUrl || 'https://via.placeholder.com/150?text=Avatar'} alt="Avatar" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
            <div>
              <label htmlFor="avatar-upload" style={{ ...btnSave, padding: '10px 20px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-block' }}>
                {uploading ? '⏳...' : 'Changer de photo'}
              </label>
              <input type="file" id="avatar-upload" accept="image/*" onChange={uploadAvatar} disabled={uploading} style={{ display: 'none' }} />
            </div>
          </div>

          <div style={inputGroup}><label style={labelStyle}>Pseudo</label><input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required /></div>
          <div style={inputGroup}><label style={labelStyle}>Adresse E-mail</label><input type="text" value={user?.email} disabled style={disabledInput} /></div>
          
          <div className={styles.nameGrid}>
            <div style={inputGroup}><label style={labelStyle}>Prénom</label><input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} required /></div>
            <div style={inputGroup}><label style={labelStyle}>Nom</label><input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} required /></div>
          </div>

          {/* CORRECTION 2: Remplacement des champs par des BOUTONS */}
          <div style={{borderTop: '1px solid #F1F5F9', marginTop: '10px', paddingTop: '20px'}}>
            <h3 style={{fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '15px'}}>Mes Favoris</h3>
            <div style={inputGroup}>
                <label style={labelStyle}>Équipe favorite</label>
                <button type="button" onClick={() => setShowEquipeModal(true)} style={btnStyle}>{getSelectedEquipeName()}</button>
            </div>
            <div style={inputGroup}>
                <label style={labelStyle}>Championnat favori</label>
                <button type="button" onClick={() => setShowChampModal(true)} style={btnStyle}>{getSelectedChampName()}</button>
            </div>
          </div>

          <button type="submit" style={btnSave}>SAUVEGARDER</button>

          <div style={{ marginTop: '20px' }}>
              <button type="button" onClick={ajouterACarte} style={{ ...btnSave, background: '#4285F4', width: '100%' }} disabled={generatingCard}>
                💳 {generatingCard ? '⏳ Génération...' : 'Ajouter à Google Wallet'}
              </button>
          </div>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={() => setShowDeleteModal(true)} style={btnDelete}>SUPPRIMER MON COMPTE</button>
          </div>
        </form>

        {showDeleteModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#0F172A' }}>Supprimer le compte ?</h2>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5' }}>Cette action est irréversible.</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button onClick={() => setShowDeleteModal(false)} style={btnCancel}>Annuler</button>
                <button onClick={confirmerSuppression} style={btnConfirmDelete}>Confirmer</button>
              </div>
            </div>
          </div>
        )}

        {/* CORRECTION 3: AFFICHAGE DANS LES POPUPS */}
        {showEquipeModal && (
          <div className={styles.modalOverlay} onClick={() => setShowEquipeModal(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#0F172A' }}>Choisir mon équipe</h2>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {equipes.map(e => (
                    <div key={e.id} style={{...listItemStyle, backgroundColor: selectedEquipe === e.id ? '#FFF7ED' : 'white', borderColor: selectedEquipe === e.id ? '#F97316' : '#F1F5F9'}} onClick={() => { setSelectedEquipe(e.id); setShowEquipeModal(false); }}>
                        {e.nom_equipe}
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showChampModal && (
          <div className={styles.modalOverlay} onClick={() => setShowChampModal(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <h2 style={{ marginBottom: '20px', fontSize: '1.2rem', color: '#0F172A' }}>Choisir mon championnat</h2>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {competitions.map(c => (
                    <div key={c.id} style={{...listItemStyle, backgroundColor: selectedChampionship === c.id ? '#FFF7ED' : 'white', borderColor: selectedChampionship === c.id ? '#F97316' : '#F1F5F9'}} onClick={() => { setSelectedChampionship(c.id); setShowChampModal(false); }}>
                        {c.nom}
                    </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles restants en JS
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' as const };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' as const };
const disabledInput = { ...inputStyle, backgroundColor: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' };
const btnStyle = { padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', backgroundColor: 'white', textAlign: 'left' as const, cursor: 'pointer', fontSize: '1rem', width: '100%', color: '#1E293B' };
const btnSave = { background: '#F97316', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '0.95rem' };
const btnDelete = { background: 'transparent', color: '#EF4444', border: '2px solid #FEE2E2', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', width: '100%' };
const btnCancel = { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#64748B' };
const btnConfirmDelete = { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '700', cursor: 'pointer' };
const listItemStyle = { padding: '15px', border: '1px solid', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', textAlign: 'left' as const, fontSize: '0.9rem', color: '#1E293B' };