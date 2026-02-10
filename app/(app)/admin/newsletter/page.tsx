"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Assurez-vous que le chemin est correct

export default function AdminNewsletterPage() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('⏳ Envoi en cours...');

    try {
      const response = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });

      if (response.ok) {
        setMessage('✅ Newsletter envoyée à tous les abonnés !');
        setSubject('');
        setBody('');
      } else {
        setMessage('❌ Erreur lors de l\'envoi.');
      }
    } catch (error) {
      setMessage('❌ Erreur technique.');
    } finally {
      setLoading(false);
    }
  };

  // Styles partagés pour l'interface sombre
  const inputStyle = {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    fontSize: '0.9rem',
    outline: 'none',
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: 'white' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '5px', color: 'black' }}>📩 ADMINISTRATION NEWSLETTER</h1>
      <p style={{ color: '#94A3B8', marginBottom: '30px' }}>Rédigez et envoyez votre campagne à tous les abonnés.</p>
      
      <form onSubmit={handleSendNewsletter} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '15px',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '25px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <input
          type="text"
          placeholder="Objet de l'e-mail"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          style={inputStyle}
        />
        <textarea
          placeholder="Contenu de l'e-mail (HTML autorisé)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={12}
          style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ 
            padding: '14px', 
            background: loading ? '#A1A1AA' : '#F97316', 
            color: 'white', 
            border: 'none', 
            borderRadius: '10px', 
            fontWeight: 'bold', 
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            marginTop: '10px',
            transition: 'background 0.2s'
          }}
        >
          {loading ? 'Envoi...' : 'Envoyer la Newsletter'}
        </button>
      </form>
      
      {message && (
        <p style={{ 
          marginTop: '20px', 
          fontWeight: 'bold',
          textAlign: 'center',
          color: message.startsWith('✅') ? '#4ADE80' : '#F87171',
          background: message.startsWith('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          padding: '12px',
          borderRadius: '8px'
        }}>
          {message}
        </p>
      )}
    </div>
  );
}