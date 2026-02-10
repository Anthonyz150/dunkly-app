"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilPage() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      setUser(session.user);
      setUsername(storedUser.username || '');
      setPrenom(storedUser.prenom || '');
      setNom(storedUser.nom || '');
      setLoading(false);
    };
    getProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('⏳ Enregistrement...');

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username, prenom, nom })
        .eq('id', user.id);

      if (profileError) throw profileError;

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

          <button type="submit" style={btnSave}>SAUVEGARDER</button>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #F1F5F9' }}>
            <button type="button" onClick={() => setShowDeleteModal(true)} style={btnDelete}>
              SUPPRIMER MON COMPTE
            </button>
          </div>

          <style jsx>{`
            /* --- MODIFICATION ICI : Padding augmenté à 40px --- */
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
            /* -------------------------------------------------- */

            .name-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            @media (max-width: 480px) { .name-grid { grid-template-columns: 1fr; gap: 15px; } }
          `}</style>
        </form>

        {/* MODAL DE CONFIRMATION */}
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
const inputStyle = { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #F1F5F9', fontSize: '1rem', outline: 'none', color: '#1E293B' };
const disabledInput = { ...inputStyle, backgroundColor: '#F8FAFC', color: '#94A3B8', cursor: 'not-allowed' };
const btnSave = { background: '#F97316', color: 'white', border: 'none', padding: '16px', borderRadius: '14px', cursor: 'pointer', fontWeight: '900', fontSize: '0.95rem' };
const btnDelete = { background: 'transparent', color: '#EF4444', border: '2px solid #FEE2E2', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '0.8rem', width: '100%' };

// STYLES DU MODAL
const btnCancel = { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #E2E8F0', background: 'white', fontWeight: '700', cursor: 'pointer', color: '#64748B' };
const btnConfirmDelete = { flex: 1, padding: '12px', borderRadius: '10px', border: 'none', background: '#EF4444', color: 'white', fontWeight: '700', cursor: 'pointer' };