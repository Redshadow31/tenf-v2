import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { requireUser } from "@/lib/requireUser";
import {
  getLinkedTwitchAccountByTwitchUserId,
  upsertLinkedTwitchAccount,
} from "@/lib/twitchLinkedAccount";
import { logger, LogCategory, LogLevel } from "@/lib/logging/logger";
import { cacheDelete, cacheGet, getRedisClient } from "@/lib/cache";
import {
  consumeTwitchMobileState,
  peekTwitchMobileState,
} from "@/lib/mobileAuthHandoff";

const TWITCH_LINK_STATE_COOKIE = "twitch_link_oauth_state";
const MOBILE_CALLBACK_SENTINEL = "__mobile__";

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

function buildLinkCallbackRedirectUri(request: NextRequest): string {
  return new URL("/api/auth/twitch/link/callback", request.nextUrl.origin).toString();
}

function mobileAppUrl(params: Record<string, string>): string {
  const scheme = process.env.MOBILE_APP_SCHEME || "tenfmobile";
  const u = new URL(`${scheme}://auth`);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

type MobilePayload = { discordId: string; callbackPath: string };

async function peekMobilePayload(state: string | null): Promise<MobilePayload | null> {
  if (!state) return null;
  const redis = getRedisClient();
  if (redis) {
    return (await cacheGet<MobilePayload>(`twitch_mobile_state:${state}`)) ?? null;
  }
  return peekTwitchMobileState(state);
}

async function consumeMobilePayload(state: string | null): Promise<void> {
  if (!state) return;
  const redis = getRedisClient();
  if (redis) {
    await cacheDelete(`twitch_mobile_state:${state}`);
  } else {
    consumeTwitchMobileState(state);
  }
}

export async function GET(request: NextRequest) {
  const defaultTarget = "/member/profil";
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const oauthError = searchParams.get("error");
    const stateParam = searchParams.get("state");

    const cookieStore = await cookies();
    const stateCookie = cookieStore.get(TWITCH_LINK_STATE_COOKIE)?.value;
    let parsedCookie: { state: string; callbackPath?: string } | null = null;
    if (stateCookie) {
      try {
        parsedCookie = JSON.parse(stateCookie) as {
          state: string;
          callbackPath?: string;
        };
      } catch {
        parsedCookie = null;
      }
    }

    const cookieMatches =
      Boolean(parsedCookie?.state && stateParam && parsedCookie.state === stateParam);

    const mobilePeek = await peekMobilePayload(stateParam);

    let discordId: string | null = null;
    let callbackPath = defaultTarget;
    let isMobileFlow = false;

    if (cookieMatches) {
      const user = await requireUser();
      if (!user?.discordId) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("error", "twitch_link_requires_login");
        return NextResponse.redirect(loginUrl);
      }
      discordId = user.discordId;
      callbackPath = toSafeCallbackPath(parsedCookie?.callbackPath);
    } else if (mobilePeek?.discordId) {
      discordId = mobilePeek.discordId;
      isMobileFlow = mobilePeek.callbackPath === MOBILE_CALLBACK_SENTINEL;
      callbackPath = isMobileFlow ? MOBILE_CALLBACK_SENTINEL : toSafeCallbackPath(mobilePeek.callbackPath);
    } else {
      const target = appendStatusParam(defaultTarget, "twitch_error", "invalid_state");
      return clearStateCookie(NextResponse.redirect(new URL(target, request.url)));
    }

    const redirectError = async (errKey: string) => {
      await consumeMobilePayload(stateParam);
      if (isMobileFlow) {
        return clearStateCookie(
          NextResponse.redirect(mobileAppUrl({ twitch_error: errKey }))
        );
      }
      return clearStateCookie(
        NextResponse.redirect(
          new URL(appendStatusParam(callbackPath, "twitch_error", errKey), request.url)
        )
      );
    };

    if (oauthError) {
      return redirectError("oauth_error");
    }

    if (!code) {
      return redirectError("missing_code");
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = buildLinkCallbackRedirectUri(request);

    if (!clientId || !clientSecret) {
      return redirectError("config_error");
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
      return redirectError("token_exchange_failed");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token as string | undefined;
    const refreshToken = tokenData.refresh_token as string | undefined;
    if (!accessToken || !refreshToken) {
      return redirectError("invalid_token_payload");
    }

    const meResponse = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!meResponse.ok) {
      return redirectError("user_fetch_failed");
    }

    const meData = await meResponse.json();
    const twitchUser = Array.isArray(meData?.data) ? meData.data[0] : null;
    if (!twitchUser?.id || !twitchUser?.login) {
      return redirectError("invalid_user_payload");
    }

    const existingForTwitchUser = await getLinkedTwitchAccountByTwitchUserId(
      String(twitchUser.id)
    );
    if (
      existingForTwitchUser &&
      existingForTwitchUser.discordId &&
      existingForTwitchUser.discordId !== discordId
    ) {
      return redirectError("already_linked_elsewhere");
    }

    try {
      await upsertLinkedTwitchAccount({
        discordId: discordId!,
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
    } catch (upsertError: any) {
      const errorMessage = String(upsertError?.message || "");
      const errorCode = String(upsertError?.code || "");
      const isUniqueTwitchConflict =
        errorCode === "23505" &&
        (errorMessage.includes("twitch_user_id") ||
          errorMessage.includes("linked_twitch_accounts_twitch_user_id_key"));
      if (isUniqueTwitchConflict) {
        return redirectError("already_linked_elsewhere");
      }
      throw upsertError;
    }

    await logger.log({
      category: LogCategory.TWITCH,
      level: LogLevel.INFO,
      message: "Liaison Twitch effectuee",
      userId: discordId!,
      route: "/api/auth/twitch/link/callback",
      details: {
        action: "twitch_link_success",
        discordId: discordId!,
        twitchUserId: String(twitchUser.id),
        twitchLogin: String(twitchUser.login || "").toLowerCase(),
        twitchDisplayName: String(twitchUser.display_name || twitchUser.login || ""),
      },
      metadata: {
        resourceType: "linked_twitch_account",
        resourceId: String(twitchUser.id),
      },
    });

    await consumeMobilePayload(stateParam);

    if (isMobileFlow) {
      return clearStateCookie(
        NextResponse.redirect(mobileAppUrl({ twitch_linked: "1" }))
      );
    }

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
