import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="bg-slate-950 text-white">
      {/* --- CORRECTION: Ajout de classes pour le fond sombre global et la police --- */}
      <body className="antialiased font-sans">
        {/* --- OPTIMISATION: Conteneur principal sémantique --- */}
        <div className="relative flex min-h-screen flex-col">
          {children}
        </div>
        <Analytics />
      </body>
    </html>
  );
}