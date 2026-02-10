'use client';
import { useState, useEffect } from 'react';
import { getFromLocal, saveToLocal } from '@/lib/store';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ username: '', password: '' });
  const router = useRouter();

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (storedUser.username !== 'admin') {
      router.push('/');
      return;
    }
    setUsers(getFromLocal('users') || []);
  }, [router]);

  const supprimerUser = (usernameToDelete: string) => {
    if (usernameToDelete === 'admin') return alert("Impossible de supprimer l'admin !");
    
    if (confirm(`Voulez-vous vraiment supprimer ${usernameToDelete} ?`)) {
      const currentUsers: any[] = getFromLocal('users') || [];
      const nouvelleListe = currentUsers.filter((u: any) => u.username !== usernameToDelete);
      saveToLocal('users', nouvelleListe);
      setUsers(nouvelleListe);
    }
  };

  const preparerEdition = (user: any) => {
    setEditingUser(user.username);
    setEditForm({ username: user.username, password: user.password });
  };

  const sauvegarderEdition = (oldUsername: string) => {
    if (!editForm.username) return alert("Pseudo requis");
    
    const currentUsers: any[] = getFromLocal('users') || [];
    const nouvelleListe = currentUsers.map((u: any) => 
      u.username === oldUsername ? { ...u, username: editForm.username, password: editForm.password } : u
    );

    saveToLocal('users', nouvelleListe);
    setUsers(nouvelleListe);
    setEditingUser(null);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>
          👥 GESTION <span style={{ color: '#F97316' }}>MEMBRES</span>
        </h1>
        <p style={{ color: '#64748b', marginTop: '5px' }}>Administrez les accès à la plateforme Dunkly.</p>
      </header>

      <div style={cardContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#1a1a1a', color: 'white' }}>
              <th style={thStyle}>UTILISATEUR</th>
              <th style={thStyle}>MOT DE PASSE</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.username} style={trStyle}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={avatarCircle}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    {editingUser === u.username ? (
                      <input 
                        style={editInputStyle} 
                        value={editForm.username} 
                        onChange={e => setEditForm({...editForm, username: e.target.value})}
                      />
                    ) : (
                      <span style={{ fontWeight: '700', color: '#1e293b' }}>
                        {u.username} {u.username === 'admin' && '🛡️'}
                      </span>
                    )}
                  </div>
                </td>
                <td style={tdStyle}>
                  {editingUser === u.username ? (
                    <input 
                      type="text"
                      style={editInputStyle} 
                      value={editForm.password} 
                      onChange={e => setEditForm({...editForm, password: e.target.value})}
                    />
                  ) : (
                    <code style={passwordCode}>••••••••</code>
                  )}
                </td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    {editingUser === u.username ? (
                      <>
                        <button onClick={() => sauvegarderEdition(u.username)} style={btnSaveStyle}>Enregistrer</button>
                        <button onClick={() => setEditingUser(null)} style={btnCancelStyle}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => preparerEdition(u)} style={btnEditStyle}>Modifier</button>
                        {u.username !== 'admin' && (
                          <button onClick={() => supprimerUser(u.username)} style={btnDeleteStyle}>Supprimer</button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- STYLES ---
const cardContainer: React.CSSProperties = { 
  backgroundColor: 'white', 
  borderRadius: '20px', 
  boxShadow: '0 10px 25px rgba(0,0,0,0.05)', 
  overflow: 'hidden',
  border: '1px solid #e2e8f0'
};

const thStyle: React.CSSProperties = { 
  padding: '18px 25px', 
  textAlign: 'left', 
  fontSize: '0.75rem', 
  letterSpacing: '0.1em',
  fontWeight: '800'
};

const tdStyle: React.CSSProperties = { padding: '15px 25px', verticalAlign: 'middle' };

const trStyle: React.CSSProperties = { borderBottom: '1px solid #f1f5f9' };

const avatarCircle = { 
  width: '35px', 
  height: '35px', 
  backgroundColor: '#f1f5f9', 
  borderRadius: '10px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center', 
  fontWeight: 'bold', 
  color: '#475569' 
};

const passwordCode = { 
  backgroundColor: '#f8fafc', 
  padding: '4px 8px', 
  borderRadius: '6px', 
  color: '#94a3b8', 
  fontSize: '0.9rem' 
};

const editInputStyle = { 
  padding: '8px 12px', 
  borderRadius: '8px', 
  border: '2px solid #F97316', 
  outline: 'none',
  fontSize: '0.9rem' 
};

const btnEditStyle = { background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' };
const btnDeleteStyle = { background: '#fff1f2', color: '#e11d48', border: '1px solid #ffe4e6', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' };
const btnSaveStyle = { background: '#F97316', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' };
const btnCancelStyle = { background: '#94a3b8', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem' };