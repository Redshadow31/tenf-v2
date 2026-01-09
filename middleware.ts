import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isFounder } from "@/lib/adminRoles";

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

    // Vérification spécifique pour la page de gestion des accès (réservée aux fondateurs uniquement)
    if (pathname.startsWith("/admin/gestion-acces")) {
      // Vérifier que l'utilisateur est fondateur
      if (!isFounder(userId)) {
        // Rediriger vers la page d'accès refusé
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
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

