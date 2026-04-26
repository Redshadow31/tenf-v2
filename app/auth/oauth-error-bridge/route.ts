import { NextRequest, NextResponse } from "next/server";
import { appendHandoffQueryParams } from "@/lib/mobileHandoffRedirect";
import { clearMobileOauthHandoffCookie, readMobileOauthHandoffFromRequest } from "@/lib/mobileOauthHandoffCookie";

/**
 * Pont d'erreur NextAuth : si un flux mobile a posé le cookie tenf_mo_handoff,
 * on renvoie vers le deep link avec error / error_description ; sinon vers /auth/login.
 */
export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error") || "oauth_error";
  const errorDescription =
    request.nextUrl.searchParams.get("error_description")?.trim() || "";

  const ctx = readMobileOauthHandoffFromRequest(request);
  if (ctx) {
    try {
      const target = new URL(ctx.redirectHref);
      const params: Record<string, string> = { error };
      if (errorDescription) params.error_description = errorDescription;
      const dest = appendHandoffQueryParams(target, params);
      const res = NextResponse.redirect(dest);
      clearMobileOauthHandoffCookie(res);
      return res;
    } catch {
      // URL cookie corrompue : fallback web
    }
  }

  const login = new URL("/auth/login", request.nextUrl.origin);
  login.searchParams.set("error", error);
  if (errorDescription) login.searchParams.set("details", errorDescription.slice(0, 500));
  const res = NextResponse.redirect(login.toString());
  clearMobileOauthHandoffCookie(res);
  return res;
}
