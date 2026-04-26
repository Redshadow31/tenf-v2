import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { appendHandoffQueryParams } from "@/lib/mobileHandoffRedirect";
import { clearMobileOauthHandoffCookie, readMobileOauthHandoffFromRequest } from "@/lib/mobileOauthHandoffCookie";

/**
 * Si l’utilisateur atterrit sur /auth/login avec une erreur OAuth alors qu’un flux mobile
 * a posé le cookie tenf_mo_handoff (via /api/auth/mobile/discord/start), on renvoie vers
 * le deep link — NextAuth renvoie parfois directement vers la page signIn au lieu de pages.error.
 */
export function redirectAuthLoginOAuthErrorToMobileIfPossible(request: NextRequest): NextResponse | null {
  if (request.nextUrl.pathname !== "/auth/login") return null;
  const err = request.nextUrl.searchParams.get("error");
  if (!err) return null;

  const ctx = readMobileOauthHandoffFromRequest(request);
  if (!ctx) return null;

  try {
    const target = new URL(ctx.redirectHref);
    const params: Record<string, string> = { error: err };
    const details = request.nextUrl.searchParams.get("details")?.trim();
    if (details) params.error_description = details.slice(0, 500);
    const dest = appendHandoffQueryParams(target, params);
    const res = NextResponse.redirect(dest);
    clearMobileOauthHandoffCookie(res);
    return res;
  } catch {
    return null;
  }
}
