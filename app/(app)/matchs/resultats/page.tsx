'use client';

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Match {
  id: string;
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
  competition_nom: string;
  competition?: { logo_url?: string } | null;
  journees?: { id: string; nom: string } | null;
}

export default function ResultatsPage() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState<any>(null);

  const formatDate = (date: string) =>
    date ? new Date(date).toLocaleDateString("fr-FR") : "NC";
  console.log("Utilisateur actuel :", user);

  // app/matchs/resultats/page.tsx

  const chargerDonneesInitiales = useCallback(async () => {
    setLoading(true);
    // 2. Charger TOUS les matchs depuis Supabase
    const { data, error } = await supabase
      .from("matchs")
      .select(`
      *, 
      competition!left(logo_url, nom), 
      journees!left(id, nom)
    `)
      // --- LE FILTRE A ÉTÉ SUPPRIMÉ ICI ---
      .order("date", { ascending: false });

    if (error) console.error("Erreur Supabase:", error);
    else setMatchs(data || []);

    setLoading(false);
  }, []);

  useEffect(() => {
    // --- CORRECTION : Appel de la fonction async interne ---
    chargerDonneesInitiales();

    // S'abonner aux changements de la table "matchs"
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matchs" },
        () => chargerDonneesInitiales() // Recharger si changement
      )
      .subscribe();

    // Fonction de nettoyage : se désabonner quand le composant se démonte
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chargerDonneesInitiales]);

  const isAdmin =
    user?.role?.toLowerCase() === "admin" ||
    user?.email === "anthony.didier.pro@gmail.com";

  const matchGroupes = useMemo(() => {
    const filtered = matchs.filter(
      (m) =>
        m.clubA.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.clubB.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.competition_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.journees?.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce(
      (acc, match) => {
        const competName = match.competition_nom || "Autres";
        const nomJournee = match.journees?.nom || "Hors Journée";
        const competLogo = match.competition?.logo_url;

        if (!acc[competName]) acc[competName] = { logo: competLogo, journees: {} };
        if (!acc[competName].logo && competLogo) acc[competName].logo = competLogo;
        if (!acc[competName].journees[nomJournee]) acc[competName].journees[nomJournee] = [];

        acc[competName].journees[nomJournee].push(match);
        return acc;
      },
      {} as Record<string, { logo?: string; journees: Record<string, Match[]> }>
    );
  }, [matchs, searchTerm]);

  if (loading) return <div style={loadingStyle}>🏀 Chargement des scores...</div>;

  return (
    <div style={pageContainer}>
      {/* HEADER */}
      <header style={dashboardHeader}>
        <div style={headerTop}>
          <div style={headerLeft}>
            <h1 style={headerTitle}>
              RÉSULTATS <span style={orangeDot}>.</span>
            </h1>
            <p style={subtitle}>Consultez les derniers scores de la saison.</p>
          </div>
          {/* --- BOUTON ADMIN : MATCHS À VENIR --- */}
          {isAdmin && (
            <Link
              href="/admin/matchs-a-venir"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1E293B',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '12px',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.9rem',
                marginTop: '10px',
                border: '1px solid #334155'
              }}
            >
              <span>⚙️</span> Gérer les matchs à venir
            </Link>
          )}
        </div>
        <input
          type="text"
          placeholder="Rechercher club, compétition ou journée..."
          style={searchInput}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* MATCHS */}
      {Object.entries(matchGroupes).map(([compet, competData]) => (
        <div key={compet} style={competSection}>
          <h2 style={competTitle}>
            {competData.logo && (
              <img src={competData.logo} alt={compet} style={competLogoStyle} />
            )}
            🏆 {compet}
          </h2>

          {Object.entries(competData.journees).map(([nomJournee, matchsJournee]) => (
            <div key={nomJournee}>
              <h3 style={journeeTitle}>{nomJournee}</h3>
              <div style={matchsGrid}>
                {matchsJournee.map((m) => (
                  <Link
                    href={`/matchs/resultats/${m.id}`}
                    key={m.id}
                    style={matchCardLink}
                  >
                    <div style={matchCard}>
                      <div
                        style={{
                          ...statusBorder,
                          backgroundColor: m.status === "en-cours" ? "#22c55e" : "#f97316",
                        }}
                      />
                      <div style={cardContent}>
                        <div style={cardTop}>
                          <span style={dateStyle}>{formatDate(m.date)}</span>
                        </div>

                        <div style={mainScoreRow}>
                          {/* Équipe A */}
                          <div style={{ ...teamInfo, textAlign: "right" }}>
                            <div style={teamFlexRow}>
                              <span style={teamNameStyle}>{m.clubA}</span>
                              {m.logo_urlA ? (
                                <img
                                  src={m.logo_urlA || m.competition?.logo_url || "/default-logo.png"}
                                  alt={m.clubA}
                                  style={logoStyle}
                                />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubA?.[0] || "?"}</div>
                              )}
                            </div>
                            <span style={teamCatStyle}>{m.equipeA}</span>
                          </div>

                          {/* Score */}
                          <div style={scoreBadge}>
                            <span style={scoreNum}>{m.scoreA ?? 0}</span>
                            <span style={scoreSep}>-</span>
                            <span style={scoreNum}>{m.scoreB ?? 0}</span>
                          </div>

                          {/* Équipe B */}
                          <div style={{ ...teamInfo, textAlign: "left" }}>
                            <div style={teamFlexRow}>
                              {m.logo_urlB ? (
                                <img
                                  src={m.logo_urlB || m.competition?.logo_url || "/default-logo.png"}
                                  alt={m.clubB}
                                  style={logoStyle}
                                />
                              ) : (
                                <div style={logoPlaceholderStyle}>{m.clubB?.[0] || "?"}</div>
                              )}
                              <span style={teamNameStyle}>{m.clubB}</span>
                            </div>
                            <span style={teamCatStyle}>{m.equipeB}</span>
                          </div>
                        </div>

                        <div style={cardBottom}>
                          <div style={locationStyle}>📍 {m.lieu || "Lieu non défini"}</div>
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
        <div style={emptyState}>Aucun match ne correspond à votre recherche.</div>
      )}
    </div>
  );
}

// --- Styles (inchangés) ---
const loadingStyle = {
  display: "flex" as const,
  height: "100vh",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "system-ui, sans-serif",
  backgroundColor: "#f8fafc",
  color: "#64748b",
};
const pageContainer = {
  padding: "20px",
  width: "100%",
  boxSizing: "border-box" as const,
  fontFamily: "system-ui, sans-serif",
  backgroundColor: "#f8fafc",
  minHeight: "100vh",
};
const dashboardHeader = { display: "flex" as const, flexDirection: "column" as const, gap: "15px", marginBottom: "30px" };
const headerTop = { display: "flex" as const, justifyContent: "space-between", alignItems: "center", gap: "15px" };
const headerLeft = {};
const headerTitle = { fontSize: "1.8rem", fontWeight: "800" as const, color: "#0f172a", margin: 0 };
const orangeDot = { color: "#f97316" };
const subtitle = { color: "#64748b", fontSize: "0.9rem", margin: "5px 0 0" };
const searchInput = { padding: "12px 16px", borderRadius: "16px", border: "1px solid #e2e8f0", background: "white", width: "100%", outline: "none", fontSize: "0.95rem", boxSizing: "border-box" as const };
const btnAdminMobile = { backgroundColor: "#0f172a", color: "white", textDecoration: "none", padding: "10px 15px", borderRadius: "12px", fontWeight: "bold" as const, fontSize: "0.85rem", whiteSpace: "nowrap" as const };
const competSection = { marginBottom: "40px" };
const competTitle = { display: "flex" as const, alignItems: "center", gap: "15px", fontSize: "1.4rem", fontWeight: "800" as const, color: "#0f172a", marginBottom: "25px", paddingBottom: "15px", borderBottom: "2px solid #e2e8f0" };
const competLogoStyle = { width: "40px", height: "40px", objectFit: "contain" as const };
const journeeTitle = { color: "#f97316", fontWeight: "800" as const, fontSize: "1.1rem", marginBottom: "15px", paddingLeft: "10px", borderLeft: "3px solid #f97316" };
const matchsGrid = { display: "grid" as const, gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" };
const matchCardLink = { textDecoration: "none", color: "inherit" };
const matchCard = { backgroundColor: "white", borderRadius: "20px", display: "flex" as const, overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)", border: "1px solid #f1f5f9", transition: "transform 0.2s", height: "100%" };
const statusBorder = { width: "6px", flexShrink: 0 };
const cardContent = { flex: 1, padding: "15px", display: "flex" as const, flexDirection: "column" as const, justifyContent: "space-between" as const };
const cardTop = { display: "flex" as const, justifyContent: "space-between", marginBottom: "10px" };
const dateStyle = { fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" as const };
const mainScoreRow = { display: "flex" as const, alignItems: "center", justifyContent: "space-between", gap: "10px", margin: "5px 0" };
const teamInfo = { display: "flex" as const, flexDirection: "column" as const, width: "40%" };
const teamFlexRow = { display: "flex" as const, alignItems: "center", gap: "10px" };
const teamNameStyle = { fontSize: "0.9rem", fontWeight: "800" as const, color: "#0f172a", textTransform: "uppercase" as const };
const teamCatStyle = { fontSize: "0.7rem", color: "#94a3b8", fontWeight: "600" as const };
const scoreBadge = { background: "#f8fafc", padding: "6px 12px", borderRadius: "12px", display: "flex" as const, alignItems: "center", gap: "5px", border: "1px solid #e2e8f0" };
const scoreNum = { fontSize: "1.2rem", fontWeight: "900" as const, color: "#0f172a" };
const scoreSep = { color: "#cbd5e1", fontWeight: "bold" as const };
const cardBottom = { marginTop: "10px", paddingTop: "10px", borderTop: "1px solid #f1f5f9", fontSize: "0.75rem", color: "#64748b", fontWeight: "600" as const };
const locationStyle = { fontSize: "0.75rem", color: "#64748b", marginTop: "5px" };
const emptyState = { textAlign: "center" as const, padding: "40px", color: "#64748b", background: "white", borderRadius: "20px", border: "2px dashed #e2e8f0" };
const logoStyle = { width: "35px", height: "35px", borderRadius: "50%", objectFit: "contain" as const, backgroundColor: "white", border: "1px solid #f1f5f9" };
const logoPlaceholderStyle = { width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex" as const, alignItems: "center", justifyContent: "center", fontWeight: "bold" as const, fontSize: "1rem", color: "#64748b" };