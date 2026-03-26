import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getToken } from "next-auth/jwt";
import { cacheSet, getRedisClient } from "@/lib/cache";
import { storeTwitchMobileState } from "@/lib/mobileAuthHandoff";

const MOBILE_CALLBACK_SENTINEL = "__mobile__";

function buildLinkCallbackRedirectUri(request: NextRequest): string {
  return new URL("/api/auth/twitch/link/callback", request.nextUrl.origin).toString();
}

/**
 * Démarre la liaison Twitch OAuth depuis l'app mobile (Authorization: Bearer JWT NextAuth).
 * Le state est stocké côté serveur (Redis ou mémoire) car le navigateur in-app n'a pas les cookies NextAuth.
 */
export async function POST(request: NextRequest) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Configuration serveur" }, { status: 500 });
    }

    const token = await getToken({ req: request, secret });
    const discordId = token?.discordId as string | undefined;
    if (!discordId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json({ error: "Twitch OAuth non configuré" }, { status: 500 });
    }

    const redirectUri = buildLinkCallbackRedirectUri(request);
    const state = crypto.randomBytes(32).toString("base64url");

    const payload = {
      discordId,
      callbackPath: MOBILE_CALLBACK_SENTINEL,
    };

    const redis = getRedisClient();
    if (redis) {
      await cacheSet(`twitch_mobile_state:${state}`, payload, 600);
    } else {
      storeTwitchMobileState(state, payload, 600_000);
    }

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "user:read:follows");
    authUrl.searchParams.set("state", state);

    return NextResponse.json({ authUrl: authUrl.toString() });
  } catch (error) {
    console.error("[Twitch Link Start Mobile] Erreur:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
