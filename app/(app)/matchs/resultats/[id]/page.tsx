'use client';

import { useState, useEffect, use as reactUse } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function DetailMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = reactUse(params);
  const matchId = resolvedParams?.id;
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isIosDevice, setIsIosDevice] = useState(false);

  useEffect(() => {
    if (matchId) {
      chargerMatch();
    }
    
    // Détection de l'appareil iOS côté client
    const checkIOS = () => {
        return [
          'iPad Simulator',
          'iPhone Simulator',
          'iPod Simulator',
          'iPad',
          'iPhone',
          'iPod'
        ].includes(navigator.platform)
        // Support pour les nouveaux iPhone/iPad (iOS 13+)
        || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
    };
    setIsIosDevice(checkIOS());

  }, [matchId]);

  const chargerMatch = async () => {
    try {
      setLoading(true);
      // --- REQUÊTE AVEC JOINTURES (Journée ET Competition) ---
      const { data, error } = await supabase
        .from('matchs')
        .select(`
          *,
          journees(nom),
          competitions(logo_url) 
        `)
        .eq('id', matchId)
        .single();

      if (error) throw error;
      setMatch(data);
    } catch (error) {
      console.error("Erreur chargement match:", error);
    } finally {
      setLoading(false);
    }
  };

  // FORMATAGE FRANÇAIS + HEURE DE PARIS
  const formatteDateParis = (dateString: string) => {
    if (!dateString) return 'Date non définie';
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🏀</div>
        <div style={{ fontWeight: 'bold', color: '#F97316' }}>Chargement du score...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Match introuvable</h2>
        <button onClick={() => router.push('/resultats')} style={backBtn}>Retour aux résultats</button>
      </div>
    );
  }

  // --- LOGIQUE D'AFFICHAGE DU VAINQUEUR ---
  const isFinished = match.status === 'termine';
  const showWinner = isFinished && match.scoreA !== match.scoreB;
  const winnerSide = isFinished ? (match.scoreA > match.scoreB ? 'A' : match.scoreA < match.scoreB ? 'B' : null) : null;

  return (
    <div style={containerStyle}>
      <button onClick={() => router.back()} style={backBtn}>← Retour</button>

      <div style={scoreCard}>
        {/* --- AFFICHAGE LOGO COMPÉTITION --- */}
        {match.competitions?.logo_url && (
            <img 
              src={match.competitions.logo_url} 
              alt={match.competition}
              style={{ width: '60px', height: '60px', objectFit: 'contain', marginBottom: '10px' }}
            />
        )}
        
        <p style={competitionLabel}>
          {match.competition}
        </p>
        <p style={journeeLabel}>
          {match.journees?.nom || 'Hors Journée'}
        </p>
        
        <p style={dateLabel}>{formatteDateParis(match.date)}</p>

        <div className="match-flex-mobile" style={matchFlex}>
          {/* CLUB & EQUIPE DOMICILE */}
          <div style={teamSide}>
            
            {match.logo_urlA ? (
                <img src={match.logo_urlA} alt={match.clubA} style={logoImageStyle} />
            ) : (
                <div style={{ ...logoCircle, backgroundColor: match.logoColorA || '#1e293b' }}>
                    {match.clubA?.[0] || 'A'}
                </div>
            )}
            
            <h2 style={{...teamName, color: showWinner && winnerSide === 'A' ? '#1e293b' : '#64748b' }}>{match.clubA}</h2>
            <p style={clubSub}>{match.equipeA}</p>
          </div>

          {/* SCORE CENTRAL */}
          <div style={scoreInfo}>
            <div className="score-numbers-mobile" style={scoreNumbers}>
              <span style={isFinished && match.scoreA > match.scoreB ? winScore : loseScore}>{match.scoreA ?? 0}</span>
              <span style={separator}>-</span>
              <span style={isFinished && match.scoreB > match.scoreA ? winScore : loseScore}>{match.scoreB ?? 0}</span>
            </div>
            <div style={{
              ...statusBadge,
              backgroundColor: isFinished ? '#f1f5f9' : '#fff7ed',
              color: isFinished ? '#64748b' : '#f97316',
              border: isFinished ? '1px solid #e2e8f0' : '1px solid #fed7aa'
            }}>
              {isFinished ? 'TERMINÉ' : 'À VENIR'}
            </div>
          </div>

          {/* CLUB & EQUIPE EXTERIEUR */}
          <div style={teamSide}>
            
            {match.logo_urlB ? (
                <img src={match.logo_urlB} alt={match.clubB} style={logoImageStyle} />
            ) : (
                <div style={{ ...logoCircle, backgroundColor: match.logoColorB || '#1e293b' }}>
                    {match.clubB?.[0] || 'B'}
                </div>
            )}
            
            <h2 style={{...teamName, color: showWinner && winnerSide === 'B' ? '#1e293b' : '#64748b' }}>{match.clubB}</h2>
            <p style={clubSub}>{match.equipeB}</p>
          </div>
        </div>
      </div>

      <div className="details-grid-mobile" style={detailsGrid}>
        <div style={infoBox}>
          <h3 style={infoTitle}>📍 Lieu</h3>
          {match.lieu ? (
            // --- LIEN ADAPTÉ SELON L'APPAREIL ---
            <a 
              href={isIosDevice 
                ? `maps://maps.apple.com/?q=${encodeURIComponent(match.lieu)}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(match.lieu)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#F97316', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}
            >
              {match.lieu} ↗
            </a>
          ) : (
            <p style={infoText}>Non renseigné</p>
          )}
        </div>
        <div style={infoBox}>
          <h3 style={infoTitle}>🏁 Arbitres</h3>
          <p style={infoText}>{match.arbitre || match.arbitres || 'Non désignés'}</p>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .match-flex-mobile {
            flex-direction: column !important;
            gap: 30px !important;
          }
          .score-numbers-mobile {
            font-size: 3.5rem !important;
          }
          .details-grid-mobile {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// --- STYLES ---
const containerStyle = { padding: '40px 20px', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1e293b' };
const backBtn = { background: '#f1f5f9', border: 'none', color: '#64748b', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const, marginBottom: '30px' };
const scoreCard = { backgroundColor: 'white', borderRadius: '30px', padding: '50px 30px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', textAlign: 'center' as const };
const competitionLabel = { color: '#64748b', fontWeight: '600' as const, textTransform: 'uppercase' as const, fontSize: '0.85rem', letterSpacing: '1px', marginBottom: '5px' };
const journeeLabel = { color: '#F97316', fontWeight: 'bold' as const, fontSize: '1.5rem', marginBottom: '5px' };
const dateLabel = { color: '#94a3b8', fontSize: '0.9rem', marginBottom: '40px', textTransform: 'capitalize' as const };
const matchFlex = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' };
const teamSide = { flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' };
const logoImageStyle = { width: '90px', height: '90px', borderRadius: '50%', objectFit: 'contain' as const, marginBottom: '15px', border: '1px solid #e2e8f0', backgroundColor: 'white' };
const logoCircle = { width: '90px', height: '90px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold' as const, marginBottom: '15px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const teamName = { fontSize: '1.6rem', fontWeight: '900' as const, margin: '0 0 5px 0', textTransform: 'uppercase' as const };
const clubSub = { margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: '600' as const };
const scoreInfo = { flex: 1 };
const scoreNumbers = { fontSize: '4.5rem', fontWeight: '900' as const, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', lineHeight: '1' };
const winScore = { color: '#1e293b' };
const loseScore = { color: '#cbd5e1' };
const separator = { color: '#f1f5f9' };
const statusBadge = { display: 'inline-block', marginTop: '20px', padding: '8px 20px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 'bold' as const };
const detailsGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' };
const infoBox = { backgroundColor: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e2e8f0' };
const infoTitle = { fontSize: '0.9rem', color: '#94a3b8', marginBottom: '10px', textTransform: 'uppercase' as const };
const infoText = { fontSize: '1.1rem', fontWeight: 'bold' as const, margin: 0 };