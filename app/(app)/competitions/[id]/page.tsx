'use client';

import { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DetailCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  // Sécurisation Next.js 15 pour récupérer l'ID sans crash
  const resolvedParams = reactUse(params);
  const compId = resolvedParams?.id;
  const router = useRouter();

  // États des données
  const [competition, setCompetition] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [matchsTermines, setMatchsTermines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // États pour l'administration (ajout d'équipe)
  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedEquipe, setSelectedEquipe] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (compId) chargerDonnees();
  }, [compId]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      // 1. Charger la compétition
      const { data: comp } = await supabase.from('competitions').select('*').eq('id', compId).single();
      
      // 2. Charger les clubs pour le menu déroulant
      const { data: listeClubs } = await supabase.from('equipes_clubs').select('*').order('nom');
      
      if (comp) {
        // 3. Charger les matchs pour le classement (seulement ceux terminés)
        const { data: matchs } = await supabase
          .from('matchs')
          .select('*')
          .eq('competition', comp.nom)
          .eq('status', 'termine');

        setCompetition(comp);
        setMatchsTermines(matchs || []);
      }
      setClubs(listeClubs || []);
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculerClassement = () => {
    if (!competition?.equipes_engagees) return [];
    
    const stats: Record<string, any> = {};
    
    // On initialise chaque équipe avec 0 partout
    competition.equipes_engagees.forEach((eq: any) => {
      const key = `${eq.clubNom}-${eq.nom}`;
      stats[key] = { ...eq, m: 0, v: 0, d: 0, ptsPlus: 0, ptsMoins: 0, points: 0 };
    });

    // On calcule les résultats des matchs
    matchsTermines.forEach(m => {
      const keyA = `${m.clubA}-${m.equipeA}`;
      const keyB = `${m.clubB}-${m.equipeB}`;
      
      if (stats[keyA] && stats[keyB]) {
        stats[keyA].m++; stats[keyB].m++;
        stats[keyA].ptsPlus += (Number(m.scoreA) || 0);
        stats[keyA].ptsMoins += (Number(m.scoreB) || 0);
        stats[keyB].ptsPlus += (Number(m.scoreB) || 0);
        stats[keyB].ptsMoins += (Number(m.scoreA) || 0);
        
        if (m.scoreA > m.scoreB) {
          stats[keyA].v++; stats[keyA].points += 2; // Victoire
          stats[keyB].d++; stats[keyB].points += 1; // Défaite
        } else {
          stats[keyB].v++; stats[keyB].points += 2;
          stats[keyA].d++; stats[keyA].points += 1;
        }
      }
    });

    return Object.values(stats)
      .map((s: any) => ({ ...s, diff: s.ptsPlus - s.ptsMoins }))
      .sort((a: any, b: any) => b.points - a.points || b.diff - a.diff);
  };

  const classement = calculerClassement();
  const isAdmin = user?.username?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  // --- MODIFICATION : AJOUT FONCTION CLÔTURE ---
  const cloturerCompet = async () => {
    if (!isAdmin) return;
    if (confirm("Voulez-vous vraiment clôturer cette compétition ? Elle ne sera plus modifiable.")) {
      const { error } = await supabase
        .from('competitions')
        .update({ statut: 'cloture' }) // Nécessite une colonne 'statut' dans la table
        .eq('id', compId);
      
      if (!error) {
        setCompetition({ ...competition, statut: 'cloture' });
      } else {
        alert("Erreur : " + error.message);
      }
    }
  };
  // ----------------------------------------------

  const ajouterEquipeACompete = async () => {
    if (!selectedEquipe || !selectedClubId || !competition) return;
    const club = clubs.find(c => c.id === selectedClubId);
    
    const nouvelleEntree = {
      equipeId: selectedEquipe.id,
      nom: selectedEquipe.nom,
      clubNom: club.nom,
      logoColor: club.logoColor
    };

    const nouvelles = [...(competition.equipes_engagees || []), nouvelleEntree];
    const { error } = await supabase.from('competitions').update({ equipes_engagees: nouvelles }).eq('id', compId);
    
    if (!error) {
      setCompetition({ ...competition, equipes_engagees: nouvelles });
      setSelectedEquipe(null);
      setSelectedClubId('');
    }
  };

  const retirerEquipe = async (id: string) => {
    if (!confirm("Retirer cette équipe ?")) return;
    const filtrees = competition.equipes_engagees.filter((e: any) => e.equipeId !== id);
    await supabase.from('competitions').update({ equipes_engagees: filtrees }).eq('id', compId);
    setCompetition({ ...competition, equipes_engagees: filtrees });
  };

  if (loading) return <div style={loadingOverlay}>🏀 Chargement de Dunkly...</div>;
  if (!competition) return <div style={loadingOverlay}>Compétition introuvable.</div>;

  return (
    <div style={containerStyle}>
      {/* HEADER */}
      <div className="hero-mobile" style={heroSection}>
        <button onClick={() => router.push('/competitions')} style={backBtn}>← Retour</button>
        <h1 className="title-mobile" style={titleStyle}>{competition.nom}</h1>
        <div style={badgeGrid}>
          <div style={miniBadge}>🏆 {competition.type}</div>
          <div style={miniBadge}>📅 Saison 2025/2026</div>
        </div>
      </div>

      <div className="main-grid-mobile" style={mainGrid}>
        {/* CLASSEMENT DYNAMIQUE */}
        <div style={statsCard}>
          <h2 style={cardTitle}>🏆 Classement Officiel</h2>
          <div className="table-container">
            <table style={tableStyle}>
              <thead>
                <tr style={thRow}>
                  <th style={thL}>CLUB / ÉQUIPE</th>
                  <th style={thC}>M</th>
                  <th style={thC}>V</th>
                  <th style={thC}>D</th>
                  <th className="hide-mobile" style={thC}>DIFF</th>
                  <th style={thC}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classement.map((team: any, index: number) => (
                  <tr key={index} style={trStyle}>
                  <td style={tdL}>
                    <span style={rankStyle(index)}>{index + 1}</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      
                      {/* --- MODIFICATION ICI --- */}
                      <span className="team-name-mobile" style={{ fontWeight: '800' }}>
                        {team.clubNom} {/* Le Club en gros/gras */}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                        {team.nom} {/* L'Équipe en petit/gris en dessous */}
                      </span>
                      {/* ------------------------- */}
                      
                    </div>
                  </td>
                  <td style={tdC}>{team.m}</td>
                    <td style={{ ...tdC, color: '#22c55e', fontWeight: 'bold' }}>{team.v}</td>
                    <td style={{ ...tdC, color: '#ef4444' }}>{team.d}</td>
                    <td className="hide-mobile" style={tdC}>{team.diff > 0 ? `+${team.diff}` : team.diff}</td>
                    <td style={{ ...tdC, fontWeight: '900', color: '#F97316' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {classement.length === 0 && <p style={emptyText}>Aucune équipe engagée.</p>}
        </div>

        {/* ADMIN & INFOS */}
        <div className="action-column-mobile" style={actionColumn}>
          {/* MODIFICATION : BOUTON CLÔTURER */}
          {isAdmin && (
            <button onClick={cloturerCompet} style={cloturerBtnStyle}>
                🔒 CLÔTURER LA COMPÉTITION
            </button>
          )}

          {isAdmin && (
            <div style={adminCard}>
              <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Engager une équipe</h3>
              <select style={selectStyle} value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
                <option value="">-- Choisir un Club --</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>

              <select 
                style={{ ...selectStyle, marginTop: '10px' }} 
                disabled={!selectedClubId}
                onChange={(e) => setSelectedEquipe(e.target.value ? JSON.parse(e.target.value) : null)}
              >
                <option value="">-- Choisir l'Équipe --</option>
                {clubs.find(c => c.id === selectedClubId)?.equipes?.map((eq: any) => (
                  <option key={eq.id} value={JSON.stringify(eq)}>{eq.nom}</option>
                ))}
              </select>

              <button onClick={ajouterEquipeACompete} style={addBtn}>Engager</button>
            </div>
          )}

          <div style={infoBox}>
            <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Inscriptions ({competition.equipes_engagees?.length || 0})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {competition.equipes_engagees?.map((eq: any) => (
                <div key={eq.equipeId} style={equipeTag}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: eq.logoColor }}></div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', flex: 1 }}>{eq.nom}</span>
                  {isAdmin && <button onClick={() => retirerEquipe(eq.equipeId)} style={removeBtn}>×</button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .title-mobile { font-size: 1.8rem !important; }
          .hero-mobile { margin-bottom: 25px !important; }
          .main-grid-mobile { grid-template-columns: 1fr !important; gap: 20px !important; }
          .table-container { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .hide-mobile { display: none !important; }
          .team-name-mobile { font-size: 0.8rem !important; }
          td, th { padding: 10px 5px !important; font-size: 0.75rem !important; }
        }
      `}</style>
    </div>
  );
}

// --- STYLES HARMONISÉS ---
const containerStyle = { padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1e293b' };
const loadingOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, color: '#F97316' };
const heroSection = { textAlign: 'center' as const, marginBottom: '40px' };
const titleStyle = { fontSize: '2.5rem', fontWeight: '900', marginBottom: '15px' };
const badgeGrid = { display: 'flex', gap: '10px', justifyContent: 'center' };
const miniBadge = { backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '30px', fontWeight: 'bold' as const, fontSize: '0.8rem' };
const backBtn = { background: 'none', border: 'none', color: '#F97316', cursor: 'pointer', fontWeight: 'bold' as const, marginBottom: '10px' };

// MODIFICATION : Style bouton clôture
const cloturerBtnStyle = { width: '100%', padding: '15px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer' };

const mainGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' };

const statsCard = { backgroundColor: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' };
const cardTitle = { fontSize: '1.2rem', fontWeight: '800' as const, marginBottom: '25px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse' as const };
const thRow = { borderBottom: '2px solid #f1f5f9' };
const thL = { textAlign: 'left' as const, padding: '15px', color: '#64748b', fontSize: '0.7rem', fontWeight: 'bold' as const };
const thC = { textAlign: 'center' as const, padding: '15px', color: '#64748b', fontSize: '0.7rem', fontWeight: 'bold' as const };
const trStyle = { borderBottom: '1px solid #f8fafc' };
const tdL = { padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' };
const tdC = { padding: '15px', textAlign: 'center' as const };
const rankStyle = (i: number) => ({ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: i === 0 ? '#FEF3C7' : '#f1f5f9', color: i === 0 ? '#92400E' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' as const });

const actionColumn = { display: 'flex', flexDirection: 'column' as const, gap: '20px' };
const adminCard = { backgroundColor: '#1e293b', color: 'white', padding: '25px', borderRadius: '24px' };
const selectStyle = { width: '100%', padding: '12px', borderRadius: '12px', border: 'none', backgroundColor: '#334155', color: 'white' };
const addBtn = { width: '100%', marginTop: '15px', padding: '15px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold' as const, cursor: 'pointer' };

const infoBox = { backgroundColor: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' };
const equipeTag = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '12px' };
const removeBtn = { background: '#fee2e2', color: '#ef4444', border: 'none', width: '22px', height: '22px', borderRadius: '50%', cursor: 'pointer' };
const emptyText = { textAlign: 'center' as const, padding: '30px', color: '#94a3b8' };