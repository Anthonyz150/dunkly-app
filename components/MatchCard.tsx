"use client";

import Link from "next/link";
// --- CORRECTION: Import Image de next/image pour optimiser l'affichage ---
import Image from "next/image"; 
// ------------------------------------------------------------------------

interface MatchProps {
  id: string;
  clubA: string;
  clubB: string;
  equipeA: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  status: 'a-venir' | 'en-cours' | 'termine';
  arbitrePrincipal?: string;
  // --- AJOUT DES URLS DE LOGO ---
  logo_urlA?: string;
  logo_urlB?: string;
  // ------------------------------
}

export default function MatchCard({ 
  id, clubA, clubB, equipeA, equipeB, scoreA, scoreB, status, arbitrePrincipal,
  logo_urlA, logo_urlB // --- AJOUT ICI ---
}: MatchProps) {
  
  const getStatusBadge = () => {
    switch (status) {
      case 'en-cours': return <span style={badgeLive}>• LIVE</span>;
      case 'termine': return <span style={badgeTermine}>TERMINÉ</span>;
      default: return <span style={badgeFuture}>À VENIR</span>;
    }
  };

  return (
    <Link href={`/matchs/detail/${id}`} style={{ textDecoration: 'none' }}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold' }}>MATCH ID: #{id.slice(0,5)}</span>
          {getStatusBadge()}
        </div>

        <div style={scoreRow}>
          {/* CLUB A */}
          <div style={teamBlock}>
            {/* --- MODIF: AFFICHAGE LOGO A AVEC NEXT/IMAGE --- */}
            {logo_urlA ? (
              <div style={logoWrapperStyle}>
                <Image 
                  src={logo_urlA} 
                  alt={clubA} 
                  fill // Remplit le conteneur parent
                  style={{ objectFit: 'contain' }}
                  sizes="40px"
                />
              </div>
            ) : (
              <div style={{...logoPlaceholder, marginRight: '10px'}}>{clubA[0]}</div>
            )}
            <div>
              <span style={clubName}>{clubA}</span>
              <span style={teamLevel}>{equipeA}</span>
            </div>
          </div>

          <div style={scoreBlock}>
            <span style={scoreText}>{scoreA} - {scoreB}</span>
          </div>

          {/* CLUB B */}
          <div style={{ ...teamBlock, textAlign: 'right', flexDirection: 'row-reverse' }}>
            {/* --- MODIF: AFFICHAGE LOGO B AVEC NEXT/IMAGE --- */}
            {logo_urlB ? (
              <div style={logoWrapperStyle}>
                <Image 
                  src={logo_urlB} 
                  alt={clubB} 
                  fill // Remplit le conteneur parent
                  style={{ objectFit: 'contain' }}
                  sizes="40px"
                />
              </div>
            ) : (
              <div style={{...logoPlaceholder, marginLeft: '10px'}}>{clubB[0]}</div>
            )}
            <div style={{marginRight: '10px'}}>
              <span style={clubName}>{clubB}</span>
              <span style={teamLevel}>{equipeB}</span>
            </div>
          </div>
        </div>

        {arbitrePrincipal && (
          <div style={footerStyle}>
            🏁 <span style={{ marginLeft: '5px' }}>{arbitrePrincipal}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

// --- STYLES MODIFIÉS ---
const cardStyle = {
  borderRadius: '16px',
  padding: '20px',
  margin: '10px 0',
  background: '#1e293b',
  color: 'white',
  transition: 'transform 0.2s',
  cursor: 'pointer',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const scoreRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
// Ajout de flex pour aligner logo et texte
const teamBlock = { flex: 1, display: 'flex', alignItems: 'center' }; 
const clubName = { fontSize: '1.1rem', fontWeight: '800', display: 'block' };
const teamLevel = { fontSize: '0.8rem', color: '#94a3b8', display: 'block' };

// Style pour les conteneurs de logos
const logoWrapperStyle = { 
  width: '40px', 
  height: '40px', 
  position: 'relative' as const, // Nécessaire pour fill de next/image
  borderRadius: '50%', 
  backgroundColor: 'white', 
  padding: '2px',
  marginRight: '10px',
  overflow: 'hidden'
};

const logoPlaceholder = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' as const };

const scoreBlock = { 
  flex: 0.5, 
  textAlign: 'center' as const, 
  backgroundColor: '#0f172a', 
  padding: '10px', 
  borderRadius: '10px',
  margin: '0 15px'
};
const scoreText = { fontSize: '1.5rem', fontWeight: '900', color: '#f59e0b' };

const footerStyle = { 
  marginTop: '15px', 
  paddingTop: '10px', 
  borderTop: '1px solid #334155', 
  fontSize: '0.75rem', 
  color: '#94a3b8',
  display: 'flex',
  alignItems: 'center'
};

const badgeLive = { backgroundColor: '#ef4444', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' };
const badgeTermine = { backgroundColor: '#22c55e', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' };
const badgeFuture = { backgroundColor: '#64748b', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold' };