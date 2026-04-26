import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  resolveWhitelistedMobileRedirectUri,
  sanitizeHandoffReturnUrl,
} from "@/lib/mobileHandoffRedirect";

export const MOBILE_OAUTH_HANDOFF_COOKIE = "tenf_mo_handoff";

type CookiePayload = {
  /** URL de deep link déjà validée (href) */
  redirectHref: string;
  returnUrl?: string | null;
};

const COOKIE_MAX_AGE_SEC = 900;

function cookieBaseOptions() {
  return {
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  };
}

export function setMobileOauthHandoffCookie(
  response: NextResponse,
  redirectHref: string,
  returnUrl: string | null
): void {
  const payload: CookiePayload = { redirectHref };
  if (returnUrl) payload.returnUrl = returnUrl;
  response.cookies.set(MOBILE_OAUTH_HANDOFF_COOKIE, JSON.stringify(payload), cookieBaseOptions());
}

export function clearMobileOauthHandoffCookie(response: NextResponse): void {
  response.cookies.set(MOBILE_OAUTH_HANDOFF_COOKIE, "", {
    ...cookieBaseOptions(),
    maxAge: 0,
  });
}

/**
 * Lit le cookie mobile OAuth, re-valide redirectHref (anti-forge), retourne null si invalide.
 */
export function readMobileOauthHandoffFromRequest(request: NextRequest): CookiePayload | null {
  const raw = request.cookies.get(MOBILE_OAUTH_HANDOFF_COOKIE)?.value;
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const redirectHref = typeof (parsed as CookiePayload).redirectHref === "string" ? (parsed as CookiePayload).redirectHref : "";
  const allowed = resolveWhitelistedMobileRedirectUri(redirectHref);
  if (!allowed) return null;
  const ru = sanitizeHandoffReturnUrl((parsed as CookiePayload).returnUrl ?? null);
  return { redirectHref, returnUrl: ru };
}
