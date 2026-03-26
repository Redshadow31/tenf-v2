import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { cacheSet, getRedisClient } from "@/lib/cache";
import { storeHandoffJwt } from "@/lib/mobileAuthHandoff";

const HANDOFF_TTL_SECONDS = 120;

/**
 * Après connexion Discord (NextAuth), redirection vers cette URL (callbackUrl).
 * Émet un code à usage unique puis redirige vers le schéma d'app mobile (ex. tenfmobile://auth?code=...).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.redirect(new URL("/auth/login?error=mobile_config", request.url));
  }

  const raw = await getToken({ req: request, secret, raw: true });
  if (!raw || typeof raw !== "string") {
    return NextResponse.redirect(new URL("/auth/login?error=mobile_no_session", request.url));
  }

  const code = crypto.randomBytes(24).toString("base64url");
  const payload = { jwt: raw };

  const redis = getRedisClient();
  if (redis) {
    await cacheSet(`mobile_auth:${code}`, payload, HANDOFF_TTL_SECONDS);
  } else {
    storeHandoffJwt(code, raw, HANDOFF_TTL_SECONDS * 1000);
  }

  const scheme = process.env.MOBILE_APP_SCHEME || "tenfmobile";
  return NextResponse.redirect(`${scheme}://auth?code=${encodeURIComponent(code)}`);
}
