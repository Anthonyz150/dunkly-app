// middleware.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
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
          // --- CORRECTION FORCÉE ICI ---
          req.cookies.set({ name, value, ...options });
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          res.cookies.set({ name, value, ...options });
          // -----------------------------
        },
        remove(name: string, options: CookieOptions) {
          // --- CORRECTION FORCÉE ICI ---
          req.cookies.set({ name, value: "", ...options });
          res = NextResponse.next({
            request: { headers: req.headers },
          });
          res.cookies.set({ name, value: "", ...options });
          // -----------------------------
        },
      },
    }
  );

  // --- CORRECTION ---
  // On vérifie la session, pas l'utilisateur directement
  const { data: { session } } = await supabase.auth.getSession();

  const protectedPaths = ['/profil', '/membres'];
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path));

  // Si pas de session valide, on redirige vers /login
  // --- COMMENTE CES LIGNES TEMPORAIREMENT ---
  // if (!session && isProtectedPath) {
  //   const redirectUrl = new URL('/login', req.url);
  //   redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);
  //   return NextResponse.redirect(redirectUrl);
  // }
  // ------------------------------------------

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};