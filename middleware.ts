import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware Next.js pour protéger les routes admin
 * Vérifie que l'utilisateur est connecté
 * La vérification des permissions spécifiques se fait dans chaque page
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

    // La vérification des permissions spécifiques (Admin, Admin Adjoint, etc.)
    // se fait dans chaque page admin via l'API /api/user/role
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

