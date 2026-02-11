'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [type, setType] = useState('Championnat');
  const [saison, setSaison] = useState('2025/2026');
  const [logoUrl, setLogoUrl] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    chargerCompetitions();
  }, []);

  const chargerCompetitions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('competitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setCompetitions(data);
    } catch (err: any) {
      console.error("Erreur de chargement:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.username?.toLowerCase() === 'admin' ||
    user?.email === 'anthony.didier.pro@gmail.com';

  const creerCompet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!nom || !isAdmin) return;

    const nouvelle = { 
      nom: nom.trim(), 
      type: type, 
      saison: saison,
      logo_url: logoUrl.trim(),
      statut: 'actif' 
    };

    const { data, error } = await supabase
      .from('competitions')
      .insert([nouvelle])
      .select();

    if (!error && data) {
      setCompetitions([data[0], ...competitions]);
      setNom('');
      setSaison('2025/2026');
      setLogoUrl('');
      setIsModalOpen(false);
    } else if (error) {
      alert("Erreur base de données : " + error.message);
    }
  };

  const supprimerCompet = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (confirm("Voulez-vous vraiment supprimer cette compétition ?")) {
      const { error } = await supabase.from('competitions').delete().eq('id', id);
      if (!error) setCompetitions(competitions.filter(c => c.id !== id));
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1 className="title">🏆 COMPÉTITIONS</h1>
          <p className="subtitle">
            {isAdmin ? "Configurez vos tournois et championnats." : "Liste des épreuves officielles."}
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} style={btnNouveauStyle}>
            + NOUVELLE
          </button>
        )}
      </header>

      {loading ? (
        <div className="loader">🏀 Chargement...</div>
      ) : (
        <div className="grid">
          {competitions.length > 0 ? competitions.map((c) => (
            <Link href={`/competitions/${c.id}`} key={c.id} style={{ textDecoration: 'none' }}>
              <div style={compCardStyle}>
                <div style={decorBar}></div>
                
                <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', flex: 1, position: 'relative' }}>
                  
                  {/* --- BADGE CLÔTURÉ --- */}
                  {c.statut === 'cloture' && (
                    <span style={closedBadgeMiniStyle}>🔒 Clôturée</span>
                  )}

                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.nom} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '10px' }} />
                  ) : (
                    <div style={{...logoPlaceholderStyle, backgroundColor: '#e2e8f0', color: '#94a3b8'}}>🏀</div>
                  )}

                  <div style={{ flex: 1 }}>
                    <span style={typeBadgeStyle(c.type)}>{c.type}</span>
                    <h3 className="comp-name" style={{marginTop: '5px', color: '#1e293b', fontSize: '1.1rem'}}>{c.nom}</h3>
                    <p className="comp-date" style={{fontSize: '0.8rem', color: '#94a3b8'}}>
                      📅 {c.saison || 'Saison inconnue'}
                    </p>
                  </div>
                  
                  {isAdmin && (
                    <button onClick={(e) => supprimerCompet(e, c.id)} style={deleteBtnStyle}>×</button>
                  )}
                </div>
              </div>
            </Link>
          )) : (
            <div style={emptyStateStyle}>
              <span style={{ fontSize: '3rem' }}>🏆</span>
              <p>Aucune compétition active.</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div className="modal-content" style={{ background: 'white', padding: '30px', borderRadius: '20px', width: '400px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0 }}>Créer un tournoi</h2>
            <form onSubmit={creerCompet} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Nom</label>
                <input value={nom} onChange={(e) => setNom(e.target.value)} style={inputStyle} required />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Format</label>
                <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
                  <option value="Championnat">Championnat</option>
                  <option value="Tournoi">Tournoi</option>
                  <option value="Coupe">Coupe</option>
                </select>
              </div>
              
              <div style={inputGroup}>
                <label style={labelStyle}>Saison</label>
                <input value={saison} onChange={(e) => setSaison(e.target.value)} style={inputStyle} required />
              </div>

              <div style={inputGroup}>
                <label style={labelStyle}>URL Logo (optionnel)</label>
                <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle} placeholder="https://..." />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" style={confirmBtnStyle}>Créer</button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={cancelBtnStyle}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
      .container { padding: 20px; maxWidth: 1200px; margin: 0 auto; font-family: sans-serif; }
      .page-header { display: flex; justify-content: flex-start; align-items: center; gap: 20px; margin-bottom: 30px; }
      .title { font-size: 2rem; font-weight: 900; margin: 0; }
      .subtitle { color: #64748b; margin: 5px 0 0 0; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
      .loader { text-align: center; padding: 50px; font-weight: bold; }
      
      @media (max-width: 600px) {
        .page-header { flex-direction: column; align-items: flex-start; gap: 15px; }
        .grid { grid-template-columns: 1fr; }
      }
    `}</style>
    </div>
  );
}

const btnNouveauStyle = { backgroundColor: '#F97316', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '900' as const, fontSize: '0.8rem' };
const typeBadgeStyle = (type: string) => ({ display: 'inline-block', width: 'fit-content', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: '800' as const, backgroundColor: type === 'Championnat' ? '#eff6ff' : '#fff7ed', color: type === 'Championnat' ? '#2563eb' : '#ea580c' });
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 };
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '5px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: '#64748b' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9', outline: 'none', fontSize: '1rem' };
const confirmBtnStyle = { flex: 2, backgroundColor: '#F97316', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' as const };
const cancelBtnStyle = { flex: 1, backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' };
const compCardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '18px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', minHeight: '110px', transition: 'transform 0.1s ease', cursor: 'pointer' };
const decorBar = { width: '6px', backgroundColor: '#F97316' };
const deleteBtnStyle: React.CSSProperties = { position: 'absolute', top: '10px', right: '10px', background: 'white', border: '1px solid #fee2e2', color: '#ef4444', cursor: 'pointer', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', zIndex: 10 };
const emptyStateStyle: React.CSSProperties = { gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: '#94a3b8', backgroundColor: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0' };

// --- CORRECTION ICI : Positionnement absolu pour le badge ---
const closedBadgeMiniStyle: React.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '40px', // Decalè pour ne pas chevaucher le bouton supprimer
  backgroundColor: '#fee2e2',
  color: '#ef4444',
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '0.7rem',
  fontWeight: 'bold',
  zIndex: 10
};
const logoPlaceholderStyle = { width: '60px', height: '60px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' };