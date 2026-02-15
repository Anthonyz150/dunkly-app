import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
      // --- CORRECTION: Remplacement de <body> par un conteneur sémantique ---
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
        <main className="w-full max-w-md p-4">
          {children}
        </main>
        <Analytics />
      </div>
    );
}