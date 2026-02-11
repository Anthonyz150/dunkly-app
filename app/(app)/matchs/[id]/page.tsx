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
          filter: `id=eq.${matchId}`, // Écouter uniquement ce match
        },
        (payload) => {
          console.log('Changement reçu en temps réel!', payload);
          setMatch(payload.new); // Mettre à jour l'affichage
        }
      )
      .subscribe();

    // Nettoyage lors du démontage du composant
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

    if (data) setMatch(data);
    setLoading(false);
  };

  const isAdmin = user?.role === "admin" || user?.email === "anthony.didier.pro@gmail.com";

  // --- LOGIQUE DE SAISIE DES SCORES PAR QUART-TEMPS ---
  const ouvrirSaisieScore = async () => {
    // Saisie Q1
    const q1A = prompt(`Score ${match.clubA} - Quart-temps 1 :`, match.config?.scores_quart_temps?.q1?.a || "0");
    const q1B = prompt(`Score ${match.clubB} - Quart-temps 1 :`, match.config?.scores_quart_temps?.q1?.b || "0");
    if (q1A === null || q1B === null) return;

    // Saisie Q2
    const q2A = prompt(`Score ${match.clubA} - Quart-temps 2 :`, match.config?.scores_quart_temps?.q2?.a || "0");
    const q2B = prompt(`Score ${match.clubB} - Quart-temps 2 :`, match.config?.scores_quart_temps?.q2?.b || "0");
    if (q2A === null || q2B === null) return;

    // Saisie Q3
    const q3A = prompt(`Score ${match.clubA} - Quart-temps 3 :`, match.config?.scores_quart_temps?.q3?.a || "0");
    const q3B = prompt(`Score ${match.clubB} - Quart-temps 3 :`, match.config?.scores_quart_temps?.q3?.b || "0");
    if (q3A === null || q3B === null) return;

    // Saisie Q4
    const q4A = prompt(`Score ${match.clubA} - Quart-temps 4 :`, match.config?.scores_quart_temps?.q4?.a || "0");
    const q4B = prompt(`Score ${match.clubB} - Quart-temps 4 :`, match.config?.scores_quart_temps?.q4?.b || "0");
    if (q4A === null || q4B === null) return;

    // Calcul des totaux
    const totalA = Number(q1A) + Number(q2A) + Number(q3A) + Number(q4A);
    const totalB = Number(q1B) + Number(q2B) + Number(q3B) + Number(q4B);

    const scoresDetails = {
      q1: { a: q1A, b: q1B },
      q2: { a: q2A, b: q2B },
      q3: { a: q3A, b: q3B },
      q4: { a: q4A, b: q4B }
    };

    const { error } = await supabase
      .from("matchs")
      .update({
        scoreA: totalA,
        scoreB: totalB,
        status: "termine",
        config: { ...match.config, scores_quart_temps: scoresDetails }
      })
      .eq("id", matchId);

    if (!error) {
      alert("Scores mis à jour !");
      // chargerMatch(); // Plus besoin d'appeler ça, Realtime s'en charge
    } else {
      alert("Erreur : " + error.message);
    }
  };

  if (loading) return <div style={containerStyle}>Chargement...</div>;
  if (!match) return <div style={containerStyle}>Match introuvable.</div>;

  return (
    <div style={containerStyle}>
      <button onClick={() => router.back()} style={backBtn}>← Retour</button>

      {/* Affichage Score Final Style Tableau Noir */}
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

      {/* Affichage du détail si le match est terminé */}
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
        <button onClick={ouvrirSaisieScore} style={actionBtn}>
          {match.status === "termine" ? "✏️ Modifier les scores" : "🏁 Renseigner les résultats"}
        </button>
      )}
    </div>
  );
}

// --- STYLES OBJETS (Inchangés) ---
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