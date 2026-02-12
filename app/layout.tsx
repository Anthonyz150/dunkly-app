import { Analytics } from "@vercel/analytics/next"
import "./globals.css"; // Assurez-vous d'importer vos styles globaux ici

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics /> {/* <--- Ajoutez ceci pour activer l'analyse */}
      </body>
    </html>
  );
}