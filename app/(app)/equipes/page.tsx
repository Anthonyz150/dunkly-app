'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link'; // Import important pour la navigation

interface Club {
  id: string;
  nom: string;
  ville: string;
  logoColor: string;
  equipes: any[];
}

export default function EquipesPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modale Club uniquement
  const [showClubModal, setShowClubModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [nomClub, setNomClub] = useState('');
  const [ville, setVille] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    chargerClubs();
  }, []);

  const chargerClubs = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('equipes_clubs').select('*').order('nom');
    if (!error && data) {
      setClubs(data);
    }
    setLoading(false);
  };

  const isAdmin = user?.role === 'admin' || user?.username?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  const handleSaveClub = async () => {
    if (!nomClub || !ville) return alert("Champs requis !");
    
    if (isEditing && editingClubId) {
      const { error } = await supabase
        .from('equipes_clubs')
        .update({ nom: nomClub.trim(), ville: ville.trim() })
        .eq('id', editingClubId);
      if (!error) chargerClubs();
    } else {
      const { error } = await supabase
        .from('equipes_clubs')
        .insert([{ nom: nomClub.trim(), ville: ville.trim(), logoColor: `hsl(${Math.random() * 360}, 70%, 50%)`, equipes: [] }]);
      if (!error) chargerClubs();
    }
    closeClubModal();
  };

  const handleDeleteClub = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Empêche le clic de naviguer vers la page du club
    if (!confirm("Supprimer ce club ?")) return;
    const { error } = await supabase.from('equipes_clubs').delete().eq('id', id);
    if (!error) setClubs(clubs.filter(c => c.id !== id));
  };

  const closeClubModal = () => {
    setNomClub(''); setVille(''); setEditingClubId(null); setIsEditing(false); setShowClubModal(false);
  };

  if (loading) return <div style={{ padding: '30px' }}>🏀 Chargement des clubs...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontWeight: '900', margin: 0 }}>🛡️ ANNUAIRE DES CLUBS</h1>
          <p style={{ color: '#64748b' }}>Sélectionnez un club pour voir et gérer ses équipes.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowClubModal(true)} style={btnClubStyle}>+ NOUVEAU CLUB</button>
        )}
      </header>

      <div style={gridStyle}>
        {clubs.map((club) => (
          <Link href={`/equipes/${club.id}`} key={club.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ ...logoStyle, backgroundColor: club.logoColor }}>{club.nom[0]}</div>
                  <div>
                    <h3 style={{ margin: 0 }}>{club.nom}</h3>
                    <small style={{ color: '#64748b' }}>📍 {club.ville}</small>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                   <span style={badgeCount}>{(club.equipes || []).length} équipes</span>
                   {isAdmin && (
                     <button 
                       onClick={(e) => handleDeleteClub(e, club.id)} 
                       style={miniBtnDanger}
                     >🗑️</button>
                   )}
                   <span style={{ color: '#cbd5e1' }}>→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* MODALE CLUB */}
      {showClubModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Nouveau Club</h3>
            <input placeholder="Nom du club" value={nomClub} onChange={(e) => setNomClub(e.target.value)} style={inputStyle} />
            <input placeholder="Ville" value={ville} onChange={(e) => setVille(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveClub} style={btnConfirm}>Enregistrer</button>
              <button onClick={closeClubModal} style={btnCancel}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES ---
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' };
const gridStyle = { display: 'flex', flexDirection: 'column' as const, gap: '12px' };
const cardStyle = { 
  background: 'white', 
  padding: '15px 20px', 
  borderRadius: '16px', 
  border: '1px solid #e2e8f0', 
  transition: 'transform 0.1s',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
};
const logoStyle = { width: '45px', height: '45px', borderRadius: '12px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const };
const badgeCount = { backgroundColor: '#f1f5f9', color: '#64748b', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' as const };
const miniBtnDanger = { background: '#fee2e2', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' };
const btnClubStyle = { background: '#1e293b', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const };
const overlayStyle: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalStyle: React.CSSProperties = { background: 'white', padding: '25px', borderRadius: '15px', width: '90%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '15px' };
const inputStyle = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '100%' };
const btnConfirm = { flex: 1, padding: '10px', background: '#F97316', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' as const };
const btnCancel = { flex: 1, padding: '10px', background: '#f1f5f9', borderRadius: '8px', border: 'none', cursor: 'pointer' };