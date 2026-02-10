import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // On crée une réponse initiale
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // 1. On met à jour la requête (pour que les Server Components voient le cookie)
          req.cookies.set({ name, value, ...options });
          // 2. On met à jour la réponse (pour que le navigateur reçoive le cookie)
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          // Même logique pour la suppression
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // IMPORTANT : Utilise getUser() au lieu de getSession()
  // getUser() est plus lent mais vérifie la validité réelle du token auprès de Supabase
  const { data: { user } } = await supabase.auth.getUser();

  // OPTIONNEL : Redirection automatique si pas connecté
  // Si l'utilisateur n'est pas connecté et essaie d'aller sur une page protégée (ex: /profil)
  if (!user && req.nextUrl.pathname.startsWith('/profil')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};