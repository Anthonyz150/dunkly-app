"use client";

import { useState, useEffect, use, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// --- INTERFACES TYPESCRIPT ---
interface MatchInterface {
  id: string;
  clubA: string;
  equipeA: string;
  clubB: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  date: string;
  competition: string;
  lieu: string;
  arbitre: string;
  status: 'termine' | 'a-venir';
  config?: any;
  journees?: { nom: string } | null;
}

interface UserInterface {
  role: string;
  email: string;
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const matchId = resolvedParams.id;
  const router = useRouter();

  const [match, setMatch] = useState<MatchInterface | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserInterface | null>(null);
  const [saving, setSaving] = useState(false);
  
  // États pour la modale
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scores, setScores] = useState({
    q1: { a: "0", b: "0" },
    q2: { a: "0", b: "0" },
    q3: { a: "0", b: "0" },
    q4: { a: "0", b: "0" },
  });

  // --- FONCTION DE CHARGEMENT ---
  const chargerMatch = useCallback(async () => {
    const { data, error } = await supabase
      .from("matchs")
      .select(`
        *,
        journees(nom)
      `)
      .eq("id", matchId)
      .single();

    if (data) {
      setMatch(data as MatchInterface);
      if (data.config?.scores_quart_temps) {
        setScores(data.config.scores_quart_temps);
      }
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) setUser(JSON.parse(storedUser));
    
    chargerMatch();

    // Souscription Realtime
    const channel = supabase
      .channel('match-detail')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matchs', filter: `id=eq.${matchId}` }, chargerMatch)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, chargerMatch]);

  const isAdmin = user?.role === "admin" || user?.email === "anthony.didier.pro@gmail.com";

  const ouvrirModale = () => {
    if (match?.config?.scores_quart_temps) {
      setScores(match.config.scores_quart_temps);
    }
    setIsModalOpen(true);
  };

  const enregistrerScores = async () => {
    if (!match) return;
    setSaving(true);

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

    setSaving(false);
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

      {/* --- CARTES DE SCORE --- */}
      <div style={matchCard}>
        <div style={teamSection}>
          <div style={teamName}>{match.clubA}</div>
          <div style={teamEquipe}>{match.equipeA}</div>
          <div style={scoreDisplay}>{match.scoreA ?? 0}</div>
        </div>
        
        <div style={vsStyle}>VS</div>

        <div style={teamSection}>
          <div style={teamName}>{match.clubB}</div>
          <div style={teamEquipe}>{match.equipeB}</div>
          <div style={scoreDisplay}>{match.scoreB ?? 0}</div>
        </div>
      </div>

      {/* --- INFOS MATCH --- */}
      <div style={infoBox}>
        <h3 style={{marginTop: 0, color: '#475569'}}>Informations</h3>
        <div style={infoGrid}>
          <p style={infoText}><strong>🏆 Compétition :</strong> {match.competition}</p>
          <p style={infoText}><strong>🗓 Journée :</strong> {match.journees?.nom || 'Hors Journée'}</p>
          <p style={infoText}><strong>📍 Lieu :</strong> {match.lieu || 'Non renseigné'}</p>
          <p style={infoText}><strong>🏁 Arbitre :</strong> {match.arbitre || 'Non désigné'}</p>
          <p style={infoText}>
            <strong>Statut :</strong> 
            <span style={{
              ...statusBadge,
              backgroundColor: match.status === 'termine' ? '#d1fae5' : '#ffedd5',
              color: match.status === 'termine' ? '#065f46' : '#9a3412'
            }}>
              {match.status === 'termine' ? 'Terminé' : 'À venir'}
            </span>
          </p>
        </div>
      </div>

      {/* --- TABLEAU DES QUARTS-TEMPS --- */}
      {match.config?.scores_quart_temps && (
        <div style={detailBox}>
          <h3 style={{ marginTop: 0, color: '#475569' }}>Évolution du score</h3>
          <table style={tableStyle}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={thStyle}>Quart-temps</th>
                <th style={thStyle}>{match.clubA}</th>
                <th style={thStyle}>{match.clubB}</th>
              </tr>
            </thead>
            <tbody>
              {["q1", "q2", "q3", "q4"].map(q => (
                <tr key={q} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyleBold}>{q.toUpperCase()}</td>
                  <td style={tdStyle}>{match.config.scores_quart_temps[q].a}</td>
                  <td style={tdStyle}>{match.config.scores_quart_temps[q].b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* --- BOUTON ADMIN --- */}
      {isAdmin && (
        <button onClick={ouvrirModale} style={actionBtn}>
          {match.status === "termine" ? "✏️ Modifier le résultat" : "🏁 Renseigner le résultat"}
        </button>
      )}

      {/* --- MODALE DE SAISIE --- */}
      {isModalOpen && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{marginTop: 0, marginBottom: '20px'}}>Saisie des scores</h3>
            
            <div style={modalGrid}>
              <div style={modalHeader}>QT</div>
              <div style={modalHeader}>{match.clubA}</div>
              <div style={modalHeader}>{match.clubB}</div>
              
              {["q1", "q2", "q3", "q4"].map((q, i) => (
                <div key={q} style={{display: 'contents'}}>
                  <div style={modalRowLabel}>Q{i+1}</div>
                  <input type="number" min="0" value={scores[q as keyof typeof scores].a} onChange={e => setScores({...scores, [q]: {...scores[q as keyof typeof scores], a: e.target.value}})} style={modalInput} />
                  <input type="number" min="0" value={scores[q as keyof typeof scores].b} onChange={e => setScores({...scores, [q]: {...scores[q as keyof typeof scores], b: e.target.value}})} style={modalInput} />
                </div>
              ))}
            </div>

            <div style={{display: 'flex', gap: '15px', marginTop: '30px'}}>
              <button onClick={() => setIsModalOpen(false)} style={cancelBtn} disabled={saving}>Annuler</button>
              <button onClick={enregistrerScores} style={saveBtn} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES OBJETS ---
const containerStyle = { padding: "20px", maxWidth: "800px", margin: "0 auto", fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" };
const backBtn = { background: "#e2e8f0", border: "none", color: "#475569", padding: "10px 15px", borderRadius: "8px", cursor: "pointer", fontWeight: "600", marginBottom: "20px" };

const matchCard = { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", color: "white", padding: "30px", borderRadius: "20px", marginBottom: "25px" };
const teamSection = { textAlign: "center", flex: 1 };
const teamName = { fontSize: "1.2rem", fontWeight: "bold", marginBottom: "5px" };
const teamEquipe = { fontSize: "0.9rem", color: "#cbd5e1", marginBottom: "15px", textTransform: "uppercase" as const };
const scoreDisplay = { fontSize: "3rem", fontWeight: "800", color: "#f97316" };
const vsStyle = { fontSize: "1.5rem", color: "#64748b", fontWeight: "bold" };

const infoBox = { backgroundColor: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "20px" };
const infoGrid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "15px" };
const infoText = { margin: 0, color: "#334155" };
const statusBadge = { padding: "4px 8px", borderRadius: "6px", fontSize: "0.85rem", fontWeight: "600", marginLeft: "10px" };

const detailBox = { backgroundColor: "white", padding: "20px", borderRadius: "16px", border: "1px solid #e2e8f0", marginBottom: "25px" };
const tableStyle = { width: "100%", borderCollapse: "collapse" as const };
const thStyle = { padding: "10px", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" as const, textAlign: "left" as const };
const tdStyle = { padding: "12px 10px", textAlign: "center" as const };
const tdStyleBold = { ...tdStyle, fontWeight: "600", textAlign: "left" as const };

const actionBtn = { width: "100%", padding: "15px", backgroundColor: "#f97316", color: "white", border: "none", borderRadius: "12px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" };

const modalOverlay = { position: "fixed" as const, top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContent = { backgroundColor: "white", padding: "25px", borderRadius: "16px", width: "90%", maxWidth: "450px" };
const modalGrid = { display: "grid", gridTemplateColumns: "40px 1fr 1fr", gap: "10px", alignItems: "center" };
const modalHeader = { fontWeight: "bold", color: "#475569", textAlign: "center" as const, paddingBottom: "10px" };
const modalRowLabel = { fontWeight: "bold" };
const modalInput = { padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", textAlign: "center" as const };
const cancelBtn = { flex: 1, padding: "12px", backgroundColor: "#e2e8f0", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
const saveBtn = { flex: 1, padding: "12px", backgroundColor: "#0f172a", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" };
