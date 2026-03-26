import { NextRequest, NextResponse } from "next/server";
import { cacheGet, cacheDelete, getRedisClient } from "@/lib/cache";
import { consumeHandoffJwt } from "@/lib/mobileAuthHandoff";

/**
 * Échange un code (émis par /auth/mobile-handoff) contre le JWT NextAuth.
 * Utilisé par l'application mobile Expo.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const code = typeof (body as { code?: unknown })?.code === "string" ? (body as { code: string }).code : "";
  if (!code) {
    return NextResponse.json({ error: "Paramètre code requis" }, { status: 400 });
  }

  let jwt: string | null = null;
  const redis = getRedisClient();
  if (redis) {
    const data = await cacheGet<{ jwt?: string }>(`mobile_auth:${code}`);
    jwt = typeof data?.jwt === "string" ? data.jwt : null;
    await cacheDelete(`mobile_auth:${code}`);
  } else {
    jwt = consumeHandoffJwt(code);
  }

  if (!jwt) {
    return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 400 });
  }

  return NextResponse.json({
    accessToken: jwt,
    expiresIn: 60 * 60 * 24 * 7,
    tokenType: "Bearer",
  });
}
