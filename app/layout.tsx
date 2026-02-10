"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
// --- IMPORT DU COMPOSANT NEWSLETTER ---
import NewsletterForm from "@/components/NewsletterForm";
// --- IMPORT DE LA FONCTION FIREBASE ---
import { saveTokenToDatabase } from "@/lib/firebase";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 👇 1. ÉTAT POUR GÉRER L'AFFICHAGE ET ÉVITER LE BUG VISUEL
  const [isReady, setIsReady] = useState(false); 
  const pathname = usePathname();

  useEffect(() => {
    // 2. --- MODIFICATION : Indiquer que le composant est prêt côté client ---
    setIsReady(true); 

    // 1. Gestion de l'utilisateur
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // 2. --- Modification : Enregistrement du token FCM ---
        if (parsedUser.id) {
          saveTokenToDatabase(parsedUser.id);
        }
      } catch (e) {
        console.error("Erreur parsing user:", e);
      }
    }
    setIsMenuOpen(false);
  }, [pathname]);

  // 👇 --- CORRECTION : Condition robuste pour masquer sidebar ---
  const isLoginPage = pathname?.toLowerCase() === '/login';
  const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.email === 'anthony.didier.pro@gmail.com';

  // Récupération de l'initiale
  const initial = user?.username ? user.username.charAt(0).toUpperCase() : (user?.email ? user.email.charAt(0).toUpperCase() : 'U');

  // 👇 3. PROTECTION : Affiche une page blanche tant que localStorage n'est pas chargé
  if (!isReady) {
    return <html lang="fr"><body style={{background: 'white'}}></body></html>;
  }

  // --- CORRECTION : Retourner le layout minimal pour la page de login ---
  if (isLoginPage) return <html lang="fr"><body>{children}</body></html>;

  return (
    <html lang="fr">
      <body>
        <div className="app-container">

          {/* HEADER MOBILE AMÉLIORÉ */}
          <header className="mobile-header">
            <button className="burger-icon" onClick={() => setIsMenuOpen(true)}>
              <span></span><span></span><span></span>
            </button>

            <div className="logo-brand">🏀 DUNKLY</div>

            <Link href="/profil" className="profile-avatar-link">
              <div className="avatar-circle">{initial}</div>
            </Link>
          </header>

          {isMenuOpen && <div className="menu-overlay" onClick={() => setIsMenuOpen(false)}></div>}

          <aside className={`main-sidebar ${isMenuOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <span className="logo-full">🏀 DUNKLY</span>
              <button className="close-menu" onClick={() => setIsMenuOpen(false)}>✕</button>
            </div>

            <nav className="nav-links">
              <div className="nav-group">
                <p className="group-title">MENU</p>
                <Link href="/" className={`nav-item ${pathname === '/' ? 'active' : ''}`}>🏠 Accueil</Link>
                <Link href="/competitions" className={`nav-item ${pathname === '/competitions' ? 'active' : ''}`}>🏆 Compétitions</Link>
                <Link href="/matchs/resultats" className={`nav-item ${pathname === '/matchs/resultats' ? 'active' : ''}`}>✅ Résultats</Link>
                <Link href="/equipes" className={`nav-item ${pathname === '/equipes' ? 'active' : ''}`}>🛡️ Clubs</Link>
              </div>

              {isAdmin && (
                <div className="nav-group admin">
                  <p className="group-title">ADMINISTRATION</p>
                  <Link href="/membres" className={`nav-item ${pathname === '/membres' ? 'active' : ''}`}>👥 Membres</Link>
                  <Link href="/arbitres" className={`nav-item ${pathname === '/arbitres' ? 'active' : ''}`}>🏁 Arbitres</Link>
                  <Link href="/admin/newsletter" className={`nav-item ${pathname === '/admin/newsletter' ? 'active' : ''}`}>📩 Newsletter</Link>
                </div>
              )}

              <div className="nav-group">
                <p className="group-title">COMPTE</p>
                <Link href="/profil" className={`nav-item ${pathname === '/profil' ? 'active' : ''}`}>👤 Mon Profil</Link>
              </div>
            </nav>

            {/* --- CONDITION AJOUTÉE --- */}
            {!isAdmin && (
              <div className="sidebar-newsletter-container">
                <NewsletterForm />
              </div>
            )}

            <div className="sidebar-footer">
              <div className="user-box">
                <p className="u-name">{user?.username || 'Utilisateur'}</p>
                <button onClick={() => { localStorage.clear(); window.location.href='/login'; }} className="logout-btn">
                  Déconnexion
                </button>
              </div>
            </div>
          </aside>

          <main className="page-content">
            <div className="content-inner">
              {children}
            </div>
          </main>
        </div>

        <style jsx global>{`
          :root {
            --primary: #F97316;
            --dark: #0F172A;
            --sidebar-w: 280px;
          }

          body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; background: #F8FAFC; color: #1E293B; }
          .app-container { display: flex; min-height: 100vh; }

          .main-sidebar {
            width: var(--sidebar-w); background: var(--dark); color: white; position: fixed;
            height: 100vh; display: flex; flex-direction: column; z-index: 1000;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .sidebar-header { padding: 30px 24px; display: flex; justify-content: space-between; align-items: center; }
          .logo-full { font-weight: 900; font-size: 1.5rem; color: var(--primary); letter-spacing: -1px; }
          .close-menu { display: none; background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }

          .nav-links { flex: 1; padding: 0 16px; overflow-y: auto; }
          .nav-group { margin-bottom: 25px; }
          .group-title { font-size: 0.65rem; font-weight: 800; color: #475569; letter-spacing: 1.5px; padding-left: 12px; margin-bottom: 10px; }
          .nav-item { display: block; padding: 12px 16px; color: #94A3B8; text-decoration: none; border-radius: 12px; font-weight: 600; transition: 0.2s; margin-bottom: 4px; }
          .nav-item:hover { background: rgba(255,255,255,0.05); color: white; }
          .nav-item.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2); }

          .sidebar-newsletter-container { padding: 16px; }

          .sidebar-footer { padding: 20px; background: #020617; }
          .user-box { padding: 15px; background: rgba(255,255,255,0.03); border-radius: 12px; }
          .u-name { margin: 0; font-weight: 700; font-size: 0.9rem; }
          .logout-btn { background: none; border: none; color: #EF4444; font-weight: 700; cursor: pointer; padding: 0; margin-top: 8px; font-size: 0.8rem; }

          .page-content { flex: 1; margin-left: var(--sidebar-w); transition: 0.3s; }
          .content-inner { padding: 40px; max-width: 1200px; margin: 0 auto; width: 100%; }

          .mobile-header { display: none; }

          @media (max-width: 1024px) {
            .main-sidebar { transform: translateX(-100%); width: 280px; }
            .main-sidebar.open { transform: translateX(0); box-shadow: 20px 0 50px rgba(0,0,0,0.5); }
            .close-menu { display: block; }
            .page-content { margin-left: 0; }
            .content-inner { padding: 20px; padding-top: 85px; }

            .mobile-header {
              display: flex; justify-content: space-between; align-items: center;
              position: fixed; top: 0; left: 0; right: 0; height: 70px;
              background: white; padding: 0 16px; border-bottom: 1px solid #E2E8F0; z-index: 900;
            }

            .logo-brand { font-weight: 900; color: var(--primary); font-size: 1.2rem; position: absolute; left: 50%; transform: translateX(-50%); }

            .burger-icon {
              display: flex; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 10px;
            }
            .burger-icon span { width: 22px; height: 2px; background: var(--dark); border-radius: 10px; }

            .profile-avatar-link { text-decoration: none; }
            .avatar-circle {
              width: 38px; height: 38px; background: var(--primary); color: white;
              border-radius: 50%; display: flex; align-items: center; justify-content: center;
              font-weight: 900; font-size: 0.9rem; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .menu-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); z-index: 950; }
          }
        `}</style>
      </body>
    </html>
  );
}