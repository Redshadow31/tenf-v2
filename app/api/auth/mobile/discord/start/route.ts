import { NextRequest, NextResponse } from "next/server";
import { pickRedirectUriParam, sanitizeHandoffReturnUrl, resolveWhitelistedMobileRedirectUri } from "@/lib/mobileHandoffRedirect";
import { setMobileOauthHandoffCookie } from "@/lib/mobileOauthHandoffCookie";

/**
 * Point d'entrée recommandé pour la connexion Discord depuis l'app mobile.
 * Pose un cookie HttpOnly (contexte deep link) puis envoie vers NextAuth ;
 * en cas d'erreur OAuth, /auth/oauth-error-bridge peut renvoyer vers l'app.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const rawRedirect = pickRedirectUriParam(sp.get("redirect_uri"), sp.get("redirectUri"));
  const allowed = resolveWhitelistedMobileRedirectUri(rawRedirect);
  if (!allowed) {
    return NextResponse.json(
      {
        error: "redirect_uri_invalide",
        message:
          "redirect_uri ou redirectUri manquant ou non autorisé (schéma d'app + host auth, ou exp:// en dev).",
      },
      { status: 400 }
    );
  }

  const returnUrl = sanitizeHandoffReturnUrl(sp.get("returnUrl"));
  const callbackPath = "/auth/mobile-handoff";
  const signIn = new URL("/api/auth/signin/discord", request.nextUrl.origin);
  signIn.searchParams.set("callbackUrl", callbackPath);

  const res = NextResponse.redirect(signIn.toString());
  setMobileOauthHandoffCookie(res, allowed.toString(), returnUrl);
  return res;
}
