"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sécurité : évite les doubles clics
    if (loading) return;

    setLoading(true);
    setMessage("");

    // Normalisation de l’email
    const cleanEmail = email.toLowerCase().trim();

    const { error } = await supabase
      .from("newsletter_subscriptions")
      .insert([{ email: cleanEmail }]);

    setLoading(false);

    if (error) {
      // Email déjà existant (clé unique)
      if (error.code === "23505") {
        setMessage("📩 Cet email est déjà inscrit à la newsletter.");
      } else {
        console.log("Erreur Supabase :", JSON.stringify(error, null, 2));
        setMessage("❌ Une erreur est survenue. Réessaie plus tard.");
      }
      return;
    }

    // Succès
    setMessage("🎉 Merci pour ton inscription !");
    setEmail("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        background: "rgba(255, 255, 255, 0.03)",
        padding: "20px",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "white",
          fontSize: "1.1rem",
          fontWeight: "800",
          letterSpacing: "-0.5px",
        }}
      >
        Newsletter Dunkly
      </h3>

      <p
        style={{
          margin: 0,
          color: "#94A3B8",
          fontSize: "0.8rem",
          lineHeight: "1.4",
        }}
      >
        Ne manque aucun résultat ni les actus basket 🏀
      </p>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="votre.email@exemple.com"
        required
        disabled={loading}
        style={{
          padding: "12px",
          borderRadius: "10px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          background: "rgba(0, 0, 0, 0.2)",
          color: "white",
          outline: "none",
          fontSize: "0.85rem",
        }}
        onFocus={(e) =>
          (e.currentTarget.style.borderColor = "#F97316")
        }
        onBlur={(e) =>
          (e.currentTarget.style.borderColor =
            "rgba(255, 255, 255, 0.1)")
        }
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "12px",
          background: loading ? "#A1A1AA" : "#F97316",
          color: "white",
          border: "none",
          borderRadius: "10px",
          fontWeight: "700",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "0.85rem",
        }}
      >
        {loading ? "Inscription..." : "S’abonner"}
      </button>

      {message && (
        <p
          style={{
            margin: 0,
            fontSize: "0.75rem",
            fontWeight: "600",
            color: message.startsWith("❌") ? "#F87171" : "#4ADE80",
            textAlign: "center",
            background: message.startsWith("❌")
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(34, 197, 94, 0.1)",
            padding: "8px",
            borderRadius: "8px",
          }}
        >
          {message}
        </p>
      )}
    </form>
  );
}
