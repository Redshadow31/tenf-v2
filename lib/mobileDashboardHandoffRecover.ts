import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { readMobileOauthHandoffFromRequest } from "@/lib/mobileOauthHandoffCookie";

/**
 * Cas fréquent : l’app ouvre Discord avec un mauvais callbackUrl (ex. /member/dashboard) alors qu’un
 * flux mobile a déjà posé le cookie `tenf_mo_handoff` via /api/auth/mobile/discord/start.
 * Résultat : session OK dans le navigateur in-app, mais pas de deep link → l’app affiche « annulé ».
 * Si cookie mobile + session Discord existent sur /member/dashboard, on renvoie vers le handoff
 * pour émettre le code et rediriger vers tenfmobile://auth?code=…
 */
export async function redirectMemberDashboardToHandoffIfMobileContext(
  request: NextRequest
): Promise<NextResponse | null> {
  if (request.nextUrl.pathname !== "/member/dashboard") return null;

  const ctx = readMobileOauthHandoffFromRequest(request);
  if (!ctx) return null;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const token = await getToken({ req: request, secret });
  if (!token?.discordId) return null;

  return NextResponse.redirect(new URL("/auth/mobile-handoff", request.url));
}
