import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { normalizeAdminRole } from "@/lib/adminRoles";
import { isAdminPathAllowedDuringCharterBlock } from "@/lib/adminModerationCharterGatePaths";
import { redirectAuthLoginOAuthErrorToMobileIfPossible } from "@/lib/mobileAuthLoginErrorRedirect";
import { redirectMemberDashboardToHandoffIfMobileContext } from "@/lib/mobileDashboardHandoffRecover";

/**
 * Middleware Next.js : protection admin + espace membre.
 * Les API restent sécurisées route par route ; ici on force la session sur les pages /member.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const mobileLoginHandoff = redirectAuthLoginOAuthErrorToMobileIfPossible(request);
  if (mobileLoginHandoff) return mobileLoginHandoff;

  const dashboardRecover = await redirectMemberDashboardToHandoffIfMobileContext(request);
  if (dashboardRecover) return dashboardRecover;

  const devAuthBypassEnabled =
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_DEV_AUTH === "true";

  // Espace membre : aligné sur /api/members/me/* (Discord connecté, cookie de session)
  if (pathname === "/member" || pathname.startsWith("/member/")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.discordId) {
      const loginUrl = new URL("/api/auth/signin", request.url);
      const callbackDest = `${request.nextUrl.pathname}${request.nextUrl.search}`;
      loginUrl.searchParams.set("callbackUrl", callbackDest || "/member/dashboard");
      return NextResponse.redirect(loginUrl);
    }
  }

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

    // Gestion des accès : en prod, réservé aux fondateurs (rôle JWT).
    // En dev local, même règle assouplie que /api/admin/access : sauf si ENABLE_DEV_AUTH="false",
    // on laisse passer tout utilisateur connecté (Discord) pour coller au bypass API.
    if (pathname.startsWith("/admin/gestion-acces")) {
      const devGestionAccesRelaxed =
        process.env.NODE_ENV !== "production" && process.env.ENABLE_DEV_AUTH !== "false";

      if (devGestionAccesRelaxed) {
        if (!token?.discordId) {
          const loginUrl = new URL("/api/auth/signin", request.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(loginUrl);
        }
      } else {
        const normalizedRole = normalizeAdminRole((token.role as string | null | undefined) || null);
        if (normalizedRole !== "FONDATEUR") {
          return NextResponse.redirect(new URL("/unauthorized", request.url));
        }
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
    "/member",
    "/member/:path*",
  ],
};

