import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { cacheSet, getRedisClient } from "@/lib/cache";
import { storeHandoffJwt } from "@/lib/mobileAuthHandoff";
import {
  appendHandoffQueryParams,
  getDefaultMobileAuthUrl,
  pickRedirectUriParam,
  resolveWhitelistedMobileRedirectUri,
  sanitizeHandoffReturnUrl,
} from "@/lib/mobileHandoffRedirect";
import { clearMobileOauthHandoffCookie, readMobileOauthHandoffFromRequest } from "@/lib/mobileOauthHandoffCookie";

const HANDOFF_TTL_SECONDS = 120;

function withClearedHandoffCookie(res: NextResponse): NextResponse {
  clearMobileOauthHandoffCookie(res);
  return res;
}

/**
 * Après connexion Discord (NextAuth), redirection vers cette URL (callbackUrl).
 * Émet un code à usage unique puis redirige vers le deep link (ex. tenfmobile://auth?code=...).
 *
 * Query supportées : redirect_uri | redirectUri (liste blanche), returnUrl (chemin relatif sûr).
 * Sinon lecture du cookie posé par GET /api/auth/mobile/discord/start.
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const queryRedirect = pickRedirectUriParam(sp.get("redirect_uri"), sp.get("redirectUri"));
  const queryReturnUrl = sanitizeHandoffReturnUrl(sp.get("returnUrl"));
  const cookieCtx = readMobileOauthHandoffFromRequest(request);

  const whitelistedFromQuery = resolveWhitelistedMobileRedirectUri(queryRedirect);
  let targetReturn: URL;
  if (whitelistedFromQuery) {
    targetReturn = whitelistedFromQuery;
  } else if (cookieCtx) {
    try {
      targetReturn = new URL(cookieCtx.redirectHref);
    } catch {
      targetReturn = getDefaultMobileAuthUrl();
    }
  } else {
    targetReturn = getDefaultMobileAuthUrl();
  }

  const returnUrl = queryReturnUrl ?? cookieCtx?.returnUrl ?? null;

  const debug = process.env.MOBILE_HANDOFF_DEBUG === "true";
  if (debug) {
    console.debug("[mobile-handoff]", {
      hasCookieCtx: Boolean(cookieCtx),
      usedQueryRedirect: Boolean(whitelistedFromQuery),
      targetHost: targetReturn.host,
      returnUrl: returnUrl ?? undefined,
    });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    const dest = appendHandoffQueryParams(targetReturn, { error: "mobile_config" });
    return withClearedHandoffCookie(NextResponse.redirect(dest));
  }

  const raw = await getToken({ req: request, secret, raw: true });
  if (!raw || typeof raw !== "string") {
    const dest = appendHandoffQueryParams(targetReturn, {
      error: "mobile_no_session",
      error_description:
        "Session NextAuth absente. Vérifier les cookies (SameSite, domaine, HTTPS) dans le navigateur in-app.",
    });
    return withClearedHandoffCookie(NextResponse.redirect(dest));
  }

  const code = crypto.randomBytes(24).toString("base64url");
  const payload = { jwt: raw };

  const redis = getRedisClient();
  if (redis) {
    await cacheSet(`mobile_auth:${code}`, payload, HANDOFF_TTL_SECONDS);
  } else {
    storeHandoffJwt(code, raw, HANDOFF_TTL_SECONDS * 1000);
  }

  const params: Record<string, string> = { code };
  if (returnUrl) params.returnUrl = returnUrl;

  const dest = appendHandoffQueryParams(targetReturn, params);
  if (debug) {
    console.debug("[mobile-handoff] redirect issued (code omitted)");
  }

  return withClearedHandoffCookie(NextResponse.redirect(dest));
}
