"use client";

import { useState, type CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation"; // --- MODIFICATION ICI ---
import { motion } from "framer-motion";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams(); // --- MODIFICATION ICI ---

  // --- MODIFICATION ICI ---
  // Récupère l'URL de redirection, par défaut vers '/'
  const redirectTo = searchParams.get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        // --- Synchronisation avec ton Dashboard ---
        if (data?.user) {
          localStorage.setItem('currentUser', JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            username: data.user.email?.split('@')[0], // Fallback pseudo
            role: data.user.user_metadata?.role || 'user'
          }));
        }

        // --- MODIFICATION ICI ---
        // Redirige vers l'URL stockée dans le paramètre
        window.location.href = redirectTo;

      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'user', // Rôle par défaut à l'inscription
            }
          }
        });
        if (error) throw error;
        
        alert("Inscription réussie ! Vérifiez vos emails ou connectez-vous.");
        
        // --- MODIFICATION ICI ---
        // Après inscription réussie, on redirige vers le login avec le paramètre de redirection
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        
        setLoading(false);
        return;
      }
      
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={wrapper}>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={card}
      >
        <div style={logo}>🏀</div>
        <h1 style={title}>DUNKLY</h1>

        <div style={tabs}>
          <button
            onClick={() => setMode("login")}
            style={mode === "login" ? tabActive : tab}
            type="button"
          >
            Connexion
          </button>
          <button
            onClick={() => setMode("register")}
            style={mode === "register" ? tabActive : tab}
            type="button"
          >
            Inscription
          </button>
        </div>

        {error && <p style={errorStyle}>{error}</p>}

        <form onSubmit={handleSubmit} style={form}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <div style={{ position: "relative" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={input}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={eye}
            >
              {showPassword ? "🙈" : "👁️"}
            </span>
          </div>

          <button disabled={loading} style={button} type="submit">
            {loading
              ? "Chargement..."
              : mode === "login"
              ? "SE CONNECTER"
              : "CRÉER UN COMPTE"}
          </button>
        </form>

        <p style={footer}>
          {mode === "login" ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
          <span
            style={link}
            onClick={() =>
              setMode(mode === "login" ? "register" : "login")
            }
          >
            {mode === "login" ? "Inscription" : "Connexion"}
          </span>
        </p>
      </motion.div>
    </main>
  );
}

/* Les styles restent identiques à ton fichier original */
const wrapper: CSSProperties = { position: "fixed", inset: 0, background: "radial-gradient(circle at center, #0f172a, #000)", display: "flex", justifyContent: "center", alignItems: "center" };
const card: CSSProperties = { background: "#020617", padding: "48px", width: "380px", borderRadius: "24px", boxShadow: "0 40px 80px rgba(0,0,0,0.9)", textAlign: "center" };
const logo: CSSProperties = { background: "#f97316", width: "56px", height: "56px", borderRadius: "50%", display: "flex", justifyContent: "center", alignItems: "center", margin: "0 auto 12px", fontSize: "26px" };
const title: CSSProperties = { color: "#fff", fontSize: "2.5rem", fontWeight: 900, marginBottom: "20px" };
const tabs: CSSProperties = { display: "flex", gap: "10px", marginBottom: "25px" };
const tab: CSSProperties = { flex: 1, padding: "10px", background: "transparent", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: "10px", cursor: "pointer" };
const tabActive: CSSProperties = { ...tab, background: "#f97316", color: "#fff", border: "none" };
const form: CSSProperties = { display: "flex", flexDirection: "column", gap: "16px" };
const input: CSSProperties = { padding: "14px", borderRadius: "12px", border: "1px solid #1e293b", background: "#020617", color: "#fff", outline: "none" };
const button: CSSProperties = { marginTop: "10px", padding: "14px", borderRadius: "14px", background: "#f97316", border: "none", color: "#fff", fontWeight: 900, cursor: "pointer" };
const eye: CSSProperties = { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", cursor: "pointer" };
const errorStyle: CSSProperties = { color: "#ff5555", fontSize: "13px", marginBottom: "10px" };
const footer: CSSProperties = { marginTop: "20px", color: "#94a3b8" };
const link: CSSProperties = { color: "#fff", fontWeight: 700, cursor: "pointer" };