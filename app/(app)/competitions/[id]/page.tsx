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

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    if (compId) chargerDonnees();
  }, [compId]);

  const chargerDonnees = async () => {
    setLoading(true);

    try {
      const { data: comp } = await supabase
        .from('competitions')
        .select('*')
        .eq('id', compId)
        .single();

      const { data: listeClubs } = await supabase
        .from('equipes_clubs')
        .select('*')
        .order('nom');

      if (comp) {
        const { data: matchs, error } = await supabase
          .from('matchs')
          .select(`
            *,
            journees:journees_id (
              id,
              nom
            )
          `)
          .eq('competition', comp.nom)
          .eq('saison', comp.saison)
          .eq('status', 'termine')
          .order('journees_id', { ascending: true });

        if (error) console.error(error);

        setCompetition(comp);
        setMatchsTermines(matchs || []);
      }

      setClubs(listeClubs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculerClassement = () => {
    if (!competition?.equipes_engagees) return [];

    const stats: Record<string, any> = {};

    competition.equipes_engagees.forEach((eq: any) => {
      const key = `${eq.clubNom}-${eq.nom}`;
      stats[key] = {
        ...eq,
        m: 0,
        v: 0,
        d: 0,
        ptsPlus: 0,
        ptsMoins: 0,
        points: 0
      };
    });

    matchsTermines.forEach(m => {
      const keyA = `${m.clubA}-${m.equipeA}`;
      const keyB = `${m.clubB}-${m.equipeB}`;

      if (stats[keyA] && stats[keyB]) {
        stats[keyA].m++;
        stats[keyB].m++;

        stats[keyA].ptsPlus += Number(m.scoreA) || 0;
        stats[keyA].ptsMoins += Number(m.scoreB) || 0;

        stats[keyB].ptsPlus += Number(m.scoreB) || 0;
        stats[keyB].ptsMoins += Number(m.scoreA) || 0;

        if (m.scoreA > m.scoreB) {
          stats[keyA].v++;
          stats[keyA].points += 2;
          stats[keyB].d++;
          stats[keyB].points += 1;
        } else {
          stats[keyB].v++;
          stats[keyB].points += 2;
          stats[keyA].d++;
          stats[keyA].points += 1;
        }
      }
    });

    return Object.values(stats)
      .map((s: any) => ({ ...s, diff: s.ptsPlus - s.ptsMoins }))
      .sort((a: any, b: any) => b.points - a.points || b.diff - a.diff);
  };

  const classement = calculerClassement();

  const matchsParJournee = matchsTermines.reduce((acc: any, m: any) => {
    const journee = m.journees?.nom || "Sans journée";
    if (!acc[journee]) acc[journee] = [];
    acc[journee].push(m);
    return acc;
  }, {});

  if (loading) return <div>Chargement...</div>;
  if (!competition) return <div>Compétition introuvable.</div>;

  return (
    <div style={{ padding: '20px' }}>
      <button onClick={() => router.push('/competitions')}>
        ← Retour
      </button>

      <h1>{competition.nom}</h1>

      {/* CLASSEMENT */}
      <h2>Classement</h2>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Club</th>
            <th>M</th>
            <th>V</th>
            <th>D</th>
            <th>Diff</th>
            <th>PTS</th>
          </tr>
        </thead>
        <tbody>
          {classement.map((team: any, index: number) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{team.clubNom}</td>
              <td>{team.m}</td>
              <td>{team.v}</td>
              <td>{team.d}</td>
              <td>{team.diff}</td>
              <td>{team.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MATCHS PAR JOURNÉE */}
      <h2 style={{ marginTop: '40px' }}>Matchs par Journée</h2>

      {Object.entries(matchsParJournee).length === 0 && (
        <p>Aucun match terminé.</p>
      )}

      {Object.entries(matchsParJournee).map(([journee, matchs]: any) => (
        <div key={journee} style={{ marginBottom: '25px' }}>
          <h3 style={{
            background: '#0B1E3D',
            color: 'white',
            padding: '8px 15px',
            borderRadius: '8px'
          }}>
            📅 {journee}
          </h3>

          {matchs.map((m: any) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px',
                background: '#f1f5f9',
                borderRadius: '8px',
                marginTop: '8px'
              }}
            >
              <span>{m.clubA}</span>
              <strong>{m.scoreA} - {m.scoreB}</strong>
              <span>{m.clubB}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- STYLES OBJETS ---
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
const tableContainerStyle = { overflowX: 'auto' as const };
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