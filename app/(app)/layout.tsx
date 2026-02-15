"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("currentUser");

    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const userData = JSON.parse(stored);
      setUser(userData);
      setAvatarUrl(userData.avatar_url || null);
    } catch {
      localStorage.clear();
      router.replace("/login");
    }

    setReady(true);
    setMenuOpen(false);
  }, [pathname]);

  if (!ready) return null;

  const isAdmin =
    user?.role === "admin" ||
    user?.email === "anthony.didier.pro@gmail.com";

  const initial =
    user?.username?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "U";

  const AvatarDisplay = ({ size = "40px" }: { size?: string }) =>
    avatarUrl ? (
      <img
        src={avatarUrl}
        alt="Avatar"
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #F97316",
        }}
      />
    ) : (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#F97316",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
        }}
      >
        {initial}
      </div>
    );

  return (
    <>
      <div className="app">

        {/* HEADER MOBILE */}
        <header className="mobile-header">
          <button onClick={() => setMenuOpen(true)} className="burger">
            ☰
          </button>
          <span className="logo">🏀 DUNKLY</span>
          <Link href="/profil">
            <AvatarDisplay />
          </Link>
        </header>

        {menuOpen && (
          <div className="overlay" onClick={() => setMenuOpen(false)} />
        )}

        {/* SIDEBAR */}
        <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
          <h2 className="brand">🏀 DUNKLY</h2>

          <div className="user-card">
            <AvatarDisplay size="80px" />
            <div className="username">
              {user?.username || "Utilisateur"}
            </div>
            <div className="fullname">
              {user?.prenom} {user?.nom}
            </div>
          </div>

          <nav>
            <Link href="/">🏠 Accueil</Link>
            <Link href="/competitions">🏆 Compétitions</Link>
            <Link href="/matchs/resultats">✅ Résultats</Link>
            <Link href="/equipes">🛡️ Clubs</Link>
            <Link href="/arbitres">🏁 Arbitres</Link>

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

      <Analytics />

      <style jsx global>{`
        body {
          margin: 0;
          font-family: system-ui, sans-serif;
          background: #f1f5f9;
        }

        .app {
          display: flex;
          min-height: 100vh;
        }

        /* SIDEBAR BLEU NUIT */
        .sidebar {
          width: 260px;
          background: linear-gradient(180deg, #0B1E3D 0%, #09172F 100%) !important;
          color: white;
          padding: 24px;
          position: fixed;
          height: 100vh;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          box-shadow: 4px 0 30px rgba(0,0,0,0.35);
          transition: 0.3s ease;
        }

        .brand {
          margin-top: 0;
          margin-bottom: 25px;
        }

        .user-card {
          background: rgba(255,255,255,0.06);
          padding: 15px;
          border-radius: 16px;
          text-align: center;
          margin-bottom: 25px;
        }

        .username {
          font-weight: 800;
          font-size: 1.1rem;
          margin-top: 10px;
        }

        .fullname {
          font-size: 0.85rem;
          opacity: 0.7;
        }

        .sidebar nav a {
          display: block;
          padding: 10px 0;
          color: #c7d2fe;
          text-decoration: none;
          font-weight: 600;
          transition: 0.2s;
        }

        .sidebar nav a:hover {
          color: white;
          transform: translateX(4px);
        }

        .logout {
          margin-top: auto;
          background: rgba(255,255,255,0.08);
          border: none;
          color: #fca5a5;
          padding: 10px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
        }

        .logout:hover {
          background: rgba(255,255,255,0.15);
        }

        /* CONTENU */
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
         position: fixed;
         top: 0;
         left: -260px;
         width: 260px;
         height: 100vh;
         z-index: 2000;
         transition: left 0.3s ease;
        }

         .sidebar.open {
         left: 0;
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
         z-index: 1500;
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
        z-index: 1800;
        }
       }
      `}</style>
    </>
  );
}