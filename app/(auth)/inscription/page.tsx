"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Ajustez le chemin selon votre structure
import { useRouter, useSearchParams } from 'next/navigation'; // --- MODIFICATION ICI ---

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams(); // --- MODIFICATION ICI ---
  
  // --- MODIFICATION ICI ---
  // Récupère l'URL de redirection, par défaut vers '/dashboard'
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  // Fonction pour envoyer l'e-mail de bienvenue via votre API route
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
    setMessage('⏳ Création du compte...');

    // 1. Inscription dans Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }, // Stocke le username dans le profil auth
      },
    });

    if (error) {
      setMessage('❌ Erreur : ' + error.message);
      return;
    }

    // 2. Si succès, envoi de l'email de bienvenue
    if (data.user) {
      await sendWelcomeEmail(email, username);
      setMessage('🎉 Compte créé ! Redirection...');
      
      // --- MODIFICATION ICI ---
      // Redirige vers l'URL stockée dans le paramètre
      router.push(redirectTo);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px' }}>
      <h1>Inscription</h1>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input type="text" placeholder="Pseudo" value={username} onChange={e => setUsername(e.target.value)} required style={{ padding: '10px' }} />
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '10px' }} />
        <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', background: '#F97316', color: 'white', border: 'none', borderRadius: '5px' }}>S'inscrire</button>
      </form>
      {message && <p style={{ marginTop: '15px', fontWeight: 'bold' }}>{message}</p>}
    </div>
  );
}