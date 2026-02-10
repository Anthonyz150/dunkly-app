'use client';

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; 
import Link from "next/link";

export default function TousLesResultatsPage() {
  const [matchs, setMatchs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chargerMatchs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('matchs')
        .select('*')
        .eq('status', 'termine') // Seulement les matchs finis
        .order('date', { ascending: false });
      
      if (!error) setMatchs(data || []);
      setLoading(false);
    };
    chargerMatchs();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Tous les résultats</h1>
      <div style={{ display: 'grid', gap: '15px' }}>
        {matchs.map((m) => (
          <Link href={`/matchs/resultats/${m.id}`} key={m.id} style={{ textDecoration: 'none', color: 'black' }}>
            <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
              <strong>{m.competition}</strong> - {m.date}
              <br />
              {m.clubA} {m.scoreA} - {m.scoreB} {m.clubB}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}