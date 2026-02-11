'use client';

import { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DetailCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = reactUse(params);
  const compId = resolvedParams?.id;
  const router = useRouter();

  const [competition, setCompetition] = useState<any>(null);
  const [matchsTermines, setMatchsTermines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compId) chargerDonnees();
  }, [compId]);

  const chargerDonnees = async () => {
    setLoading(true);
    try {
      const { data: comp } = await supabase.from('competitions').select('*').eq('id', compId).single();
      
      if (comp) {
        const { data: matchs } = await supabase
          .from('matchs')
          .select('*')
          .eq('competition', comp.nom)
          .eq('status', 'termine');

        setCompetition(comp);
        setMatchsTermines(matchs || []);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculerClassement = () => {
    if (!competition?.equipes_engagees) return [];
    
    const stats: Record<string, any> = {};
    
    competition.equipes_engagees.forEach((eq: any) => {
      const key = `${eq.clubNom}-${eq.nom}`;
      // On conserve le logoUrl issu de la donnée structurée de la compétition
      stats[key] = { ...eq, m: 0, v: 0, d: 0, ptsPlus: 0, ptsMoins: 0, points: 0 };
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

  if (loading) return <div style={loadingOverlay}>🏀 Chargement de Dunkly...</div>;
  if (!competition) return <div style={loadingOverlay}>Compétition introuvable.</div>;

  return (
    <div style={containerStyle}>
      <div style={heroSection}>
        <button onClick={() => router.push('/competitions')} style={backBtn}>← Retour</button>
        <h1 style={titleStyle}>{competition.nom}</h1>
        <div style={badgeGrid}>
          <div style={miniBadge}>🏆 {competition.type}</div>
        </div>
      </div>

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
        {classement.length === 0 && <p style={emptyText}>Aucune équipe engagée ou aucun match terminé.</p>}
      </div>

      {/* Style JSX pour la responsivité */}
      <style jsx>{`
        @media (max-width: 768px) {
          .table-container { overflow-x: auto; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// --- STYLES HARMONISÉS (Dark mode moderne) ---
const containerStyle = { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#1e293b', backgroundColor: '#f8fafc', minHeight: '100vh' };
const loadingOverlay = { height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#ea580c' };
const heroSection = { textAlign: 'center' as const, marginBottom: '20px' };
const titleStyle = { fontSize: '1.8rem', fontWeight: '800', marginBottom: '10px', color: '#0f172a' };
const badgeGrid = { display: 'flex', gap: '10px', justifyContent: 'center' };
const miniBadge = { backgroundColor: '#e2e8f0', padding: '6px 12px', borderRadius: '20px', fontWeight: '600', fontSize: '0.75rem' };
const backBtn = { background: 'none', border: 'none', color: '#ea580c', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', padding: 0 };

const statsCard = { backgroundColor: 'white', padding: '15px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' };
const cardTitle = { fontSize: '1.1rem', fontWeight: '700', marginBottom: '15px', color: '#0f172a' };

const tableContainer = { overflowX: 'auto' as const };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.85rem' };
const thRow = { borderBottom: '2px solid #e2e8f0' };
const thL = { textAlign: 'left' as const, padding: '10px', color: '#64748b', fontWeight: '600' };
const thC = { textAlign: 'center' as const, padding: '10px', color: '#64748b', fontWeight: '600' };
const trStyle = { borderBottom: '1px solid #f1f5f9' };
const tdL = { padding: '10px', textAlign: 'left' as const };
const tdC = { padding: '10px', textAlign: 'center' as const };
const rankStyle = (i: number) => ({ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: i < 3 ? '#fef3c7' : '#f1f5f9', color: i < 3 ? '#92400e' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' as const });

const logoTableStyle = { width: '24px', height: '24px', borderRadius: '50%', objectFit: 'contain' as const };
const logoPlaceholderStyle = { width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, fontSize: '0.7rem', color: 'white' };
const hideMobile = { '@media (max-width: 768px)': { display: 'none' } };
const emptyText = { textAlign: 'center' as const, padding: '20px', color: '#94a3b8' };