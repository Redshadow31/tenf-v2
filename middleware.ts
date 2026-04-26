import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeAdminRole } from "@/lib/adminRoles";
import { isAdminPathAllowedDuringCharterBlock } from "@/lib/adminModerationCharterGatePaths";
import { redirectAuthLoginOAuthErrorToMobileIfPossible } from "@/lib/mobileAuthLoginErrorRedirect";

/**
 * Middleware Next.js pour protéger les routes admin
 * Utilise NextAuth JWT pour vérifier l'authentification
 * La vérification des permissions spécifiques se fait dans chaque route API
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const mobileLoginHandoff = redirectAuthLoginOAuthErrorToMobileIfPossible(request);
  if (mobileLoginHandoff) return mobileLoginHandoff;

  const devAuthBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_AUTH === "true";

  // Vérifier si c'est une route admin
  if (pathname.startsWith("/admin")) {
    // En local/dev: bypass global de la barrière middleware pour fluidifier le debug.
    if (devAuthBypassEnabled) {
      return NextResponse.next();
    }

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

    if (token.moderationCharterBlocked === true && !isAdminPathAllowedDuringCharterBlock(pathname)) {
      const charterUrl = new URL("/admin/moderation/staff/info/charte", request.url);
      charterUrl.searchParams.set("charter", "required");
      return NextResponse.redirect(charterUrl);
    }

    // Vérification spécifique pour la page de gestion des accès (réservée aux fondateurs uniquement)
    if (pathname.startsWith("/admin/gestion-acces")) {
      // Vérifier que l'utilisateur est fondateur (depuis le token JWT)
      const normalizedRole = normalizeAdminRole((token.role as string | null | undefined) || null);
      if (normalizedRole !== "FONDATEUR") {
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
    "/auth/login",
  ],
};

