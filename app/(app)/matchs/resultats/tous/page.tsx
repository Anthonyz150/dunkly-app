'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";

export default function TousLesResultatsPage() {
  const [matchs, setMatchs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const chargerMatchs = async () => {
      setLoading(true);
      setError(null);

      // --- CORRECTION ICI : Requête sécurisée ---
      // On sélectionne * pour la table matchs, et uniquement logo_url pour la jointure
      const { data, error: supabaseError } = await supabase
        .from('matchs')
        .select('*, competitions!left(logo_url)')                
        .order('date', { ascending: false });
      
      if (supabaseError) {
        console.error("Erreur Supabase:", supabaseError);
        setError(`Erreur: ${supabaseError.message}`);
      } else {
        // Log pour vérifier les données dans la console F12
        console.log("Données reçues :", data); 
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

  if (loading) return <div style={containerStyle}>Chargement des résultats...</div>;
  if (error) return <div style={containerStyle}>Erreur : {error}</div>;

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>🛡️ Tous les résultats</h1>
      
      <div style={gridStyle}>
        {matchs.length === 0 && <p style={{color: '#94a3b8'}}>Aucun résultat disponible.</p>}
        
        {matchs.map((m) => (
          <Link href={`/matchs/detail/${m.id}`} key={m.id} style={{ textDecoration: 'none' }}>
            <div style={cardStyle}>
              {/* Header card: Logo Compétition et Date */}
              <div style={cardHeaderStyle}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    {/* --- AFFICHAGE LOGO COMPETITION --- */}
                    {m.competitions?.logo_url && (
                        <img src={m.competitions.logo_url} alt={m.competition} style={{width: '24px', height: '24px', objectFit: 'contain'}} />
                    )}
                    <span style={competitionStyle}>{m.competition || 'Compétition inconnue'}</span>
                </div>
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
  );
}

// --- STYLES (Sombre et moderne) ---
const containerStyle = { padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: 'white', minHeight: '100vh', backgroundColor: '#0f172a' };
const titleStyle = { fontWeight: '900', marginBottom: '30px', color: 'white' };
const gridStyle = { display: 'flex', flexDirection: 'column' as const, gap: '15px' };

const cardStyle = { 
  border: '1px solid #334155', 
  padding: '20px', 
  borderRadius: '16px', 
  backgroundColor: '#1e293b',
  transition: 'transform 0.1s, box-shadow 0.1s',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const cardHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', fontSize: '0.85rem' };
const competitionStyle = { color: '#F97316', fontWeight: 'bold' as const, textTransform: 'uppercase' as const };
const dateStyle = { color: '#94a3b8' };

const matchRowStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' };
const teamStyle = { display: 'flex', alignItems: 'center', gap: '10px', flex: 1 };
const clubNameStyle = { fontWeight: 'bold' as const, fontSize: '1.1rem' };

const logoStyle = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', padding: '2px' };
const logoPlaceholderStyle = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const, flexShrink: 0 };

const scoreStyle = { fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b', minWidth: '80px', textAlign: 'center' as const };