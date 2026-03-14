import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/requireUser";
import { upsertLinkedTwitchAccount } from "@/lib/twitchLinkedAccount";

const TWITCH_LINK_STATE_COOKIE = "twitch_link_oauth_state";

function toSafeCallbackPath(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/member/profil";
  }
  return raw;
}

function appendStatusParam(path: string, key: string, value: string): string {
  const safePath = toSafeCallbackPath(path);
  const url = new URL(safePath, "http://local");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(TWITCH_LINK_STATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const defaultTarget = "/member/profil";
  try {
    const user = await requireUser();
    if (!user?.discordId) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "twitch_link_requires_login");
      return NextResponse.redirect(loginUrl);
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const state = searchParams.get("state");

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(TWITCH_LINK_STATE_COOKIE)?.value;
    let parsedState: { state: string; callbackPath?: string } | null = null;
    if (stateCookie) {
      try {
        parsedState = JSON.parse(stateCookie) as {
          state: string;
          callbackPath?: string;
        };
      } catch {
        parsedState = null;
      }
    }

    const callbackPath = toSafeCallbackPath(parsedState?.callbackPath);

    if (oauthError) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "oauth_error"),
            request.url
          )
        )
      );
    }

    if (!code) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "missing_code"),
            request.url
          )
        )
      );
    }

    if (!state || !parsedState?.state || state !== parsedState.state) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "invalid_state"),
            request.url
          )
        )
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twitch/link/callback`
      : process.env.NEXTAUTH_URL
        ? `${process.env.NEXTAUTH_URL}/api/auth/twitch/link/callback`
        : null;

    if (!clientId || !clientSecret || !redirectUri) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "config_error"),
            request.url
          )
        )
      );
    }

    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "token_exchange_failed"),
            request.url
          )
        )
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;
    const refreshToken = tokenData.refresh_token as string | undefined;
    if (!accessToken || !refreshToken) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "invalid_token_payload"),
            request.url
          )
        )
      );
    }

    const meResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "user_fetch_failed"),
            request.url
          )
        )
      );
    }

    const meData = await meResponse.json();
    const twitchUser = Array.isArray(meData?.data) ? meData.data[0] : null;
    if (!twitchUser?.id || !twitchUser?.login) {
      return clearStateCookie(
        NextResponse.redirect(
          new URL(
            appendStatusParam(callbackPath, "twitch_error", "invalid_user_payload"),
            request.url
          )
        )
      );
    }

    await upsertLinkedTwitchAccount({
      discordId: user.discordId,
      twitchUserId: twitchUser.id,
      twitchLogin: twitchUser.login,
      twitchDisplayName: twitchUser.display_name || twitchUser.login,
      twitchAvatar: twitchUser.profile_image_url || null,
      accessToken,
      refreshToken,
      tokenExpiry: new Date(Date.now() + Number(tokenData.expires_in || 0) * 1000),
      scope: Array.isArray(tokenData.scope)
        ? tokenData.scope.join(" ")
        : typeof tokenData.scope === "string"
          ? tokenData.scope
          : null,
    });

    return clearStateCookie(
      NextResponse.redirect(
        new URL(
          appendStatusParam(callbackPath || defaultTarget, "twitch_linked", "1"),
          request.url
        )
      )
    );
  } catch (error) {
    console.error("[Twitch Link Callback] Erreur:", error);
    return clearStateCookie(
      NextResponse.redirect(
        new URL(
          appendStatusParam(defaultTarget, "twitch_error", "internal_error"),
          request.url
        )
      )
    );
  }
}
