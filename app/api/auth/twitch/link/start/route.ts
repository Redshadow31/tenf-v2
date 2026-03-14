import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireUser } from "@/lib/requireUser";

const TWITCH_LINK_STATE_COOKIE = "twitch_link_oauth_state";
const TWITCH_LINK_STATE_MAX_AGE_SECONDS = 10 * 60;

function sanitizeCallbackPath(input: string | null): string {
  if (!input) return "/member/profil";
  if (!input.startsWith("/")) return "/member/profil";
  if (input.startsWith("//")) return "/member/profil";
  return input;
}

function buildLinkCallbackRedirectUri(request: NextRequest): string {
  return new URL("/api/auth/twitch/link/callback", request.nextUrl.origin).toString();
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "twitch_link_requires_login");
      return NextResponse.redirect(loginUrl);
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const redirectUri = buildLinkCallbackRedirectUri(request);

    if (!clientId) {
      return NextResponse.json(
        { error: "Configuration Twitch OAuth manquante" },
        { status: 500 }
      );
    }

    const callbackPath = sanitizeCallbackPath(
      request.nextUrl.searchParams.get("callbackUrl")
    );
    const state = crypto.randomBytes(32).toString("base64url");

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "user:read:follows");
    authUrl.searchParams.set("state", state);

    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set(
      TWITCH_LINK_STATE_COOKIE,
      JSON.stringify({ state, callbackPath }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TWITCH_LINK_STATE_MAX_AGE_SECONDS,
        path: "/",
      }
    );
    return response;
  } catch (error) {
    console.error("[Twitch Link Start] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne" },
      { status: 500 }
    );
  }
}
