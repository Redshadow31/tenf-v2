import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware Next.js pour protéger les routes admin
 * Vérifie les permissions avant d'autoriser l'accès aux pages admin
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route admin
  if (pathname.startsWith("/admin")) {
    // Récupérer les cookies Discord
    const userId = request.cookies.get("discord_user_id")?.value;
    const username = request.cookies.get("discord_username")?.value;

    // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
    if (!userId || !username) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Vérifier les permissions admin (basique pour l'instant)
    // TODO: Vérifier avec la vraie liste d'admins depuis Discord ou une DB
    // Pour l'instant, on autorise l'accès si l'utilisateur est connecté
    // Vous devrez implémenter la vérification réelle des rôles Discord ici

    // Exemple de vérification (à adapter selon vos besoins):
    // const isAdmin = await checkDiscordRole(userId, "Admin");
    // if (!isAdmin) {
    //   return NextResponse.redirect(new URL("/unauthorized", request.url));
    // }
  }

  return NextResponse.next();
}

// Configurer les routes à protéger
export const config = {
  matcher: [
    "/admin/:path*",
    // Ajoutez d'autres routes à protéger ici
  ],
};

