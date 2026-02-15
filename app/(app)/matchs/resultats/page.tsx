'use client';

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

// --- 1. DÉFINITION DE L'INTERFACE AVEC JOINTURES ---
interface Match {
  id: string;
  competition: string;
  date: string;
  clubA: string;
  equipeA: string;
  clubB: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  lieu: string;
  status: 'en-cours' | 'termine' | 'a-venir';
  logo_urlA?: string;
  logo_urlB?: string;
  // --- TYPAGES DES JOINTURES ---
  competitions?: {
    logo_url?: string;
  } | null;
  journees?: {
    id: string;
    nom: string;
  } | null;
}

export default function ResultatsPage() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
    }
    
    chargerTousLesMatchs();

    // --- ACTIVATION DU TEMPS RÉEL (REALTIME) ---
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matchs' },
        () => chargerTousLesMatchs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  const chargerTousLesMatchs = async () => {
    setLoading(true);
    // --- REQUÊTE CORRIGÉE AVEC LEFT JOIN ---
    const { data, error } = await supabase
      .from('matchs')
      // !left garantit que le match s'affiche même si la jointure échoue
      .select('*, competition!left(logo_url), journees!left(id, nom)')
      .order('competition', { ascending: true })
      .order('date', { ascending: false });

    if (error) {
      console.error("Erreur Supabase:", error);
    } else {
      setMatchs(data || []);
    }
    setLoading(false);
  };

  // --- LOGIQUE DE FILTRAGE ET REGROUPEMENT HIERARCHIQUE ---
  const matchGroupes = useMemo(() => {
    // 1. Filtrage par recherche
    const filtered = matchs.filter(m =>
      m.clubA?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.clubB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.competition?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.journees?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Regroupement : Compétition > Journée
    // Structure: { "Nom Compét": { logo: "url", journees: { "Nom Journée": [Matchs...] } } }
    return filtered.reduce((acc, match) => {
      const compet = match.competition || 'Autres';
      const nomJournee = match.journees?.nom || 'Hors Journée';
      const competLogo = match.competitions?.logo_url;

      if (!acc[compet]) {
        acc[compet] = { logo: competLogo, journees: {} };
      }
      
      // Mise à jour du logo si absent (cas où une entrée est null)
      if (!acc[compet].logo && competLogo) {
        acc[compet].logo = competLogo;
      }
      
      if (!acc[compet].journees[nomJournee]) {
        acc[compet].journees[nomJournee] = [];
      }
      
      acc[compet].journees[nomJournee].push(match);
      return acc;
    }, {} as Record<string, { logo?: string, journees: Record<string, Match[]> }>);

  }, [matchs, searchTerm]);

  if (loading) return <div style={loadingStyle}>🏀 Chargement des scores...</div>;

  return (
    <div style={pageContainer}>
      {/* --- HEADER --- */}
      <header style={dashboardHeader}>
        <div style={headerTop}>
          <div style={headerLeft}>
            <h1 style={headerTitle}>RÉSULTATS <span style={orangeDot}>.</span></h1>
            <p style={subtitle}>Consultez les derniers scores de la saison.</p>
          </div>

          {isAdmin && (
            <Link href="/matchs/a-venir" style={btnAdminMobile}>
              + Match à venir
            </Link>
          )}
        </div>

        <input
          type="text"
          placeholder="Rechercher club, compétition ou journée..."
          style={searchInput}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* --- AFFICHAGE HIERARCHIQUE (Compétition > Journée > Matchs) --- */}
      {Object.entries(matchGroupes).map(([compet, competData]) => (
        <div key={compet} style={competSection}>
          {/* Titre Compétition avec Logo */}
          <h2 style={competTitle}>
            {competData.logo && (
              <img 
                src={competData.logo} 
                alt={compet} 
                style={competLogoStyle} 
              />
            )}
            🏆 {compet}
          </h2>

          {/* Boucle sur les journées */}
          {Object.entries(competData.journees).map(([nomJournee, matchsJournee]) => (
            <div key={nomJournee} style={journeeSection}>
              {/* Titre Journée */}
              <h3 style={journeeTitle}>
                {nomJournee}
              </h3>
              
              <div style={matchsGrid}>
                {matchsJournee.map((m: Match) => (
                  <Link href={`/matchs/resultats/${m.id}`} key={m.id} style={matchCardLink}>
                    <div style={matchCard}>
                      <div style={{
                        ...statusBorder,
                        backgroundColor: m.status === 'en-cours' ? '#22c55e' : '#f97316'
                      }}></div>
                      <div style={cardContent}>
                        <div style={cardTop}>
                          <span style={dateStyle}>{m.date ? m.date.split('T')[0].split('-').reverse().join('/') : 'NC'}</span>
                          {m.status === 'en-cours' && <span style={liveTag}>DIRECT</span>}
                        </div>
                        
                        <div style={mainScoreRow}>
                          {/* Équipe A */}
                          <div style={{...teamInfo, textAlign: 'right'}}>
                            <div style={teamFlexRow}>
                              <span style={teamNameStyle}>{m.clubA}</span>
                              {m.logo_urlA ? (
                                <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubA?.[0] || '?'}</div>
                              )}
                            </div>
                            <span style={teamCatStyle}>{m.equipeA}</span>
                          </div>

                          {/* Score */}
                          <div style={scoreBadge}>
                            <span style={scoreNum}>{m.scoreA ?? 0}</span>
                            <span style={scoreSep}>-</span>
                            <span style={scoreNum}>{m.scoreB ?? 0}</span>
                          </div>

                          {/* Équipe B */}
                          <div style={{...teamInfo, textAlign: 'left'}}>
                            <div style={teamFlexRow}>
                              {m.logo_urlB ? (
                                <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubB?.[0] || '?'}</div>
                              )}
                              <span style={teamNameStyle}>{m.clubB}</span>
                            </div>
                            <span style={teamCatStyle}>{m.equipeB}</span>
                          </div>
                        </div>
                        
                        <div style={cardBottom}>
                          <div style={locationStyle}>📍 {m.lieu || 'Lieu non défini'}</div>
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

      {Object.keys(matchGroupes).length === 0 && (
        <div style={emptyState}>Aucun match ne correspond à votre recherche.</div>
      )}
    </div>
  );
}
// --- STYLES OBJETS (CSS-in-JS avec 'as const' et arrondis modernes) ---
const loadingStyle = { display: 'flex' as const, height: '100vh', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', color: '#64748b' };

// --- CORRECTION: Pleine largeur (width: '100%') ---
const pageContainer = { padding: '20px', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' };

const dashboardHeader = { display: 'flex' as const, flexDirection: 'column' as const, gap: '15px', marginBottom: '30px' };
const headerTop = { display: 'flex' as const, justifyContent: 'space-between', alignItems: 'center', gap: '15px' };
const headerLeft = {};
const headerTitle = { fontSize: '1.8rem', fontWeight: '800' as const, color: '#0f172a', margin: 0 };
const orangeDot = { color: '#f97316' };
const subtitle = { color: '#64748b', fontSize: '0.9rem', margin: '5px 0 0' };

// --- CORRECTION: Arrondi input (16px) ---
const searchInput = { padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', background: 'white', width: '100%', outline: 'none', fontSize: '0.95rem', boxSizing: 'border-box' as const };
// --- CORRECTION: Arrondi bouton (12px) ---
const btnAdminMobile = { backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold' as const, fontSize: '0.85rem', whiteSpace: 'nowrap' as const };

const competSection = { marginBottom: '40px' };
const competTitle = { display: 'flex' as const, alignItems: 'center', gap: '15px', fontSize: '1.4rem', fontWeight: '800' as const, color: '#0f172a', marginBottom: '25px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' };
const competLogoStyle = { width: '40px', height: '40px', objectFit: 'contain' as const };

const journeeSection = { marginLeft: '15px', marginBottom: '30px' };
const journeeTitle = { color: '#f97316', fontWeight: '800' as const, fontSize: '1.1rem', marginBottom: '15px', paddingLeft: '10px', borderLeft: '3px solid #f97316' };

// --- CORRECTION: Grille responsive ---
const matchsGrid = { display: 'grid' as const, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' };
const matchCardLink = { textDecoration: 'none', color: 'inherit' };

// --- CORRECTION: Arrondi carte (20px) ---
const matchCard = { backgroundColor: 'white', borderRadius: '20px', display: 'flex' as const, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', transition: 'transform 0.2s', height: '100%' };

const statusBorder = { width: '6px', flexShrink: 0 };
const cardContent = { flex: 1, padding: '15px', display: 'flex' as const, flexDirection: 'column' as const, justifyContent: 'space-between' as const };
const cardTop = { display: 'flex' as const, justifyContent: 'space-between', marginBottom: '10px' };
const dateStyle = { fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600' as const };
const mainScoreRow = { display: 'flex' as const, alignItems: 'center', justifyContent: 'space-between', gap: '10px', margin: '5px 0' };
const teamInfo = { display: 'flex' as const, flexDirection: 'column' as const, width: '40%' };
const teamFlexRow = { display: 'flex' as const, alignItems: 'center', gap: '10px' };
const teamNameStyle = { fontSize: '0.9rem', fontWeight: '800' as const, color: '#0f172a', textTransform: 'uppercase' as const };
const teamCatStyle = { fontSize: '0.7rem', color: '#94a3b8', fontWeight: '600' as const };

// --- CORRECTION: Arrondi score (12px) ---
const scoreBadge = { background: '#f8fafc', padding: '6px 12px', borderRadius: '12px', display: 'flex' as const, alignItems: 'center', gap: '5px', border: '1px solid #e2e8f0' };

const scoreNum = { fontSize: '1.2rem', fontWeight: '900' as const, color: '#0f172a' };
const scoreSep = { color: '#cbd5e1', fontWeight: 'bold' as const };
const cardBottom = { marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem', color: '#64748b', fontWeight: '600' as const };
const locationStyle = {};
const liveTag = { color: '#22c55e', fontWeight: '800' as const, fontSize: '0.7rem' };

// --- CORRECTION: Arrondi EmptyState (20px) ---
const emptyState = { textAlign: 'center' as const, padding: '40px', color: '#64748b', background: 'white', borderRadius: '20px', border: '2px dashed #e2e8f0' };
const logoStyle = { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', border: '1px solid #f1f5f9' };
const logoPlaceholderStyle = { width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex' as const, alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, fontSize: '1rem', color: '#64748b' };