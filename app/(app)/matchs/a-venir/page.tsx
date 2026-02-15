'use client';
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interfaces
interface EquipeIntern { id: string; nom: string; }
interface Club { id: string; nom: string; equipes: EquipeIntern[]; logo_url?: string; }
interface Competition { id: string; nom: string; }
interface Journee { id: string; nom: string; competition_id: string; }

interface Match {
  id: string;
  clubA: string;
  equipeA: string;
  clubB: string;
  equipeB: string;
  date: string;
  competition: string;
  lieu: string;
  arbitre: string;
  status: string;
  logo_urlA?: string;
  logo_urlB?: string;
  journee_id?: string;
  journees?: { nom: string } | null;
}

export default function MatchsAVenirPage() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [arbitres, setArbitres] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [journees, setJournees] = useState<Journee[]>([]);
  
  const [user, setUser] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedClubA, setSelectedClubA] = useState("");
  const [selectedClubB, setSelectedClubB] = useState("");
  const [selectedJournee, setSelectedJournee] = useState("");
  const [selectedArbitres, setSelectedArbitres] = useState<string[]>([]);
  
  const [newMatch, setNewMatch] = useState({
    equipeA: "", clubA: "", equipeB: "", clubB: "",
    date: "", competition: "", lieu: ""
  });

  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    chargerDonnees();
  }, []);

  const isAdmin = user && (
    user.role === 'admin' ||
    user.username?.toLowerCase() === 'admin' ||
    user.username?.toLowerCase() === 'anthony.didier.prop'
  );

  const chargerDonnees = async () => {
    const { data: listMatchs } = await supabase
      .from('matchs')
      .select('*, journees(nom)')
      .eq('status', 'a-venir')
      .order('date', { ascending: true });

    if (listMatchs) setMatchs(listMatchs);

    const { data: listClubs } = await supabase.from('equipes_clubs').select('*');
    const { data: listArb } = await supabase.from('arbitres').select('*').order('nom', { ascending: true });
    const { data: listComp } = await supabase.from('competitions').select('*');
    const { data: listJournees } = await supabase.from('journees').select('*');

    if (listClubs) setClubs(listClubs);
    if (listArb) setArbitres(listArb);
    if (listComp) setCompetitions(listComp);
    if (listJournees) setJournees(listJournees);
  };

  const toggleArbitre = (nomComplet: string) => {
    if (selectedArbitres.includes(nomComplet)) {
      setSelectedArbitres(selectedArbitres.filter(a => a !== nomComplet));
    } else {
      setSelectedArbitres([...selectedArbitres, nomComplet]);
    }
  };

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const clubAObj = clubs.find(c => c.id === selectedClubA);
    const clubBObj = clubs.find(c => c.id === selectedClubB);

    const matchData = {
      clubA: clubAObj?.nom,
      logo_urlA: clubAObj?.logo_url || null, 
      equipeA: newMatch.equipeA,
      clubB: clubBObj?.nom,
      logo_urlB: clubBObj?.logo_url || null,
      equipeB: newMatch.equipeB,
      date: newMatch.date,
      competition: newMatch.competition,
      journee_id: selectedJournee || null,
      arbitre: selectedArbitres.join(" / "),
      lieu: newMatch.lieu,
      status: 'a-venir',
      scoreA: 0,
      scoreB: 0,
    };

    if (editingId) {
      const { error } = await supabase.from('matchs').update(matchData).eq('id', editingId);
      if (error) alert("Erreur Update: " + error.message);
    } else {
      const { error } = await supabase.from('matchs').insert([matchData]);
      if (error) alert("Erreur Insert: " + error.message);
    }

    await chargerDonnees();
    resetForm();
  };

  const handleEditer = (m: any) => {
    setEditingId(m.id);
    setNewMatch({
      equipeA: m.equipeA, clubA: m.clubA, equipeB: m.equipeB, clubB: m.clubB,
      date: m.date, competition: m.competition, lieu: m.lieu || ""
    });

    if (m.arbitre) {
      setSelectedArbitres(m.arbitre.split(" / "));
    }

    const clubAObj = clubs.find(c => c.nom === m.clubA);
    const clubBObj = clubs.find(c => c.nom === m.clubB);
    if (clubAObj) setSelectedClubA(clubAObj.id);
    if (clubBObj) setSelectedClubB(clubBObj.id);
    
    setSelectedJournee(m.journee_id || "");
    setShowForm(true);
  };

  const handleSupprimer = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce match ?")) return;
    const { error } = await supabase.from('matchs').delete().eq('id', id);
    if (error) {
      alert("Erreur: " + error.message);
    } else {
      chargerDonnees();
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setNewMatch({ equipeA: "", clubA: "", equipeB: "", clubB: "", date: "", competition: "", lieu: "" });
    setSelectedArbitres([]);
    setSelectedClubA("");
    setSelectedClubB("");
    setSelectedJournee("");
  };

  const formatteDateParis = (dateString: string) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(dateString)).replace(':', 'h');
  };

  return (
    <div style={pageContainer}>
      <header style={headerStyle}>
        <div>
          <h1 style={titleStyle}>📅 Matchs à venir</h1>
          <p style={subtitleStyle}>Gestion et planification des prochaines rencontres.</p>
        </div>
        {isAdmin && (
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={addBtnStyle}>
            {showForm ? "Annuler" : "+ Créer un Match"}
          </button>
        )}
      </header>

      {/* FORMULAIRE */}
      {isAdmin && showForm && (
        <div style={formCardStyle}>
          <h2 style={formTitleStyle}>{editingId ? "Modifier le match" : "Nouveau match"}</h2>
          <form onSubmit={handleSoumettre} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            <div style={colStyle}>
              <label style={miniLabel}>ÉQUIPE DOMICILE</label>
              <select required value={selectedClubA} onChange={e => setSelectedClubA(e.target.value)} style={inputStyle}>
                <option value="">Choisir Club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <select required value={newMatch.equipeA} onChange={e => setNewMatch({ ...newMatch, equipeA: e.target.value })} style={inputStyle} disabled={!selectedClubA}>
                <option value="">Choisir Équipe...</option>
                {(clubs.find(c => c.id === selectedClubA)?.equipes || []).map(eq => <option key={eq.id} value={eq.nom}>{eq.nom}</option>)}
              </select>
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>ÉQUIPE EXTÉRIEUR</label>
              <select required value={selectedClubB} onChange={e => setSelectedClubB(e.target.value)} style={inputStyle}>
                <option value="">Choisir Club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <select required value={newMatch.equipeB} onChange={e => setNewMatch({ ...newMatch, equipeB: e.target.value })} style={inputStyle} disabled={!selectedClubB}>
                <option value="">Choisir Équipe...</option>
                {(clubs.find(c => c.id === selectedClubB)?.equipes || []).map(eq => <option key={eq.id} value={eq.nom}>{eq.nom}</option>)}
              </select>
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>JOURNÉE</label>
              <select value={selectedJournee} onChange={e => setSelectedJournee(e.target.value)} style={inputStyle}>
                <option value="">Sélectionner une journée...</option>
                {journees.map(j => <option key={j.id} value={j.id}>{j.nom}</option>)}
              </select>
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>COMPÉTITION</label>
              <select required value={newMatch.competition} onChange={e => setNewMatch({ ...newMatch, competition: e.target.value })} style={inputStyle}>
                <option value="">Sélectionner...</option>
                {competitions.map(comp => <option key={comp.id} value={comp.nom}>{comp.nom}</option>)}
              </select>
            </div>

            <div style={{ ...colStyle, gridColumn: '1 / span 2' }}>
              <label style={miniLabel}>ARBITRES</label>
              <div style={arbitreGridStyle}>
                {arbitres.length > 0 ? arbitres.map(a => {
                  const nomComplet = `${a.prenom} ${a.nom}`;
                  const isSelected = selectedArbitres.includes(nomComplet);
                  return (
                    <button key={a.id} type="button" onClick={() => toggleArbitre(nomComplet)} style={{
                      ...arbitreBtnStyle,
                      backgroundColor: isSelected ? '#F97316' : '#334155',
                      color: isSelected ? 'white' : '#f1f5f9',
                    }}>
                      {nomComplet} {isSelected ? '✕' : '+'}
                    </button>
                  );
                }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Aucun arbitre dans la base...</span>}
              </div>
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>DATE & HEURE</label>
              <input type="datetime-local" required value={newMatch.date} onChange={e => setNewMatch({ ...newMatch, date: e.target.value })} style={inputStyle} />
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>📍 LIEU / GYMNASE</label>
              <input type="text" placeholder="Ex: Gymnase André Carton" value={newMatch.lieu} onChange={e => setNewMatch({ ...newMatch, lieu: e.target.value })} style={inputStyle} />
            </div>

            <button type="submit" style={submitBtn}>{editingId ? "METTRE À JOUR" : "CRÉER LE MATCH"}</button>
          </form>
        </div>
      )}

      {/* LISTE DES MATCHS */}
      <div style={{ display: 'grid', gap: '20px' }}>
        {matchs.length === 0 && <div style={emptyState}>Aucun match à venir programmé.</div>}
        {matchs.map((m) => (
          <div key={m.id} style={matchCardStyle}>
            <div style={cardMainRow}>
              
              <div style={teamContainerStyle}>
                {m.logo_urlA && <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />}
                <div style={teamNameWrapper}>
                  <div style={clubNameStyle}>{m.clubA}</div>
                  <div style={teamCatStyle}>{m.equipeA}</div>
                </div>
              </div>

              <div style={vsStyle}>VS</div>
              
              <div style={{...teamContainerStyle, justifyContent: 'flex-start', textAlign: 'left'}}>
                <div style={teamNameWrapper}>
                  <div style={clubNameStyle}>{m.clubB}</div>
                  <div style={teamCatStyle}>{m.equipeB}</div>
                </div>
                {m.logo_urlB && <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />}
              </div>
            </div>
            
            <div style={footerCard}>
              <div style={footerInfoStyle}>
                {m.journees && <div style={journeeBadgeStyle}>🏆 {m.journees.nom}</div>}
                <div style={dateLocationStyle}>📅 {formatteDateParis(m.date)} | {m.competition} | 📍 {m.lieu || 'Lieu non défini'}</div>
                <div style={refereeStyle}>🏁 <span style={{ fontWeight: '700', color: 'white' }}>{m.arbitre || "Arbitre non assigné"}</span></div>
              </div>
              
              <div style={actionButtonsStyle}>
                {isAdmin ? (
                  <>
                    <button onClick={() => handleSupprimer(m.id)} style={iconBtn}>🗑️</button>
                    <button onClick={() => handleEditer(m)} style={editBtnSmall}>✎ Modifier</button>
                    <Link href={`/matchs/${m.id}`} style={startBtnStyle}>🚀 GÉRER</Link>
                  </>
                ) : (
                  <Link href={`/matchs/resultats/${m.id}`} style={detailsBtnStyle}>VOIR DÉTAILS</Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STYLES CORRIGÉS (Sombre, Pleine Largeur, Arrondis Modernes) ---
const pageContainer = { 
  padding: '24px', 
  width: '100%',
  boxSizing: 'border-box' as const,
  fontFamily: 'system-ui, -apple-system, sans-serif', 
  backgroundColor: '#0f172a', 
  minHeight: '100vh', 
  color: '#f1f5f9' 
};

const headerStyle = { 
  display: 'flex' as const, 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  marginBottom: '40px', 
  paddingBottom: '20px', 
  borderBottom: '1px solid #334155' 
};

const titleStyle = { fontSize: '2.5rem', fontWeight: '800' as const, margin: 0, color: 'white' };
const subtitleStyle = { color: '#94a3b8', fontSize: '1rem', margin: '8px 0 0' };

const addBtnStyle = { 
  backgroundColor: '#F97316', 
  color: 'white', 
  border: 'none', 
  padding: '14px 28px', 
  borderRadius: '16px', // Arrondi plus prononcé
  fontWeight: 'bold' as const, 
  cursor: 'pointer', 
  fontSize: '0.95rem',
  transition: 'background-color 0.2s'
};

const formCardStyle = { 
  marginBottom: '40px', 
  padding: '30px', 
  borderRadius: '24px', // Arrondi carte
  backgroundColor: '#1e293b', 
  border: '1px solid #334155', 
  boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' 
};

const formTitleStyle = { fontSize: '1.5rem', fontWeight: '800' as const, marginBottom: '25px', color: 'white' };

const inputStyle = { 
  padding: '14px', 
  borderRadius: '12px', // Arrondi input
  border: '1px solid #334155', 
  fontSize: '15px', 
  width: '100%', 
  boxSizing: 'border-box' as const, 
  backgroundColor: '#0f172a', 
  color: 'white' 
};

const colStyle = { display: 'flex' as const, flexDirection: 'column' as const, gap: '8px' };

const miniLabel = { fontSize: '0.7rem', fontWeight: '900' as const, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '1px' };

const arbitreGridStyle = { 
  display: 'flex' as const, 
  flexWrap: 'wrap' as const, 
  gap: '10px', 
  padding: '16px', 
  background: '#0f172a', 
  borderRadius: '16px', // Arrondi grille
  border: '1px solid #334155' 
};

const arbitreBtnStyle = { 
  padding: '8px 16px', 
  borderRadius: '20px', // Arrondi badge
  border: 'none', 
  fontSize: '0.8rem', 
  fontWeight: 'bold' as const, 
  cursor: 'pointer', 
  transition: '0.2s' 
};

const submitBtn = { 
  gridColumn: '1/span 2', 
  backgroundColor: '#F97316', 
  color: 'white', 
  padding: '16px', 
  borderRadius: '16px', // Arrondi bouton
  cursor: 'pointer', 
  fontWeight: '900' as const, 
  border: 'none', 
  marginTop: '20px', 
  fontSize: '1.1rem' 
};

const matchCardStyle = { 
  padding: '24px', 
  border: '1px solid #334155', 
  borderRadius: '24px', // Arrondi carte
  background: '#1e293b', 
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
  transition: 'transform 0.2s, box-shadow 0.2s' 
};

const cardMainRow = { display: 'flex' as const, justifyContent: 'space-between', alignItems: 'center', gap: '20px' };

const teamContainerStyle = { flex: 1, display: 'flex' as const, alignItems: 'center', gap: '15px' };
const teamNameWrapper = { display: 'flex' as const, flexDirection: 'column' as const };
const clubNameStyle = { fontWeight: '800' as const, fontSize: '1.2rem', color: 'white', textTransform: 'uppercase' as const };
const teamCatStyle = { fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' as const };
const logoStyle = { width: '60px', height: '60px', objectFit: 'contain' as const, flexShrink: 0 };
const vsStyle = { fontWeight: '900' as const, color: '#F97316', fontSize: '1.5rem', padding: '0 10px' };

const footerCard = { 
  marginTop: '24px', 
  paddingTop: '20px', 
  borderTop: '1px solid #334155', 
  display: 'flex' as const, 
  justifyContent: 'space-between', 
  alignItems: 'center', 
  gap: '15px' 
};

const footerInfoStyle = { fontSize: '0.9rem', color: '#cbd5e1' };
const journeeBadgeStyle = { fontWeight: 'bold' as const, color: '#F97316', marginBottom: '8px', fontSize: '1rem' };
const dateLocationStyle = { marginBottom: '6px' };
const refereeStyle = { marginTop: '8px', fontSize: '0.85rem' };
const actionButtonsStyle = { display: 'flex' as const, gap: '12px', flexShrink: 0 };

const startBtnStyle = { 
  backgroundColor: '#F97316', 
  color: 'white', 
  textDecoration: 'none' as const, 
  padding: '12px 24px', 
  borderRadius: '12px', 
  fontSize: '0.9rem', 
  fontWeight: 'bold' as const 
};

const detailsBtnStyle = { 
  backgroundColor: '#334155', 
  color: 'white', 
  textDecoration: 'none' as const, 
  padding: '12px 24px', 
  borderRadius: '12px', 
  fontSize: '0.9rem', 
  fontWeight: 'bold' as const 
};

const iconBtn = { 
  border: 'none', 
  background: '#334155', 
  cursor: 'pointer', 
  fontSize: '1.2rem', 
  padding: '12px', 
  borderRadius: '12px', 
  color: 'white' 
};

const editBtnSmall = { 
  border: 'none', 
  background: '#334155', 
  color: 'white', 
  cursor: 'pointer', 
  padding: '12px 18px', 
  borderRadius: '12px', 
  fontWeight: 'bold' as const, 
  fontSize: '0.85rem' 
};

const emptyState = { 
  textAlign: 'center' as const, 
  padding: '60px', 
  color: '#94a3b8', 
  backgroundColor: '#1e293b', 
  borderRadius: '24px', 
  border: '1px solid #334155' 
};