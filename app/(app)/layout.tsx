"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); // --- NOUVEAU ---
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // --- NOUVEAU : Fonction pour charger/rafraîchir l'utilisateur et l'avatar ---
    const loadUser = () => {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const userData = JSON.parse(stored);
          setUser(userData);
          // On récupère l'URL de l'avatar stockée
          setAvatarUrl(userData.avatar_url || null);
        } catch {
          localStorage.clear();
        }
      }
      setReady(true);
    };

    loadUser();
    
    // Écouter les changements dans localStorage (ex: mise à jour profil)
    window.addEventListener('storage', loadUser);
    
    setMenuOpen(false);

    return () => {
      window.removeEventListener('storage', loadUser);
    };
  }, [pathname]);

  if (!ready) {
    return (
      <html lang="fr">
        <body style={{ background: "#F8FAFC" }} />
      </html>
    );
  }

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "anthony.didier.pro@gmail.com";

  const initial =
    user?.username?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  // --- NOUVEAU : Composant Avatar réutilisable ---
  const AvatarDisplay = ({ size = "36px" }: { size?: string }) => (
    avatarUrl ? (
      <img src={avatarUrl} alt="Avatar" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid #F97316" }} />
    ) : (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "#f97316", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: size === "80px" ? "2rem" : "1rem" }}>
        {initial}
      </div>
    )
  );
  // ------------------------------------------------

  return (
    <html lang="fr">
      <body>
        <div className="app">

          {/* HEADER MOBILE */}
          <header className="mobile-header">
            <button onClick={() => setMenuOpen(true)} className="burger">☰</button>
            <span className="logo">🏀 DUNKLY</span>
            <Link href="/profil">
              <AvatarDisplay /> {/* --- MODIFIÉ --- */}
            </Link>
          </header>

          {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

          {/* SIDEBAR */}
          <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
            <h2 className="brand">🏀 DUNKLY</h2>
            
            {/* --- NOUVEAU : Photo et nom dans la sidebar --- */}
            <div style={{ textAlign: "center", marginBottom: "30px", padding: "10px", background: "#1e293b", borderRadius: "16px" }}>
              <div style={{display: "flex", justifyContent: "center", marginBottom: "10px"}}>
                <AvatarDisplay size="80px" />
              </div>
              <div style={{ fontWeight: "bold", fontSize: "1.1rem", color: "white" }}>
                {user?.prenom} {user?.nom}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>{user?.username}</div>
            </div>
            {/* ----------------------------------------------- */}

            <nav>
              <Link href="/">🏠 Accueil</Link>
              <Link href="/competitions">🏆 Compétitions</Link>
              <Link href="/matchs/resultats">✅ Résultats</Link>
              <Link href="/equipes">🛡️ Clubs</Link>

              {isAdmin && (
                <>
                  <hr style={{borderColor: "#334155"}} />
                  <Link href="/membres">👥 Membres</Link>
                  <Link href="/admin/newsletter">📩 Newsletter</Link>
                </>
              )}

              <hr style={{borderColor: "#334155"}} />
              <Link href="/profil">👤 Profil</Link>
            </nav>

            <button
              className="logout"
              onClick={() => {
                localStorage.clear();
                router.push("/login");
              }}
            >
              Déconnexion
            </button>
          </aside>

          {/* CONTENU */}
          <main className="content">{children}</main>
        </div>

        <style jsx global>{`
          body {
            margin: 0;
            font-family: system-ui, sans-serif;
            background: #f8fafc;
          }

          .app {
            display: flex;
            min-height: 100vh;
          }

          /* SIDEBAR */
          .sidebar {
            width: 260px;
            background: #0f172a;
            color: white;
            padding: 24px;
            position: fixed;
            height: 100vh;
            z-index: 1000;
            display: flex;
            flex-direction: column;
          }

          .sidebar nav a {
            display: block;
            color: #cbd5f5;
            text-decoration: none;
            padding: 10px 0;
            font-weight: 600;
          }

          .sidebar nav a:hover {
            color: white;
          }

          .brand {
            margin-bottom: 30px;
          }

          .logout {
            margin-top: auto;
            background: none;
            border: none;
            color: #ef4444;
            font-weight: bold;
            cursor: pointer;
            padding: 0;
            text-align: left;
            width: 100%;
            margin-bottom: 20px;
          }

          /* CONTENT */
          .content {
            margin-left: 260px;
            padding: 40px;
            width: 100%;
          }

          /* MOBILE */
          .mobile-header {
            display: none;
          }

          @media (max-width: 1024px) {
            .sidebar {
              transform: translateX(-100%);
              transition: 0.3s;
            }

            .sidebar.open {
              transform: translateX(0);
            }

            .content {
              margin-left: 0;
              padding-top: 80px;
            }

            .mobile-header {
              display: flex;
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              height: 60px;
              background: white;
              align-items: center;
              justify-content: space-between;
              padding: 0 16px;
              border-bottom: 1px solid #e2e8f0;
              z-index: 900;
            }

            .burger {
              font-size: 24px;
              background: none;
              border: none;
              cursor: pointer;
            }

            .overlay {
              position: fixed;
              inset: 0;
              background: rgba(0,0,0,0.4);
              z-index: 900;
            }
          }
        `}</style>
      </body>
    </html>
  );
}