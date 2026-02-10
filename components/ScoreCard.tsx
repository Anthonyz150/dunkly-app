"use client";

import Link from "next/link";

interface ScoreCardProps {
  id: string; // Nécessaire pour cliquer vers le détail
  equipeA: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  arbitre: string;
  isLive?: boolean; // Pour savoir si on affiche un point rouge
}

export default function ScoreCard({ id, equipeA, equipeB, scoreA, scoreB, arbitre, isLive }: ScoreCardProps) {
  // Détermination du vainqueur pour le style
  const vainqueur = scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : 'Nul';

  return (
    <Link href={`/matchs/detail/${id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className={`score-card ${isLive ? 'live-border' : ''}`}>
        
        {isLive && <div className="live-indicator">● EN DIRECT</div>}

        <div className="teams-row">
          {/* Équipe A */}
          <div className={`team ${vainqueur === 'A' ? 'winner' : ''}`}>
            <span className="team-name">{equipeA}</span>
            <span className="score">{scoreA}</span>
          </div>

          <div className="vs">VS</div>

          {/* Équipe B */}
          <div className={`team ${vainqueur === 'B' ? 'winner' : ''}`}>
            <span className="score">{scoreB}</span>
            <span className="team-name">{equipeB}</span>
          </div>
        </div>

        <div className="referee-info">
          <span className="icon">🏁</span> Officiel : <span className="ref-name">{arbitre}</span>
        </div>

        <style jsx>{`
          .score-card {
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 15px;
            border: 1px solid #334155;
            transition: all 0.2s ease;
          }
          .score-card:hover {
            transform: translateY(-2px);
            border-color: #F97316;
          }
          .live-border {
            border-color: #ef4444;
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.2);
          }
          .live-indicator {
            color: #ef4444;
            font-size: 0.7rem;
            font-weight: bold;
            margin-bottom: 10px;
            text-align: center;
          }
          .teams-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
          }
          .team {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            opacity: 0.7;
          }
          .winner {
            opacity: 1;
          }
          .team-name {
            font-weight: 700;
            font-size: 1rem;
            color: #f8fafc;
          }
          .score {
            font-size: 2.5rem;
            font-weight: 900;
            color: #f8fafc;
          }
          .winner .score {
            color: #F97316; /* Orange pour le gagnant */
          }
          .vs {
            font-weight: 900;
            color: #475569;
            font-size: 0.8rem;
          }
          .referee-info {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid #334155;
            font-size: 0.75rem;
            color: #94a3b8;
            text-align: center;
          }
          .ref-name {
            color: #f1f5f9;
            font-weight: 600;
          }
        `}</style>
      </div>
    </Link>
  );
}