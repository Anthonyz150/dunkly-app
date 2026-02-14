'use client';

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";

// 1. DÉFINITION DE L'INTERFACE AVEC LES JOINTURES
interface MatchInterface {
  id: string;
  date: string;
  clubA: string;
  clubB: string;
  scoreA: number;
  scoreB: number;
  competition: string;
  status: 'termine' | 'en-cours' | 'a-venir';
  logo_urlA?: string;
  logo_urlB?: string;
  // Jointures (nom de la table en minuscule dans la réponse SQL)
  competitions?: { logo_url?: string } | null;
  journees?: { nom: string } | null; // <-- Le nom de la journée
}

export default function TousLesResultatsPage() {
  const [matchs, setMatchs] = useState<MatchInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const chargerMatchs = async () => {
      setLoading(true);
      setError(null);

      // --- REQUÊTE AVEC JOINTURES ---
      const { data, error: supabaseError } = await supabase
        .from('matchs')
        .select(`
          *,
          competitions(logo_url),
          journees(nom)
        `)
        .eq('status', 'termine')
        // Tri par compétition puis par date
        .order('competition', { ascending: true })
        .order('date', { ascending: false });
      
      if (supabaseError) {
        console.error("Erreur Supabase:", supabaseError);
        setError(`Erreur: ${supabaseError.message}`);
      } else {
        console.log("Données reçues:", data);
        setMatchs(data || []);
      }
      setLoading(false);
    };
    chargerMatchs();
  }, []);

  // Formatage date simple
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date inconnue";
    return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
    });
  };

  // --- REGROUPEMENT PAR COMPÉTITION PUIS JOURNÉE ---
  const matchsGroupes = useMemo(() => {
    return matchs.reduce((acc, match) => {
      const competName = match.competition || 'Autres';
      // Récupération du nom depuis la jointure avec sécurité ?
      const journeeName = match.journees?.nom || 'Hors Journée';

      if (!acc[competName]) acc[competName] = {};
      if (!acc[competName][journeeName]) acc[competName][journeeName] = [];
      
      acc[competName][journeeName].push(match);
      return acc;
    }, {} as Record<string, Record<string, MatchInterface[]>>);
  }, [matchs]);

  if (loading) return <div style={containerStyle}>🏀 Chargement des résultats...</div>;
  if (error) return <div style={containerStyle}>Erreur : {error}</div>;

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🛡️ Tous les résultats</h1>
      
      {matchs.length === 0 && <p style={{color: '#94a3b8', textAlign: 'center'}}>Aucun résultat disponible.</p>}

      {/* --- AFFICHAGE HIERARCHIQUE --- */}
      {Object.entries(matchsGroupes).map(([competName, journees]) => (
        <div key={competName} style={competSectionStyle}>
          <h2 style={competTitleStyle}>{competName}</h2>
          
          {Object.entries(journees).map(([journeeName, matchsList]) => (
            <div key={journeeName} style={journeeSectionStyle}>
              {/* Affichage du nom de la journée */}
              <h3 style={journeeTitleStyle}>{journeeName}</h3>
              
              <div style={gridStyle}>
                {matchsList.map((m) => (
                  <Link href={`/matchs/detail/${m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
                    <div style={cardStyle}>
                      {/* Header card: Date */}
                      <div style={cardHeaderStyle}>
                          <span style={dateStyle}>{formatDate(m.date)}</span>
                      </div>
                      
                      {/* Corps card: Logos et Scores */}
                      <div style={matchRowStyle}>
                        {/* Équipe A */}
                        <div style={teamStyle}>
                          {m.logo_urlA ? (
                            <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />
                          ) : (
                            <div style={logoPlaceholderStyle}>{m.clubA ? m.clubA[0] : '?'}</div>
                          )}
                          <span style={clubNameStyle}>{m.clubA}</span>
                        </div>
                        
                        {/* Score */}
                        <div style={scoreStyle}>
                          {m.scoreA} - {m.scoreB}
                        </div>
                        
                        {/* Équipe B */}
                        <div style={{...teamStyle, flexDirection: 'row-reverse'}}>
                          {m.logo_urlB ? (
                            <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />
                          ) : (
                            <div style={logoPlaceholderStyle}>{m.clubB ? m.clubB[0] : '?'}</div>
                          )}
                          <span style={clubNameStyle}>{m.clubB}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// --- STYLES (Sombre et moderne) ---
const containerStyle = { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: 'white', minHeight: '100vh', backgroundColor: '#0f172a' };
const titleStyle = { fontWeight: '900' as const, marginBottom: '30px', color: 'white', textAlign: 'center' as const };
const competSectionStyle = { marginBottom: '40px' };
const competTitleStyle = { color: '#F97316', borderBottom: '2px solid #334155', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.5rem', fontWeight: '800' as const };
const journeeSectionStyle = { marginBottom: '25px', paddingLeft: '10px' };
const journeeTitleStyle = { color: '#e2e8f0', fontSize: '1.2rem', marginBottom: '15px', fontWeight: '600' as const };
const gridStyle = { display: 'flex' as const, flexDirection: 'column' as const, gap: '15px' };

const cardStyle = { 
  border: '1px solid #334155', 
  padding: '15px', 
  borderRadius: '12px', 
  backgroundColor: '#1e293b',
  transition: 'transform 0.1s, box-shadow 0.1s',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const cardHeaderStyle = { display: 'flex' as const, justifyContent: 'flex-end', marginBottom: '10px', fontSize: '0.8rem' };
const dateStyle = { color: '#94a3b8' };

const matchRowStyle = { display: 'flex' as const, justifyContent: 'space-between', alignItems: 'center', gap: '10px' };
const teamStyle = { display: 'flex' as const, alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 };
const clubNameStyle = { fontWeight: 'bold' as const, fontSize: '1rem', whiteSpace: 'nowrap' as const, overflow: 'hidden' as const, textOverflow: 'ellipsis' as const };

const logoStyle = { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', padding: '2px', flexShrink: 0 };
const logoPlaceholderStyle = { width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex' as const, alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, flexShrink: 0 };

const scoreStyle = { fontSize: '1.5rem', fontWeight: '900' as const, color: '#f59e0b', minWidth: '70px', textAlign: 'center' as const };