"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");
    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      setUser(JSON.parse(stored));
    } catch {
      localStorage.clear();
      router.replace("/login");
    }

    setReady(true);
    setMenuOpen(false);
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

  return (
    <html lang="fr">
      <body>
        <div className="app">

          {/* HEADER MOBILE */}
          <header className="mobile-header">
            <button onClick={() => setMenuOpen(true)} className="burger">☰</button>
            <span className="logo">🏀 DUNKLY</span>
            <Link href="/profil" className="avatar">{initial}</Link>
          </header>

          {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}

          {/* SIDEBAR */}
          <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
            <h2 className="brand">🏀 DUNKLY</h2>

            <nav>
              <Link href="/">🏠 Accueil</Link>
              <Link href="/competitions">🏆 Compétitions</Link>
              <Link href="/matchs/resultats">✅ Résultats</Link>
              <Link href="/equipes">🛡️ Clubs</Link>

              {isAdmin && (
                <>
                  <hr />
                  <Link href="/membres">👥 Membres</Link>
                  <Link href="/admin/newsletter">📩 Newsletter</Link>
                </>
              )}

              <hr />
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
            }

            .avatar {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #f97316;
              color: white;
              display: flex;
              align-items: center;
              justify-content: center;
              text-decoration: none;
              font-weight: bold;
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