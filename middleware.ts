import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Middleware Next.js pour protéger les routes admin
 * Utilise NextAuth JWT pour vérifier l'authentification
 * La vérification des permissions spécifiques se fait dans chaque route API
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Vérifier si c'est une route admin
  if (pathname.startsWith("/admin")) {
    // Vérifier le token NextAuth JWT
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    // Si pas de token ou pas de discordId, rediriger vers la page de connexion
    if (!token?.discordId) {
      const loginUrl = new URL("/api/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Vérification spécifique pour la page de gestion des accès (réservée aux fondateurs uniquement)
    if (pathname.startsWith("/admin/gestion-acces")) {
      // Vérifier que l'utilisateur est fondateur (depuis le token JWT)
      if (token.role !== "FOUNDER") {
        // Rediriger vers la page d'accès refusé
        return NextResponse.redirect(new URL("/unauthorized", request.url));
      }
    }

    // La vérification des permissions spécifiques (Admin, Admin Adjoint, etc.)
    // se fait dans chaque route API via requireAdmin/requireRole/requirePermission
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

