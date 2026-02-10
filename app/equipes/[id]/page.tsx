'use client';
import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DetailClubPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const clubId = resolvedParams.id;
  const router = useRouter();

  const [club, setClub] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nomEquipe, setNomEquipe] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    chargerClub();
  }, [clubId]);

  const chargerClub = async () => {
    const { data, error } = await supabase
      .from('equipes_clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (data) setClub(data);
    setLoading(false);
  };

  const isAdmin = user?.role === 'admin' || user?.username?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  const ajouterEquipe = async () => {
    // On ouvre la pop-up comme demandé
    const nomSaisi = prompt("Nom de la nouvelle équipe (ex: U18 Masculins) :", nomEquipe);
    
    if (!nomSaisi || nomSaisi.trim() === "") return;

    const listeBase = Array.isArray(club.equipes) ? club.equipes : [];
    const nouvellesEquipes = [...listeBase, { id: Date.now().toString(), nom: nomSaisi.trim() }];
    
    const { error } = await supabase
      .from('equipes_clubs')
      .update({ equipes: nouvellesEquipes })
      .eq('id', clubId);

    if (!error) {
      setClub({ ...club, equipes: nouvellesEquipes });
      setNomEquipe('');
    } else {
      alert("Erreur Supabase : " + error.message);
    }
  };

  const modifierEquipe = async (eqId: string, nomActuel: string) => {
    const nouveauNom = prompt("Modifier le nom de l'équipe :", nomActuel);
    if (nouveauNom && nouveauNom.trim() !== "" && nouveauNom !== nomActuel) {
      const nouvelles = club.equipes.map((e: any) => 
        e.id === eqId ? { ...e, nom: nouveauNom.trim() } : e
      );
      const { error } = await supabase
        .from('equipes_clubs')
        .update({ equipes: nouvelles })
        .eq('id', clubId);

      if (!error) setClub({ ...club, equipes: nouvelles });
    }
  };

  const supprimerEquipe = async (eqId: string) => {
    if (!confirm("Supprimer cette équipe ?")) return;
    const filtrées = club.equipes.filter((e: any) => e.id !== eqId);
    const { error } = await supabase
      .from('equipes_clubs')
      .update({ equipes: filtrées })
      .eq('id', clubId);

    if (!error) setClub({ ...club, equipes: filtrées });
  };

  if (loading) return <div style={containerStyle}>Chargement...</div>;
  if (!club) return <div style={containerStyle}>Club introuvable.</div>;

  return (
    <div style={containerStyle}>
      <button onClick={() => router.back()} style={backBtn}>← Retour à la liste</button>

      <div style={headerCard}>
        <div style={{ ...logoStyle, backgroundColor: club.logoColor }}>{club.nom ? club.nom[0] : '?'}</div>
        <div>
          <h1 style={{ margin: 0 }}>{club.nom}</h1>
          <p style={{ color: '#64748b', margin: 0 }}>📍 {club.ville}</p>
        </div>
      </div>

      {isAdmin && (
        <div style={addBox}>
          <input 
            placeholder="Nom de la nouvelle équipe (ex: U18 Masculins)" 
            value={nomEquipe} 
            onChange={(e) => setNomEquipe(e.target.value)}
            style={inputStyle}
            onKeyDown={(e) => e.key === 'Enter' && ajouterEquipe()}
          />
          <button onClick={ajouterEquipe} style={addBtn}>Ajouter l'équipe</button>
        </div>
      )}

      <div style={listContainer}>
        <h2 style={sectionTitle}>Équipes rattachées</h2>
        {club.equipes && club.equipes.length > 0 ? (
          club.equipes.map((eq: any) => (
            <div key={eq.id} style={equipeItem}>
              <span style={{ fontWeight: 'bold' }}>🏀 {eq.nom}</span>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '15px' }}>
                  <button onClick={() => modifierEquipe(eq.id, eq.nom)} style={editBtn}>Modifier</button>
                  <button onClick={() => supprimerEquipe(eq.id)} style={deleteBtn}>Supprimer</button>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>Aucune équipe pour le moment.</p>
        )}
      </div>
    </div>
  );
}

// --- TOUS TES STYLES SONT ICI, RIEN N'A BOUGÉ ---
const containerStyle = { padding: '40px 20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'sans-serif' };
const backBtn = { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' as const, marginBottom: '20px' };
const headerCard = { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' };
const logoStyle = { width: '80px', height: '80px', borderRadius: '20px', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' as const };
const addBox = { display: 'flex', gap: '10px', marginBottom: '30px' };
const inputStyle = { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' };
const addBtn = { padding: '12px 20px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold' as const, cursor: 'pointer' };
const listContainer = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' };
const sectionTitle = { fontSize: '1rem', padding: '20px', margin: 0, borderBottom: '1px solid #f1f5f9', color: '#1e293b' };
const equipeItem = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #f8fafc' };
const editBtn = { color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' as const };
const deleteBtn = { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' as const };