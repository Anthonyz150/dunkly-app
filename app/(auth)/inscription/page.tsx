// app/register/page.tsx
"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from "framer-motion"; // Optionnel: pour des animations fluides

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const sendWelcomeEmail = async (email: string, username: string) => {
    try {
      await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username }),
      });
    } catch (error) {
      console.error("Erreur envoi email:", error);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('⏳ Création du compte...');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error) {
      setMessage('❌ Erreur : ' + error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await sendWelcomeEmail(email, username);
      setMessage('🎉 Compte créé ! Redirection...');
      router.push(redirectTo);
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
        <h1 style={title}>INSCRIPTION</h1>
        <p style={subtitle}>Rejoignez la communauté Dunkly</p>

        {message && <p style={message.includes('❌') ? errorStyle : successStyle}>{message}</p>}

        <form onSubmit={handleRegister} style={form}>
          <input 
            type="text" 
            placeholder="Pseudo" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
            required 
            style={input} 
          />
          <input 
            type="email" 
            placeholder="Email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={input} 
          />
          <input 
            type="password" 
            placeholder="Mot de passe" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
            style={input} 
          />
          <button type="submit" disabled={loading} style={button}>
            {loading ? "Chargement..." : "S'INSCRIRE"}
          </button>
        </form>

        <p style={footer}>
          Déjà un compte ?{" "}
          <span style={link} onClick={() => router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`)}>
            Connexion
          </span>
        </p>
      </motion.div>
    </main>
  );
}

// --- STYLES MODIFIÉS (Modernes et Arrondis) ---

const wrapper: React.CSSProperties = { 
  position: "fixed", 
  inset: 0, 
  width: "100vw",
  height: "100vh",
  background: "radial-gradient(circle at center, #0f172a, #000)", 
  display: "flex", 
  justifyContent: "center", 
  alignItems: "center", 
  zIndex: 9999 
};

const card: React.CSSProperties = { 
  background: "#020617", 
  padding: "48px", 
  width: "380px", 
  borderRadius: "24px", 
  boxShadow: "0 40px 80px rgba(0,0,0,0.9)", 
  textAlign: "center" 
};

const logo: React.CSSProperties = { 
  background: "#f97316", 
  width: "56px", 
  height: "56px", 
  borderRadius: "50%", 
  display: "flex", 
  justifyContent: "center", 
  alignItems: "center", 
  margin: "0 auto 12px", 
  fontSize: "26px" 
};

const title: React.CSSProperties = { 
  color: "#fff", 
  fontSize: "2.5rem", 
  fontWeight: 900, 
  margin: "0 0 10px 0" 
};

const subtitle: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.9rem",
  marginBottom: "30px"
};

const form: React.CSSProperties = { 
  display: "flex", 
  flexDirection: "column", 
  gap: "16px" 
};

const input: React.CSSProperties = { 
  padding: "14px", 
  borderRadius: "14px", 
  border: "1px solid #1e293b", 
  background: "#020617", 
  color: "#fff", 
  outline: "none",
  width: "100%",
  boxSizing: "border-box"
};

const button: React.CSSProperties = { 
  marginTop: "10px", 
  padding: "14px", 
  borderRadius: "16px", 
  background: "#f97316", 
  border: "none", 
  color: "#fff", 
  fontWeight: 900, 
  cursor: "pointer" 
};

const successStyle: React.CSSProperties = { 
  color: "#4ade80", 
  fontSize: "14px", 
  marginBottom: "15px",
  fontWeight: "bold"
};

const errorStyle: React.CSSProperties = { 
  color: "#ff5555", 
  fontSize: "14px", 
  marginBottom: "15px",
  fontWeight: "bold"
};

const footer: React.CSSProperties = { 
  marginTop: "20px", 
  color: "#94a3b8",
  fontSize: "0.9rem"
};

const link: React.CSSProperties = { 
  color: "#fff", 
  fontWeight: 700, 
  cursor: "pointer" 
};