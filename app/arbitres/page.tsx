'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Connexion Cloud

export default function ArbitresPage() {
  const [arbitres, setArbitres] = useState<any[]>([]);
  const [formData, setFormData] = useState({ nom: "", prenom: "" });
  const [user, setUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
    chargerArbitres();
  }, []);

  // --- RÉCUPÉRATION SUPABASE ---
  const chargerArbitres = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('arbitres')
      .select('*')
      .order('nom', { ascending: true });

    if (!error && data) setArbitres(data);
    setLoading(false);
  };

  // Vérification Admin
  const isAdmin = 
    user?.role?.toLowerCase() === 'admin' || 
    user?.username?.toLowerCase() === 'admin' || 
    user?.email === 'anthony.didier.pro@gmail.com';

  const preparerEdition = (arb: any) => {
    if (!isAdmin) return;
    setEditingId(arb.id);
    setFormData({ nom: arb.nom, prenom: arb.prenom });
    setIsModalOpen(true);
  };

  const handleSoumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const payload = { 
      nom: formData.nom.toUpperCase().trim(), 
      prenom: formData.prenom.trim() 
    };

    if (editingId) {
      const { error } = await supabase
        .from('arbitres')
        .update(payload)
        .eq('id', editingId);

      if (!error) chargerArbitres();
    } else {
      const { error } = await supabase
        .from('arbitres')
        .insert([payload]);

      if (!error) chargerArbitres();
    }
    
    fermerModale();
  };

  const fermerModale = () => {
    setFormData({ nom: "", prenom: "" });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const supprimerArbitre = async (id: string) => {
    if (!isAdmin) return;
    if (confirm("Supprimer cet officiel de la liste ?")) {
      const { error } = await supabase
        .from('arbitres')
        .delete()
        .eq('id', id);

      if (!error) chargerArbitres();
    }
  };

  if (loading) return <div style={{ padding: '30px', fontWeight: 'bold' }}>Chargement des officiels...</div>;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>🏁 ARBITRES</h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
            {isAdmin ? "Gestion du corps arbitral Dunkly." : "Liste des officiels de la compétition."}
          </p>
        </div>
        
        {isAdmin && (
          <button onClick={() => setIsModalOpen(true)} style={btnAjouterStyle}>
            + AJOUTER UN ARBITRE
          </button>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {arbitres.map((arb) => (
          <div key={arb.id} style={cardStyle}>
            <div style={decorBar}></div>
            <div style={{ padding: '20px', flex: 1, position: 'relative', display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {isAdmin && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '5px' }}>
                  <button onClick={() => preparerEdition(arb)} style={editIconStyle}>✏️</button>
                  <button onClick={() => supprimerArbitre(arb.id)} style={deleteBtnStyle}>×</button>
                </div>
              )}

              <div style={avatarStyle}>
                {(arb.nom || "A").charAt(0)}{(arb.prenom || "B").charAt(0)}
              </div>
              
              <div>
                <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#1e293b' }}>
                  {arb.nom} {arb.prenom}
                </div>
                <div style={{ color: '#F97316', fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase' }}>
                  Officiel Dunkly
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && isAdmin && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginTop: 0, fontWeight: '800' }}>
              {editingId ? "Modifier l'Officiel" : "Nouvel Officiel"}
            </h2>
            <form onSubmit={handleSoumettre} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
              <div style={inputGroup}>
                <label style={labelStyle}>Nom</label>
                <input 
                  placeholder="NOM" 
                  value={formData.nom} 
                  onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  style={inputStyle} required
                />
              </div>
              <div style={inputGroup}>
                <label style={labelStyle}>Prénom</label>
                <input 
                  placeholder="Prénom" 
                  value={formData.prenom} 
                  onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  style={inputStyle} required
                />
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={confirmBtnStyle}>
                  {editingId ? "Mettre à jour" : "Enregistrer"}
                </button>
                <button type="button" onClick={fermerModale} style={cancelBtnStyle}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- STYLES CONSERVÉS ---
const btnAjouterStyle = { backgroundColor: '#1a1a1a', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', cursor: 'pointer', fontWeight: '900' as const, fontSize: '0.85rem' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(4px)' };
const modalContentStyle: React.CSSProperties = { background: 'white', padding: '40px', borderRadius: '24px', width: '380px' };
const inputGroup = { display: 'flex', flexDirection: 'column' as const, gap: '6px' };
const labelStyle = { fontSize: '0.75rem', fontWeight: '800', color: '#64748b', textTransform: 'uppercase' as const };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '2px solid #f1f5f9', outline: 'none', backgroundColor: '#f8fafc' };
const confirmBtnStyle = { flex: 2, backgroundColor: '#F97316', color: 'white', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const };
const cancelBtnStyle = { flex: 1, backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', padding: '14px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' as const };
const cardStyle: React.CSSProperties = { backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex' };
const decorBar = { width: '6px', backgroundColor: '#1a1a1a' };
const avatarStyle = { width: '45px', height: '45px', backgroundColor: '#1a1a1a', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '0.8rem' };
const deleteBtnStyle: React.CSSProperties = { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' };
const editIconStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', filter: 'grayscale(1)' };