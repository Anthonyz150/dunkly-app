"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import OneSignal from 'react-onesignal';

// --- 1. COMPOSANTS DE STYLE INTERNES ---
function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div style={{ 
      backgroundColor: 'white', padding: '20px', borderRadius: '24px', 
      boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #F1F5F9',
      position: 'relative', overflow: 'hidden', flex: 1
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px', backgroundColor: color }}></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div style={{ backgroundColor: `${color}15`, padding: '10px', borderRadius: '12px', fontSize: '1.2rem' }}>{icon}</div>
        <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1E293B', lineHeight: '1' }}>{value}</div>
      </div>
      <div style={{ fontWeight: '700', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

// --- 2. COMPOSANT PRINCIPAL ---
export default function Dashboard() {
  const [stats, setStats] = useState({ compets: 0, equipes: 0, matchs: 0 });
  const [prochainMatch, setProchainMatch] = useState<any>(null);
  const [dernierResultat, setDernierResultat] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); 
  const router = useRouter();

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
            const localUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const userData = { ...session.user, ...localUser };
            setUser(userData);
        }

        // Initialisation OneSignal
        if (typeof window !== "undefined") {
            OneSignal.init({
                appId: "a60eae06-8739-4515-8827-858c2ec0c07b",
                allowLocalhostAsSecureOrigin: true,
            }).then(() => {
                OneSignal.Notifications.requestPermission();
            }).catch(e => console.log("OneSignal load issue"));
        }

        // --- CORRECTION REQUÊTES : Jointures et logos ---
        const [competsRes, equipesRes, matchsRes, nextRes, lastRes] = await Promise.all([
          supabase.from('competitions').select('*', { count: 'exact', head: true }),
          supabase.from('equipes_clubs').select('*', { count: 'exact', head: true }),
          supabase.from('matchs').select('*', { count: 'exact', head: true }),
          // Jointure pour le prochain match
          supabase.from('matchs').select('*, competitions(logo_url)').eq('status', 'a-venir').order('date', { ascending: true }).limit(1).maybeSingle(),
          // Jointure pour le dernier résultat
          supabase.from('matchs').select('*, competitions(logo_url)').eq('status', 'termine').order('date', { ascending: false }).limit(1).maybeSingle()
        ]);

        setStats({
          compets: competsRes.count || 0,
          equipes: equipesRes.count || 0,
          matchs: matchsRes.count || 0
        });

        if (nextRes.data) setProchainMatch(nextRes.data);
        if (lastRes.data) setDernierResultat(lastRes.data);

      } catch (error) {
        console.error("Erreur chargement:", error);
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [router]);

  const formatteDateParis = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', { 
      weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
      timeZone: 'Europe/Paris' 
    });
  };

  const isAdmin = user?.role === 'admin' || user?.username?.toLowerCase() === 'admin' || user?.username?.toLowerCase() === 'anthony.didier.prop' || user?.user_metadata?.role === 'admin';

  if (loading) return (
    <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'sans-serif', background: 'white' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🏀</div>
        <p style={{ color: '#64748B', fontWeight: 'bold' }}>Chargement du parquet...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '15px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#0F172A', margin: 0 }}>
            ACCUEIL <span style={{ color: '#F97316' }}>.</span>
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '5px' }}>
            Ravi de vous revoir, <strong>{user?.prenom || user?.username || user?.email || 'Invité'}</strong>.
          </p>
        </div>

        {isAdmin && (
          <Link href="/membres" style={btnAdminStyle}>
            👥 <span className="admin-text">GÉRER</span>
          </Link>
        )}
      </div>

      {/* STATS GRID */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <StatCard label="Championnats" value={stats.compets} icon="🏆" color="#F97316" />
        <StatCard label="Clubs & Équipes" value={stats.equipes} icon="🛡️" color="#3B82F6" />
        <StatCard label="Matchs Total" value={stats.matchs} icon="⏱️" color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        
        {/* PROCHAIN RDV */}
        <div style={{ backgroundColor: '#1E293B', padding: '25px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <h3 style={titleSectionStyle}>📅 Prochain RDV</h3>
          {prochainMatch ? (
            <div style={{ position: 'relative', zIndex: 2 }}>
              {/* --- LOGO COMPETITION --- */}
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
                {prochainMatch.competitions?.logo_url && (
                    <img src={prochainMatch.competitions.logo_url} alt="Logo" style={{width: '24px', height: '24px', objectFit: 'contain'}} />
                )}
                <div style={{ fontSize: '0.8rem', color: '#F97316', fontWeight: 'bold' }}>{prochainMatch.competition}</div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                {/* --- LOGO A --- */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1}}>
                    {prochainMatch.logo_urlA && <img src={prochainMatch.logo_urlA} alt={prochainMatch.clubA} style={logoStyle} />}
                    <div style={{ fontSize: '1rem', fontWeight: '900', textAlign: 'center' }}>{prochainMatch.clubA}</div>
                </div>
                
                <div style={{ color: '#F97316', fontWeight: '900', fontSize: '1.2rem' }}>VS</div>
                
                {/* --- LOGO B --- */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1}}>
                    {prochainMatch.logo_urlB && <img src={prochainMatch.logo_urlB} alt={prochainMatch.clubB} style={logoStyle} />}
                    <div style={{ fontSize: '1rem', fontWeight: '900', textAlign: 'center' }}>{prochainMatch.clubB}</div>
                </div>
              </div>
              <div style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
                <div style={{ color: 'white', fontWeight: '600' }}>🕒 {formatteDateParis(prochainMatch.date)}</div>
                <div style={{ marginTop: '5px' }}>📍 {prochainMatch.lieu || 'Lieu non défini'}</div>
              </div>
            </div>
          ) : <p>Aucun match programmé.</p>}
        </div>

        {/* DERNIER RÉSULTAT */}
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', border: '1px solid #F1F5F9' }}>
          <h3 style={{ ...titleSectionStyle, color: '#64748B' }}>🏆 Dernier Résultat</h3>
          {dernierResultat ? (
            <div style={{ textAlign: 'center' }}>
              {/* --- LOGO COMPETITION --- */}
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '15px'}}>
                {dernierResultat.competitions?.logo_url && (
                    <img src={dernierResultat.competitions.logo_url} alt="Logo" style={{width: '24px', height: '24px', objectFit: 'contain'}} />
                )}
                <div style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 'bold' }}>{dernierResultat.competition}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}>
                {/* --- LOGO A --- */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1}}>
                    {dernierResultat.logo_urlA && <img src={dernierResultat.logo_urlA} alt={dernierResultat.clubA} style={{...logoStyle, border: '1px solid #E2E8F0'}} />}
                    <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{dernierResultat.clubA}</div>
                </div>

                <div style={{ fontSize: '1.4rem', fontWeight: '900', color: 'white', backgroundColor: '#1E293B', padding: '10px 15px', borderRadius: '12px' }}>
                  {dernierResultat.scoreA} - {dernierResultat.scoreB}
                </div>
                
                {/* --- LOGO B --- */}
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', flex: 1}}>
                    {dernierResultat.logo_urlB && <img src={dernierResultat.logo_urlB} alt={dernierResultat.clubB} style={{...logoStyle, border: '1px solid #E2E8F0'}} />}
                    <div style={{ fontWeight: '900', fontSize: '0.9rem' }}>{dernierResultat.clubB}</div>
                </div>
              </div>
              <Link href="/matchs/resultats" style={{ color: '#64748B', fontSize: '0.8rem', fontWeight: 'bold' }}>Tous les résultats ↗</Link>
            </div>
          ) : <p style={{ textAlign: 'center', color: '#94A3B8' }}>Aucun résultat.</p>}
        </div>
      </div>

      <footer style={{ marginTop: '50px', padding: '20px 0', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.8rem' }}>
        <div>© 2026 <strong>DUNKLY</strong></div>
        <div>V 1.1.5</div>
      </footer>

      <style jsx>{`
        @media (max-width: 600px) {
          .admin-text { display: none; }
        }
      `}</style>
    </div>
  );
}

// --- Styles additionnels pour les logos ---
const titleSectionStyle = { fontSize: '0.75rem', fontWeight: '700', marginBottom: '20px', textTransform: 'uppercase' as const, letterSpacing: '1px' };

const btnAdminStyle = { 
  backgroundColor: '#1E293B', color: 'white', textDecoration: 'none', 
  padding: '10px 15px', borderRadius: '12px', fontWeight: '800' as const, fontSize: '0.75rem',
  display: 'flex', alignItems: 'center', gap: '5px'
};

const logoStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'contain' as const, backgroundColor: 'white', padding: '3px' };