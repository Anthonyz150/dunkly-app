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
      .select('*, competitions!left(logo_url), journees!left(id, nom)')
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

  if (loading) return <div className="loading-state">Chargement des scores...</div>;

  return (
    <div className="page-container">
      {/* --- HEADER --- */}
      <header className="dashboard-header">
        <div className="header-top">
          <div className="header-left">
            <h1>RÉSULTATS <span className="orange-dot">.</span></h1>
            <p className="subtitle">Consultez les derniers scores de la saison.</p>
          </div>

          {isAdmin && (
            <Link href="/matchs/a-venir" className="btn-admin-mobile">
              + Match à venir
            </Link>
          )}
        </div>

        <input
          type="text"
          placeholder="Rechercher club, compétition ou journée..."
          className="search-input"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* --- AFFICHAGE HIERARCHIQUE (Compétition > Journée > Matchs) --- */}
      {Object.entries(matchGroupes).map(([compet, competData]) => (
        <div key={compet} className="compet-section">
          {/* Titre Compétition avec Logo */}
          <h2 className="compet-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {competData.logo && (
              <img 
                src={competData.logo} 
                alt={compet} 
                style={{ width: '40px', height: '40px', objectFit: 'contain' }} 
              />
            )}
            🏆 {compet}
          </h2>

          {/* Boucle sur les journées */}
          {Object.entries(competData.journees).map(([nomJournee, matchsJournee]) => (
            <div key={nomJournee} className="journee-section" style={{marginLeft: '15px', marginBottom: '30px'}}>
              {/* Titre Journée */}
              <h3 className="journee-title" style={{color: '#f97316', fontWeight: '800', fontSize: '1.1rem', marginBottom: '15px', paddingLeft: '10px', borderLeft: '3px solid #f97316'}}>
                {nomJournee}
              </h3>
              
              <div className="matchs-grid">
                {matchsJournee.map((m: Match) => (
                  <Link href={`/matchs/resultats/${m.id}`} key={m.id} className="match-card-link">
                    <div className="match-card">
                      <div className={`status-border ${m.status === 'en-cours' ? 'bg-live' : 'bg-finished'}`}></div>
                      <div className="card-content">
                        <div className="card-top">
                          <span className="date">{m.date ? m.date.split('T')[0].split('-').reverse().join('/') : 'NC'}</span>
                          {m.status === 'en-cours' && <span className="live-tag">DIRECT</span>}
                        </div>
                        <div className="main-score-row">
                          
                          {/* Équipe A */}
                          <div className="team-info home">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                              <span className="team-name">{m.clubA}</span>
                              {m.logo_urlA ? (
                                <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubA?.[0] || '?'}</div>
                              )}
                            </div>
                            <span className="team-cat">{m.equipeA}</span>
                          </div>

                          {/* Score */}
                          <div className="score-badge">
                            <span className="score-num">{m.scoreA ?? 0}</span>
                            <span className="score-sep">-</span>
                            <span className="score-num">{m.scoreB ?? 0}</span>
                          </div>

                          {/* Équipe B */}
                          <div className="team-info away">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start' }}>
                              {m.logo_urlB ? (
                                <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubB?.[0] || '?'}</div>
                              )}
                              <span className="team-name">{m.clubB}</span>
                            </div>
                            <span className="team-cat">{m.equipeB}</span>
                          </div>
                        </div>
                        
                        <div className="card-bottom">
                          <div className="location">📍 {m.lieu || 'Lieu non défini'}</div>
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
        <div className="empty-state">Aucun match ne correspond à votre recherche.</div>
      )}

      {/* --- STYLES --- */}
      <style jsx>{`
        .page-container { animation: fadeIn 0.4s ease; padding-bottom: 40px; padding: 20px; }
        .dashboard-header { display: flex; flex-direction: column; gap: 15px; margin-bottom: 30px; }
        .header-top { display: flex; justify-content: space-between; align-items: center; gap: 15px; }
        .dashboard-header h1 { font-size: 1.8rem; font-weight: 800; color: #1a1a1a; margin: 0; }
        .orange-dot { color: #f97316; }
        .subtitle { color: #64748b; font-size: 0.9rem; margin: 5px 0 0; }
        .search-input { padding: 12px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: white; width: 100%; outline: none; font-size: 0.95rem; box-sizing: border-box; }
        
        .btn-admin-mobile { background-color: #0f172a; color: white; text-decoration: none; padding: 10px 15px; border-radius: 10px; font-weight: bold; font-size: 0.85rem; white-space: nowrap; display: inline-block; text-align: center; }
        
        .compet-section { margin-bottom: 40px; }
        .compet-title { font-size: 1.4rem; font-weight: 800; color: #1a1a1a; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #f1f5f9; }
        
        .matchs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
        .match-card-link { text-decoration: none; color: inherit; }
        .match-card { background: white; border-radius: 16px; display: flex; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #f1f5f9; transition: transform 0.2s; height: 100%; }
        .match-card:hover { transform: translateY(-3px); }
        .status-border { width: 6px; flex-shrink: 0; }
        .bg-finished { background: #f97316; }
        .bg-live { background: #22c55e; }
        .card-content { flex: 1; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
        .card-top { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .date { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }
        .main-score-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin: 5px 0; }
        .team-info { display: flex; flex-direction: column; width: 40%; }
        .home { text-align: right; }
        .team-name { font-size: 0.9rem; font-weight: 800; color: #1a1a1a; text-transform: uppercase; }
        .team-cat { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
        .score-badge { background: #f8fafc; padding: 6px 12px; border-radius: 12px; display: flex; align-items: center; gap: 5px; border: 1px solid #e2e8f0; }
        .score-num { font-size: 1.2rem; font-weight: 900; color: #1a1a1a; }
        .score-sep { color: #cbd5e1; font-weight: bold; }
        .card-bottom { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .live-tag { color: #22c55e; font-weight: 800; animation: pulse 2s infinite; font-size: 0.7rem; }
        .empty-state { text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 16px; border: 2px dashed #e2e8f0; }
        
        @media (max-width: 600px) {
          .header-top { flex-direction: column; align-items: flex-start; }
          .btn-admin-mobile { width: 100%; text-align: center; box-sizing: border-box; }
          .matchs-grid { grid-template-columns: 1fr; }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

const logoStyle = { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', border: '1px solid #f1f5f9' };
const logoPlaceholderStyle = { width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, fontSize: '1rem', color: '#64748b' };