"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  const router = useRouter();

  const [match, setMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // --- ÉTATS POUR LA MODALE DE SAISIE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scores, setScores] = useState({
    q1: { a: "0", b: "0" },
    q2: { a: "0", b: "0" },
    q3: { a: "0", b: "0" },
    q4: { a: "0", b: "0" },
  });
  // --------------------------------------

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    // 1. Charger le match initialement
    chargerMatch();

    // 2. --- SOUSCRIPTION REALTIME ---
    const channel = supabase
      .channel('match-detail')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matchs',
          filter: `id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Changement reçu en temps réel!', payload);
          setMatch(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const chargerMatch = async () => {
    const { data, error } = await supabase
      .from("matchs")
      .select("*")
      .eq("id", matchId)
      .single();

    if (data) {
      setMatch(data);
      // Pré-remplir les scores si déjà existants
      if (data.config?.scores_quart_temps) {
        setScores(data.config.scores_quart_temps);
      }
    }
    setLoading(false);
  };

  const isAdmin = user?.role === "admin" || user?.email === "anthony.didier.pro@gmail.com";

  // --- FONCTION POUR OUVRIR LA MODALE ET INITIALISER LES SCORES ---
  const ouvrirModale = () => {
    if (match.config?.scores_quart_temps) {
      setScores(match.config.scores_quart_temps);
    }
    setIsModalOpen(true);
  };

  // --- FONCTION POUR ENREGISTRER LES SCORES DEPUIS LA MODALE ---
  const enregistrerScores = async () => {
    const totalA = Number(scores.q1.a) + Number(scores.q2.a) + Number(scores.q3.a) + Number(scores.q4.a);
    const totalB = Number(scores.q1.b) + Number(scores.q2.b) + Number(scores.q3.b) + Number(scores.q4.b);

    const { error } = await supabase
      .from("matchs")
      .update({
        scoreA: totalA,
        scoreB: totalB,
        status: "termine",
        config: { ...match.config, scores_quart_temps: scores }
      })
      .eq("id", matchId);

    if (!error) {
      setIsModalOpen(false);
    } else {
      alert("Erreur : " + error.message);
    }
  };

  if (loading) return <div style={containerStyle}>Chargement...</div>;
  if (!match) return <div style={containerStyle}>Match introuvable.</div>;

  return (
    <div style={containerStyle}>
      <button onClick={() => router.back()} style={backBtn}>← Retour</button>

      {/* Affichage Score Final */}
      <div style={matchCard}>
        <div style={teamSection}>
          <div style={teamName}>{match.clubA}</div>
          <div style={scoreDisplay}>{match.scoreA || 0}</div>
        </div>
        
        <div style={vsStyle}>VS</div>

        <div style={teamSection}>
          <div style={scoreDisplay}>{match.scoreB || 0}</div>
          <div style={teamName}>{match.clubB}</div>
        </div>
      </div>

      <div style={infoBox}>
        <p><strong>📍 Lieu :</strong> {match.lieu}</p>
        <p><strong>🏆 Compétition :</strong> {match.competition}</p>
        <p><strong>🏁 Arbitre :</strong> {match.arbitre}</p>
        <p><strong>Statut :</strong> {match.status === 'termine' ? '✅ Terminé' : '🕒 À venir'}</p>
      </div>

      {/* Tableau Détails */}
      {match.config?.scores_quart_temps && (
        <div style={detailBox}>
          <h3 style={{ marginTop: 0 }}>Détail par Quart-temps</h3>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>Équipe</th>
                <th style={thStyle}>Q1</th>
                <th style={thStyle}>Q2</th>
                <th style={thStyle}>Q3</th>
                <th style={thStyle}>Q4</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdStyle}><b>{match.clubA}</b></td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q1.a}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q2.a}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q3.a}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q4.a}</td>
              </tr>
              <tr>
                <td style={tdStyle}><b>{match.clubB}</b></td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q1.b}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q2.b}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q3.b}</td>
                <td style={tdStyle}>{match.config.scores_quart_temps.q4.b}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && (
        <button onClick={ouvrirModale} style={actionBtn}>
          {match.status === "termine" ? "✏️ Modifier les scores" : "🏁 Renseigner les résultats"}
        </button>
      )}

      {/* --- COMPOSANT MODALE (POP-UP) --- */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h2 style={{marginTop: 0}}>Saisie des scores</h2>
            
            {["q1", "q2", "q3", "q4"].map((q, i) => (
              <div key={q} style={modalRow}>
                <span style={{fontWeight: 'bold', width: '40px'}}>Q{i+1}</span>
                <input type="number" value={scores[q as keyof typeof scores].a} onChange={e => setScores({...scores, [q]: {...scores[q as keyof typeof scores], a: e.target.value}})} style={modalInput} placeholder={match.clubA} />
                <span style={{color: '#64748b'}}>-</span>
                <input type="number" value={scores[q as keyof typeof scores].b} onChange={e => setScores({...scores, [q]: {...scores[q as keyof typeof scores], b: e.target.value}})} style={modalInput} placeholder={match.clubB} />
              </div>
            ))}

            <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn}>Annuler</button>
              <button onClick={enregistrerScores} style={saveBtn}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}
      {/* ---------------------------------- */}
    </div>
  );
}

// --- STYLES OBJETS ---
const containerStyle = { padding: "40px 20px", maxWidth: "800px", margin: "0 auto", fontFamily: "sans-serif" };
const backBtn = { background: "none", border: "none", color: "#64748b", cursor: "pointer", fontWeight: "bold" as const, marginBottom: "20px" };
const matchCard = { display: "flex", justifyContent: "space-around", alignItems: "center", backgroundColor: "#1e293b", color: "white", padding: "40px", borderRadius: "24px", marginBottom: "30px" };
const teamSection = { textAlign: "center" as const, flex: 1 };
const teamName = { fontSize: "1.2rem", fontWeight: "bold" as const, marginBottom: "10px", opacity: 0.9 };
const scoreDisplay = { fontSize: "4rem", fontWeight: "900" as const, color: "#F97316" };
const vsStyle = { fontSize: "1.5rem", color: "#64748b", fontWeight: "bold" as const };
const infoBox = { backgroundColor: "white", padding: "20px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "20px", lineHeight: "1.6" };
const detailBox = { backgroundColor: "#f8fafc", padding: "25px", borderRadius: "20px", border: "1px solid #e2e8f0", marginBottom: "30px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "10px", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase" as const };
const tdStyle = { padding: "15px 10px", textAlign: "center" as const, borderBottom: "1px solid #f1f5f9" };
const actionBtn = { width: "100%", padding: "18px", backgroundColor: "#F97316", color: "white", border: "none", borderRadius: "15px", fontWeight: "bold" as const, cursor: "pointer", fontSize: "1.1rem" };

// Styles Modale
const modalOverlay = { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: 'white', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' };
const modalRow = { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' };
const modalInput = { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '80px', textAlign: 'center' as const };
const cancelBtn = { flex: 1, padding: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
const saveBtn = { flex: 1, padding: '12px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };