"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Interfaces
interface EquipeIntern { id: string; nom: string; }
interface Club { id: string; nom: string; equipes: EquipeIntern[]; logo_url?: string; }
interface Competition { id: string; nom: string; }
// --- AJOUT: Interface Journée ---
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
  // --- AJOUT: Champ journee_id ---
  journee_id?: string;
}

export default function MatchsAVenirPage() {
  const [matchs, setMatchs] = useState<Match[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [arbitres, setArbitres] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  // --- AJOUT: État pour les journées ---
  const [journees, setJournees] = useState<Journee[]>([]);
  
  const [user, setUser] = useState<any>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [selectedClubA, setSelectedClubA] = useState("");
  const [selectedClubB, setSelectedClubB] = useState("");
  // --- AJOUT: État pour la journée sélectionnée ---
  const [selectedJournee, setSelectedJournee] = useState("");
  
  const [dureePeriode, setDureePeriode] = useState("10");
  const [tmMT1, setTmMT1] = useState("2");
  const [tmMT2, setTmMT2] = useState("3");

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
      .select('*')
      .eq('status', 'a-venir')
      .order('date', { ascending: true });

    if (listMatchs) setMatchs(listMatchs);

    const { data: listClubs } = await supabase.from('equipes_clubs').select('*');
    const { data: listArb } = await supabase.from('arbitres').select('*').order('nom', { ascending: true });
    const { data: listComp } = await supabase.from('competitions').select('*');
    // --- AJOUT: Chargement des journées ---
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
      // --- AJOUT: Sauvegarde de la journée ---
      journee_id: selectedJournee || null,
      
      arbitre: selectedArbitres.join(" / "),
      lieu: newMatch.lieu,
      status: 'a-venir',
      scoreA: 0,
      scoreB: 0,
      config: {
        tempsInitial: parseInt(dureePeriode) * 60,
        tmMT1: parseInt(tmMT1),
        tmMT2: parseInt(tmMT2)
      }
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
    // --- AJOUT: Chargement journée lors de l'édition ---
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
    // --- AJOUT: Reset journée ---
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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>📅 Matchs à venir</h1>
        {isAdmin && (
          <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={addBtnStyle}>
            {showForm ? "Annuler" : "+ Créer un Match"}
          </button>
        )}
      </div>

      {/* FORMULAIRE DE CRÉATION/ÉDITION */}
      {isAdmin && showForm && (
        <div style={formCardStyle}>
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

            {/* --- AJOUT: Sélecteur de Journée --- */}
            <div style={colStyle}>
              <label style={miniLabel}>JOURNÉE</label>
              <select value={selectedJournee} onChange={e => setSelectedJournee(e.target.value)} style={inputStyle}>
                <option value="">Sélectionner une journée...</option>
                {journees.map(j => <option key={j.id} value={j.id}>{j.nom}</option>)}
              </select>
            </div>
            {/* ------------------------------------------- */}

            <div style={colStyle}>
              <label style={miniLabel}>COMPÉTITION</label>
              <select required value={newMatch.competition} onChange={e => setNewMatch({ ...newMatch, competition: e.target.value })} style={inputStyle}>
                <option value="">Sélectionner...</option>
                {competitions.map(comp => <option key={comp.id} value={comp.nom}>{comp.nom}</option>)}
              </select>
            </div>

            <div style={{ ...colStyle, gridColumn: '1 / span 2' }}>
              <label style={miniLabel}>ARBITRES</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                {arbitres.length > 0 ? arbitres.map(a => {
                  const nomComplet = `${a.prenom} ${a.nom}`;
                  const isSelected = selectedArbitres.includes(nomComplet);
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleArbitre(nomComplet)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        border: 'none',
                        fontSize: '0.8rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#F97316' : '#e2e8f0',
                        color: isSelected ? 'white' : '#475569',
                        transition: '0.2s'
                      }}
                    >
                      {nomComplet} {isSelected ? '✕' : '+'}
                    </button>
                  );
                }) : <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Aucun arbitre dans la base...</span>}
              </div>
            </div>

            <div style={colStyle}>
              <label style={miniLabel}>DURÉE PÉRIODE (MIN)</label>
              <select value={dureePeriode} onChange={e => setDureePeriode(e.target.value)} style={inputStyle}>
                <option value="8">8 minutes</option>
                <option value="10">10 minutes</option>
                <option value="12">12 minutes</option>
              </select>
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
      <div style={{ display: 'grid', gap: '15px' }}>
        {matchs.map((m) => (
          <div key={m.id} style={matchCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              <div style={{ flex: 1, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1e293b', textTransform: 'uppercase' }}>{m.clubA}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>{m.equipeA}</div>
                </div>
                {m.logo_urlA && <img src={m.logo_urlA} alt={m.clubA} style={logoStyle} />}
              </div>

              <div style={{ padding: '0 20px', fontWeight: '900', color: '#F97316', fontSize: '1.3rem' }}>VS</div>
              
              <div style={{ flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '10px' }}>
                {m.logo_urlB && <img src={m.logo_urlB} alt={m.clubB} style={logoStyle} />}
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.2rem', color: '#1e293b', textTransform: 'uppercase' }}>{m.clubB}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>{m.equipeB}</div>
                </div>
              </div>
            </div>
            
            <div style={footerCard}>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                <div>📅 {formatteDateParis(m.date)} | {m.competition}</div>
                <div style={{ marginTop: 4 }}>🏁 <span style={{ fontWeight: 'bold', color: '#1e293b' }}>{m.arbitre || "Non assigné"}</span></div>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
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

// --- STYLES ---
const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', width: '100%', boxSizing: 'border-box' as const };
const addBtnStyle = { backgroundColor: '#111827', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
const submitBtn = { gridColumn: '1/span 2', backgroundColor: '#F97316', color: 'white', padding: '14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '900' as const, border: 'none', marginTop: '10px' };
const formCardStyle = { marginBottom: '30px', padding: '20px', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #eee' };
const colStyle = { display: 'flex', flexDirection: 'column' as const, gap: '5px' };
const miniLabel = { fontSize: '0.65rem', fontWeight: '900' as const, color: '#64748b', marginBottom: '2px' };
const matchCardStyle = { padding: '20px', border: '1px solid #f1f1f1', borderRadius: '12px', background: 'white', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const footerCard = { marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const startBtnStyle = { backgroundColor: '#1E293B', color: 'white', textDecoration: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' };
const detailsBtnStyle = { backgroundColor: '#F97316', color: 'white', textDecoration: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold' };
const iconBtn = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem' };
const editBtnSmall = { border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold' as const, fontSize: '0.75rem' };
const logoStyle = { width: '40px', height: '40px', objectFit: 'contain' as const };