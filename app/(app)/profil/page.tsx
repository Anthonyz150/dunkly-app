// app/profil/page.tsx
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
  
  // --- ÉTATS POUR LES FAVORIS ---
  const [equipes, setEquipes] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [selectedEquipe, setSelectedEquipe] = useState("");
  const [selectedChampionship, setSelectedChampionship] = useState("");
  // ------------------------------
  
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
      
      // ✅ Charger les données du profil, y compris les favoris
      const { data: profile, error: profileError } = await supabase
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

      // ✅ Charger les listes pour les sélecteurs
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

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Vous devez sélectionner une image.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      const filePath = `${fileName}`; 

      let { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const newAvatarUrl = data.publicUrl;

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: newAvatarUrl },
      });

      if (updateError) throw updateError;
      
      setAvatarUrl(newAvatarUrl);
      setMessage('✅ Photo de profil mise à jour !');
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
      // ✅ Mettre à jour profiles avec favoris
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          username, 
          prenom, 
          nom,
          favorite_team_id: selectedEquipe || null,
          favorite_championship_id: selectedChampionship || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Mettre à jour les métadonnées auth
      await supabase.auth.updateUser({
        data: { prenom, nom, username }
      });

      const currentData = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const updatedUser = { ...currentData, username, prenom, nom };

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('storage'));

      setMessage('✅ Profil mis à jour avec succès !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      setMessage('❌ Erreur : ' + error.message);
    }
  };

  const ajouterACarte = async () => {
    try {
      setGeneratingCard(true);
      setMessage('⏳ Génération de votre carte...');
      
      const response = await fetch('/api/generate-card', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prenom, nom }),
      });
      const data = await response.json();

      if (data.link) {
        window.open(data.link, '_blank');
        setMessage('✅ Redirection vers Google Wallet...');
        setTimeout(() => setMessage(''), 3000);
      } else {
        throw new Error(data.error || "Erreur lors de la génération");
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
      alert("Erreur lors de la suppression : " + error.message);
      setShowDeleteModal(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', width: '100%' }}>
      <div style={{ fontSize: '3rem', animation: 'bounce 0.6s infinite alternate' }}>🏀</div>
      <style jsx>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-20px); } }`}</style>
    </div>
  );

  return (
    <div style={{ 
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      padding: '20px',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      paddingTop: '50px'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        width: '100%', 
      }}>
        <header style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>
            MON PROFIL <span style={{ color: '#F97316' }}>.</span>
          </h1>
          <p style={{ color: '#64748B', marginTop: '5px' }}>Gérez votre identité Dunkly.</p>
        </header>

        {message && (
          <div style={{ 
            padding: '15px', backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2', 
            color: message.includes('✅') ? '#166534' : '#991B1B', borderRadius: '12px', 
            marginBottom: '20px', fontWeight: '700', border: '1px solid',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSave} className="profile-form">
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <img
              src={avatarUrl || 'https://via.placeholder.com/150?text=Avatar'}
              alt="Avatar"
              style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', marginBottom: '15px', border: '4px solid white', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            />
            <div>
              <label htmlFor="avatar-upload" style={{ ...btnSave, padding: '10px 20px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-block' }}>
                {uploading ? '⏳...' : 'Changer de photo'}
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Pseudo (Nom d'utilisateur)</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} required />
          </div>

          <div style={inputGroup}>
            <label style={labelStyle}>Adresse E-mail</label>
            <input type="text" value={user?.email} disabled style={disabledInput} />
          </div>

          <div className="name-grid">
            <div style={inputGroup}>
              <label style={labelStyle}>Prénom</label>
              <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} style={inputStyle} required />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Nom</label>
              <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} required />
            </div>
          </div>

          {/* ✅ SECTION FAVORIS */}
          <div style={{borderTop: '1px solid #F1F5F9', marginTop: '10px', paddingTop: '20px'}}>
            <h3 style={{fontSize: '1rem', fontWeight: '700', color: '#0F172A', marginBottom: '15px'}}>Mes Favoris</h3>
            
            <div style={inputGroup}>
                <label style={labelStyle}>Équipe favorite</label>
                <select value={selectedEquipe} onChange={(e) => setSelectedEquipe(e.target.value)} style={inputStyle}>
                <option value="">Sélectionner une équipe</option>
                {equipes.map(e => <option key={e.id} value={e.id}>{e.nom_equipe}</option>)}
                </select>
            </div>
            
            <div style={inputGroup}>
                <label style={labelStyle}>Championnat favori</label>
                <select value={selectedChampionship} onChange={(e) => setSelectedChampionship(e.target.value)} style={inputStyle}>
                <option value="">Sélectionner un championnat</option>
                {competitions.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
            </div>
          </div>
          {/* ------------------ */}

          <button type="submit" style={btnSave}>SAUVEGARDER</button>

          {/* ✅ BOUTON GOOGLE WALLET */}
          <div style={{ marginTop: '20px' }}>
              <button type="button" onClick={ajouterACarte} style={{ ...btnSave, background: '#4285F4', width: '100%' }} disabled={generatingCard}>
                💳 {generatingCard ? '⏳ Génération...' : 'Ajouter à Google Wallet'}
              </button>
          </div>
          {/* --------------------------- */}

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={() => setShowDeleteModal(true)} style={btnDelete}>
              SUPPRIMER MON COMPTE
            </button>
          </div>

          <style jsx>{`
            .profile-form { 
              display: flex; 
              flex-direction: column; 
              gap: 20px; 
              background-color: white; 
              padding: 40px; 
              border-radius: 24px; 
              box-shadow: 0 10px 25px rgba(0,0,0,0.03); 
              border: 1px solid #F1F5F9; 
            }
            .name-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media (max-width: 480px) { .name-grid { grid-template-columns: 1fr; gap: 15px; } }
          `}</style>
        </form>

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚠️</div>
              <h2 style={{ margin: '0 0 10px 0', color: '#0F172A' }}>Supprimer le compte ?</h2>
              <p style={{ color: '#64748B', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Cette action est irréversible. Toutes vos données seront définitivement effacées de Dunkly.
              </p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                <button onClick={() => setShowDeleteModal(false)} style={btnCancel}>Annuler</button>
                <button onClick={confirmerSuppression} style={btnConfirmDelete}>Confirmer</button>
              </div>
            </div>
            <style jsx>{`
              .modal-overlay {
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(15, 23, 42, 0.7); display: flex;
                align-items: center; justify-content: center; z-index: 1000;
                animation: fadeIn 0.2s ease;
              }
              .modal-content {
                background: white; padding: 30px; border-radius: 20px;
                max-width: 400px; width: 90%; text-align: center;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
                animation: scaleUp 0.2s ease;
              }
              @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
              @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}

const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '8px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: '#475569', textTransform: 'uppercase' as const };
const inputStyle = { width: '100%', padding: '16px', borderRadius: '16px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B', boxSizing: 'border-box' as const };
const disabledInput = { ...inputStyle, backgroundColor: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' };
const btnSave = { background: '#F97316', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '900', fontSize: '0.95rem' };
const btnDelete = { background: 'transparent', color: '#EF4444', border: '2px solid #FEE2E2', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', width: '100%' };
const btnCancel = { flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#64748B' };
const btnConfirmDelete = { flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '700', cursor: 'pointer' };