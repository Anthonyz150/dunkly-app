'use client';

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";

// --- 1. DÉFINITION DE L'INTERFACE AVEC LOGOS ---
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
  // --- AJOUT DE LA JOINTURE COMPETITION ---
  competitions?: {
    logo_url?: string;
  };
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
  }, []);

  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  const chargerTousLesMatchs = async () => {
    setLoading(true);
    // --- MODIF: JOINTURE POUR LE LOGO DE COMPETITION ---
    const { data, error } = await supabase
      .from('matchs')
      .select('*, competitions(logo_url)') // Jointure
      .order('date', { ascending: false });
    if (!error) setMatchs(data || []);
    setLoading(false);
  };

  // --- 2. TYPAGE DU REGROUPEMENT ET FILTRAGE ---
  const matchGroupes = useMemo(() => {
    // 1. Filtrer selon la recherche
    const filtered = matchs.filter(m => 
      m.clubA?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.clubB?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.competition?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Regrouper par compétition
    return filtered.reduce((acc, match) => {
      const compet = match.competition || 'Autres';
      if (!acc[compet]) acc[compet] = [];
      acc[compet].push(match);
      return acc;
    }, {} as Record<string, Match[]>);

  }, [matchs, searchTerm]);

  if (loading) return <div className="loading-state">Chargement des scores...</div>;

  return (
    <div className="page-container">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>RÉSULTATS <span className="orange-dot">.</span></h1>
          <p className="subtitle">Consultez les derniers scores de la saison.</p>
        </div>
        <div className="header-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isAdmin && (
            <Link href="/matchs/a-venir" style={{ 
              background: '#0f172a', 
              color: 'white', 
              textDecoration: 'none',
              padding: '10px 15px', 
              borderRadius: '10px', 
              fontWeight: 'bold', 
              fontSize: '0.85rem' 
            }}>
              Match à venir
            </Link>
          )}
          <input 
            type="text" 
            placeholder="Rechercher un club ou une compétition..." 
            className="search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      {/* --- 3. AFFICHAGE TYPÉ PAR COMPETITION --- */}
      {Object.entries(matchGroupes).map(([compet, matchsSection]) => (
        <div key={compet} className="compet-section">
          {/* --- MODIF: AFFICHAGE LOGO COMPETITION A COTE DU TITRE --- */}
          <h2 className="compet-title" style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            {matchsSection[0]?.competitions?.logo_url && (
              <img src={matchsSection[0].competitions.logo_url} alt={compet} style={{width: '40px', height: '40px', objectFit: 'contain'}} />
            )}
            🏆 {compet}
          </h2>
          
          <div className="matchs-grid">
            {matchsSection.map((m: Match) => (
              <Link href={`/matchs/resultats/${m.id}`} key={m.id} className="match-card-link">
                <div className="match-card">
                  <div className={`status-border ${m.status === 'en-cours' ? 'bg-live' : 'bg-finished'}`}></div>
                  <div className="card-content">
                    <div className="card-top">
                      <span className="date">{m.date ? m.date.split('T')[0].split('-').reverse().join('/') : 'NC'}</span>
                      {m.status === 'en-cours' && <span className="live-tag">DIRECT</span>}
                    </div>
                    <div className="main-score-row">
                      
                      {/* --- EQUIPE A AVEC LOGO --- */}
                      <div className="team-info home">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end'}}>
                            <span className="team-name">{m.clubA}</span>
                            {m.logo_urlA ? (
                                <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />
                            ) : (
                                <div style={logoPlaceholderStyle}>{m.clubA[0]}</div>
                            )}
                        </div>
                        <span className="team-cat">{m.equipeA}</span>
                      </div>
                      
                      <div className="score-badge">
                        <span className="score-num">{m.scoreA ?? 0}</span>
                        <span className="score-sep">-</span>
                        <span className="score-num">{m.scoreB ?? 0}</span>
                      </div>
                      
                      {/* --- EQUIPE B AVEC LOGO --- */}
                      <div className="team-info away">
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-start'}}>
                            {m.logo_urlB ? (
                                <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />
                            ) : (
                                <div style={logoPlaceholderStyle}>{m.clubB[0]}</div>
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
      
      {Object.keys(matchGroupes).length === 0 && (
        <div className="empty-state">Aucun match ne correspond à votre recherche.</div>
      )}

      <style jsx>{`
        .page-container { animation: fadeIn 0.4s ease; padding-bottom: 40px; padding: 20px; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; }
        .dashboard-header h1 { font-size: 1.8rem; font-weight: 800; color: #1e293b; margin: 0; }
        .orange-dot { color: #f97316; }
        .subtitle { color: #64748b; font-size: 0.9rem; margin: 5px 0 0; }
        .search-input { padding: 10px 16px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; width: 300px; outline: none; font-size: 0.85rem; }
        
        .compet-section { margin-bottom: 40px; }
        .compet-title { font-size: 1.3rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f1f5f9; }
        
        .matchs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }
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
        .team-name { font-size: 0.9rem; font-weight: 800; color: #1e293b; text-transform: uppercase; }
        .team-cat { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
        .score-badge { background: #f8fafc; padding: 6px 12px; border-radius: 12px; display: flex; align-items: center; gap: 5px; border: 1px solid #e2e8f0; }
        .score-num { font-size: 1.2rem; font-weight: 900; color: #1e293b; }
        .score-sep { color: #cbd5e1; font-weight: bold; }
        .card-bottom { margin-top: 10px; padding-top: 10px; border-top: 1px solid #f1f5f9; font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .live-tag { color: #22c55e; font-weight: 800; animation: pulse 2s infinite; font-size: 0.7rem; }
        
        .empty-state { text-align: center; padding: 40px; color: #64748b; background: white; border-radius: 16px; border: 2px dashed #e2e8f0; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
      `}</style>
    </div>
  );
}

// --- STYLES COMPLÉMENTAIRES POUR LES LOGOS ---
const logoStyle = { width: '35px', height: '35px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', border: '1px solid #f1f5f9' };
const logoPlaceholderStyle = { width: '35px', height: '35px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, fontSize: '1rem', color: '#64748b' };