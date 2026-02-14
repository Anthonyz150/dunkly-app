"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function MembresPage() {
  const [membres, setMembres] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchMembres = async () => {
      try {
        // 1. Vérification de sécurité Admin locale
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const username = user?.username?.toLowerCase();
        
        const isAdmin = 
          user?.role === 'admin' || 
          username === 'admin' || 
          username === 'anthony.didier.prop';
        
        if (!isAdmin) {
          router.replace('/'); // replace est mieux que push pour la sécurité
          return;
        }

        // 2. Récupération des membres depuis la table 'profiles' de Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('username', { ascending: true });

        if (error) {
          console.error("Erreur Supabase:", error.message);
        } else {
          setMembres(data || []);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des membres:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMembres();
  }, [router]);

  const handleDelete = async (id: string, username: string) => {
    // Sécurité : Impossible de se supprimer soi-même ou l'admin principal
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (username === 'admin' || username === 'anthony.didier.prop') {
      return alert("Impossible de supprimer un compte administrateur principal.");
    }
    
    if (username === currentUser.username) {
      return alert("Vous ne pouvez pas supprimer votre propre compte depuis cet espace.");
    }

    if (confirm(`Voulez-vous vraiment supprimer le membre "${username}" ?`)) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        alert("Erreur lors de la suppression : " + error.message);
      } else {
        setMembres(membres.filter(m => m.id !== id));
      }
    }
  };

  const filteredMembres = membres.filter(m => 
    m.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
      <div style={{ fontSize: '3rem', animation: 'bounce 1s infinite' }}>🏀</div>
      <p style={{ color: '#64748B', marginTop: '10px', fontWeight: 'bold' }}>Chargement des membres...</p>
      <style jsx>{`@keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-20px); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '50px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', margin: 0 }}>GESTION DES <span style={{ color: '#F97316' }}>MEMBRES</span></h1>
          <p style={{ color: '#64748B' }}>{membres.length} utilisateur(s) enregistré(s)</p>
        </div>
        <input 
          type="text" 
          placeholder="Rechercher un membre..." 
          style={searchStyle}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      <div style={tableCard}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #F1F5F9' }}>
                <th style={thStyle}>PSEUDO</th>
                <th style={thStyle}>NOM COMPLET</th>
                <th style={thStyle}>EMAIL</th>
                <th style={thStyle}>RÔLE</th>
                <th style={thStyle}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembres.map((membre) => {
                const isAccountAdmin = membre.username === 'admin' || membre.username === 'anthony.didier.prop' || membre.role === 'admin';
                return (
                  <tr key={membre.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={tdStyle}><strong>{membre.username}</strong></td>
                    <td style={tdStyle}>{membre.prenom} {membre.nom}</td>
                    <td style={tdStyle}>{membre.email}</td>
                    <td style={tdStyle}>
                      <span style={roleBadge(isAccountAdmin)}>
                        {isAccountAdmin ? 'ADMIN' : 'MEMBRE'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button 
                        onClick={() => handleDelete(membre.id, membre.username)}
                        style={isAccountAdmin ? btnDisabled : deleteBtn}
                        disabled={isAccountAdmin}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredMembres.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>Aucun membre trouvé.</p>
        )}
      </div>
    </div>
  );
}

// --- STYLES OBJETS (CSS-in-JS avec arrondis modernes) ---

// --- CORRECTION: Arrondi carte tableau (24px) ---
const tableCard = { 
  backgroundColor: 'white', 
  borderRadius: '24px', 
  padding: '24px', // Plus de padding pour les grands arrondis
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', 
  border: '1px solid #F1F5F9' 
};

const thStyle = { 
  padding: '16px', 
  color: '#64748B', 
  fontSize: '0.75rem', 
  fontWeight: 'bold', 
  textTransform: 'uppercase' as const,
  textAlign: 'left' as const
};

const tdStyle = { 
  padding: '16px', 
  fontSize: '0.9rem', 
  color: '#1E293B',
  borderBottom: '1px solid #F1F5F9'
};

// --- CORRECTION: Arrondi recherche (14px) ---
const searchStyle = { 
  padding: '12px 20px', 
  borderRadius: '14px', 
  border: '2px solid #E2E8F0', 
  width: '300px', 
  outline: 'none', 
  fontSize: '0.9rem' 
};

// --- CORRECTION: Arrondi bouton delete (12px) ---
const deleteBtn = { 
  backgroundColor: '#FEE2E2', 
  color: '#B91C1C', 
  border: 'none', 
  padding: '10px 16px', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: 'bold' as const, 
  transition: '0.2s' 
};

const btnDisabled = { 
  ...deleteBtn, 
  opacity: 0.3, 
  cursor: 'not-allowed', 
  backgroundColor: '#F1F5F9', 
  color: '#94A3B8' 
};

// --- CORRECTION: Arrondi badge rôle (12px) ---
const roleBadge = (isAdmin: boolean) => ({
  backgroundColor: isAdmin ? '#FFF7ED' : '#F1F5F9',
  color: isAdmin ? '#C2410C' : '#475569',
  padding: '6px 12px',
  borderRadius: '12px',
  fontSize: '0.7rem',
  fontWeight: '800' as const,
  border: isAdmin ? '1px solid #FFEDD5' : '1px solid #E2E8F0'
});