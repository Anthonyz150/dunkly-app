"use client";

import Link from "next/link";

interface MatchProps {
  id: string; // Ajout de l'ID pour le lien
  clubA: string;
  clubB: string;
  equipeA: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  status: 'a-venir' | 'en-cours' | 'termine';
  arbitrePrincipal?: string;
}

export default function MatchCard({ id, clubA, clubB, equipeA, equipeB, scoreA, scoreB, status, arbitrePrincipal }: MatchProps) {
  
  // Petit badge de statut dynamique
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
          <div style={teamBlock}>
            <span style={clubName}>{clubA}</span>
            <span style={teamLevel}>{equipeA}</span>
          </div>

          <div style={scoreBlock}>
            <span style={scoreText}>{scoreA} - {scoreB}</span>
          </div>

          <div style={{ ...teamBlock, textAlign: 'right' }}>
            <span style={clubName}>{clubB}</span>
            <span style={teamLevel}>{equipeB}</span>
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

// --- STYLES ---
const cardStyle = {
  borderRadius: '16px',
  padding: '20px',
  margin: '10px 0',
  background: '#1e293b', // Un bleu nuit plus moderne que le noir pur
  color: 'white',
  transition: 'transform 0.2s',
  cursor: 'pointer',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const scoreRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const teamBlock = { flex: 1, display: 'flex', flexDirection: 'column' as const };
const clubName = { fontSize: '1.1rem', fontWeight: '800' };
const teamLevel = { fontSize: '0.8rem', color: '#94a3b8' };

const scoreBlock = { 
  flex: 0.5, 
  textAlign: 'center' as const, 
  backgroundColor: '#0f172a', 
  padding: '10px', 
  borderRadius: '10px' 
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