'use client';

import { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DetailCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = reactUse(params);
  const compId = resolvedParams?.id;
  const router = useRouter();

  const [competition, setCompetition] = useState<any>(null);
  const [clubs, setClubs] = useState<any[]>([]);
  const [matchsTermines, setMatchsTermines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [selectedClubId, setSelectedClubId] = useState('');
  const [selectedEquipe, setSelectedEquipe] = useState<any>(null);
  // --- NOUVEL ÉTAT POUR LE LOGO DE COMPET ---
  const [newLogoUrl, setNewLogoUrl] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (compId) chargerDonnees();
  }, [compId]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const { data: comp } = await supabase.from('competitions').select('*').eq('id', compId).single();
      
      const { data: listeClubs } = await supabase.from('equipes_clubs').select('*, logo_url').order('nom');
      
      if (comp) {
        const { data: matchs } = await supabase
          .from('matchs')
          .select('*')
          .eq('competition', comp.nom)
          .eq('status', 'termine');

        setCompetition(comp);
        setMatchsTermines(matchs || []);
        // Initialiser le champ du logo avec l'URL actuelle
        setNewLogoUrl(comp.logo_url || '');
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
    
    const clubLogos = new Map(clubs.map(c => [c.nom, c.logo_url]));

    competition.equipes_engagees.forEach((eq: any) => {
      const key = `${eq.clubNom}-${eq.nom}`;
      stats[key] = { 
        ...eq,
        logoUrl: clubLogos.get(eq.clubNom) || eq.logoUrl,
        m: 0, v: 0, d: 0, ptsPlus: 0, ptsMoins: 0, points: 0 
      };
    });

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
          stats[keyA].v++; stats[keyA].points += 2;
          stats[keyB].d++; stats[keyB].points += 1;
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

  const cloturerCompet = async () => {
    if (!isAdmin) return;
    if (confirm("Voulez-vous vraiment clôturer cette compétition ?")) {
      const { error } = await supabase.from('competitions').update({ statut: 'cloture' }).eq('id', compId);
      if (!error) setCompetition({ ...competition, statut: 'cloture' });
    }
  };

  // --- NOUVELLE FONCTION POUR MAJ LOGO ---
  const updateCompetLogo = async () => {
    if (!isAdmin) return;
    const { error } = await supabase.from('competitions').update({ logo_url: newLogoUrl }).eq('id', compId);
    if (!error) {
      setCompetition({ ...competition, logo_url: newLogoUrl });
      alert("Logo de la compétition mis à jour !");
    } else {
      alert("Erreur lors de la mise à jour : " + error.message);
    }
  };

  const ajouterEquipeACompete = async () => {
    if (!selectedEquipe || !selectedClubId || !competition) return;
    const club = clubs.find(c => c.id === selectedClubId);
    
    const nouvelleEntree = {
      equipeId: selectedEquipe.id,
      nom: selectedEquipe.nom,
      clubNom: club.nom,
      logoColor: club.logoColor,
      logoUrl: club.logo_url
    };

    const nouvelles = [...(competition.equipes_engagees || []), nouvelleEntree];
    const { error } = await supabase.from('competitions').update({ equipes_engagees: nouvelles }).eq('id', compId);
    
    if (!error) {
      setCompetition({ ...competition, equipes_engagees: nouvelles });
      setSelectedEquipe(null);
      setSelectedClubId('');
    }
  };

  if (loading) return <div style={loadingOverlay}>🏀 Chargement...</div>;
  if (!competition) return <div style={loadingOverlay}>Compétition introuvable.</div>;

  return (
    <div style={containerStyle}>
      <div style={heroSection}>
        <button onClick={() => router.push('/competitions')} style={backBtn}>← Retour</button>
        
        {/* --- LOGO EN DESSOUS DU BOUTON RETOUR --- */}
        <div style={{ marginTop: '15px', marginBottom: '15px' }}>
          {competition.logo_url && (
            <img 
              src={competition.logo_url} 
              alt={competition.nom} 
              style={{ width: '150px', height: '150px', objectFit: 'contain' }} // --- TAILLE AUGMENTÉE ---
            />
          )}
        </div>
        
        <h1 style={titleStyle}>{competition.nom}</h1>
        <div style={badgeGrid}>
          <div style={miniBadge}>🏆 {competition.type}</div>
        </div>
      </div>

      <div style={mainGrid}>
        <div style={statsCard}>
          <h2 style={cardTitle}>Classement Officiel</h2>
          <div style={tableContainer}>
            <table style={tableStyle}>
              <thead>
                <tr style={thRow}>
                  <th style={thL}>#</th>
                  <th style={thL}>CLUB</th>
                  <th style={thC}>M</th>
                  <th style={thC}>V</th>
                  <th style={thC}>D</th>
                  <th style={{...thC, ...hideMobile}}>+/-</th>
                  <th style={thC}>PTS</th>
                </tr>
              </thead>
              <tbody>
                {classement.map((team: any, index: number) => (
                  <tr key={index} style={trStyle}>
                    <td style={tdL}><span style={rankStyle(index)}>{index + 1}</span></td>
                    <td style={tdL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {team.logoUrl ? (
                          <img src={team.logoUrl} alt={team.clubNom} style={logoTableStyle} />
                        ) : (
                          <div style={{...logoPlaceholderStyle, backgroundColor: team.logoColor || '#cbd5e1'}}>{team.clubNom[0]}</div>
                        )}
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{team.clubNom}</span>
                      </div>
                    </td>
                    <td style={tdC}>{team.m}</td>
                    <td style={{ ...tdC, color: '#16a34a', fontWeight: 'bold' }}>{team.v}</td>
                    <td style={{ ...tdC, color: '#dc2626' }}>{team.d}</td>
                    <td style={{...tdC, ...hideMobile}}>{team.diff > 0 ? `+${team.diff}` : team.diff}</td>
                    <td style={{ ...tdC, fontWeight: '900', color: '#ea580c' }}>{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={actionColumn}>
          {isAdmin && (
            <button onClick={cloturerCompet} style={cloturerBtnStyle}>🔒 CLÔTURER</button>
          )}
          {isAdmin && (
            <div style={adminCard}>
              {/* --- FORMULAIRE MAJ LOGO --- */}
              <h3 style={{marginTop: 0}}>Logo Compétition</h3>
              <input 
                type="text" 
                value={newLogoUrl} 
                onChange={(e) => setNewLogoUrl(e.target.value)}
                placeholder="URL du logo"
                style={{...selectStyle, marginBottom: '10px'}}
              />
              <button onClick={updateCompetLogo} style={addBtn}>Mettre à jour le logo</button>
              
              <hr style={{margin: '20px 0', borderColor: '#334155'}}/>

              <h3>Engager une équipe</h3>
              <select style={selectStyle} value={selectedClubId} onChange={(e) => setSelectedClubId(e.target.value)}>
                <option value="">-- Club --</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <select style={{...selectStyle, marginTop: '10px'}} disabled={!selectedClubId} onChange={(e) => setSelectedEquipe(e.target.value ? JSON.parse(e.target.value) : null)}>
                <option value="">-- Équipe --</option>
                {clubs.find(c => c.id === selectedClubId)?.equipes?.map((eq: any) => <option key={eq.id} value={JSON.stringify(eq)}>{eq.nom}</option>)}
              </select>
              <button onClick={ajouterEquipeACompete} style={addBtn}>Engager</button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .table-container { overflow-x: auto; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// --- STYLES HARMONISÉS ---
const containerStyle = { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' };
const loadingOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ea580c' };
const heroSection = { textAlign: 'center' as const, marginBottom: '20px' };
const titleStyle = { fontSize: '1.8rem', fontWeight: '800' };
const badgeGrid = { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' };
const miniBadge = { backgroundColor: '#e2e8f0', padding: '5px 10px', borderRadius: '15px', fontSize: '0.75rem' };
const backBtn = { background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 'bold' };
const mainGrid = { display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' };
const statsCard = { backgroundColor: 'white', padding: '15px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const cardTitle = { fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px' };
const tableContainer = { overflowX: 'auto' as const };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' };
const thRow = { borderBottom: '2px solid #e2e8f0' };
const thL = { textAlign: 'left' as const, padding: '10px', color: '#64748b' };
const thC = { textAlign: 'center' as const, padding: '10px', color: '#64748b' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdL = { padding: '10px', textAlign: 'left' as const };
const tdC = { padding: '10px', textAlign: 'center' as const };
const rankStyle = (i: number) => ({ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: i < 3 ? '#fef3c7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' as const });
const logoTableStyle = { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain' as const };
const logoPlaceholderStyle = { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white' };
const hideMobile = { '@media (max-width: 768px)': { display: 'none' } };
const actionColumn = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };
const cloturerBtnStyle = { padding: '10px', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };
const adminCard = { backgroundColor: '#1e293b', color: 'white', padding: '15px', borderRadius: '16px' };
const selectStyle = { width: '100%', padding: '8px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: 'none' };
const addBtn = { width: '100%', marginTop: '10px', padding: '10px', backgroundColor: '#ea580c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' };