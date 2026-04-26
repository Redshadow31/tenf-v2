/**
 * Validation stricte des URLs de retour OAuth mobile (deep links).
 * Évite les open-redirects (http(s), javascript:, etc.).
 */

const DEFAULT_AUTH_HOST = "auth";
const RETURN_URL_MAX_LEN = 512;

export function getDefaultMobileAuthUrl(): URL {
  const scheme = process.env.MOBILE_APP_SCHEME || "tenfmobile";
  return new URL(`${scheme}://${DEFAULT_AUTH_HOST}`);
}

function allowExpoDeepLinks(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.MOBILE_ALLOW_EXPO_REDIRECT === "true"
  );
}

function parseDeepLink(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed);
  } catch {
    return null;
  }
}

/**
 * Vérifie si l'URL correspond au schéma d'app (ex. tenfmobile://auth).
 */
function isAllowedCustomSchemeAuthUrl(u: URL, mobileScheme: string): boolean {
  if (u.protocol !== `${mobileScheme}:`) return false;
  if (u.username || u.password) return false;
  const path = u.pathname || "";
  const host = u.hostname.toLowerCase();
  // tenfmobile://auth ou tenfmobile://auth/ (hôte "auth")
  if (host === DEFAULT_AUTH_HOST && (path === "" || path === "/")) return true;
  // tenfmobile:///auth — certaines stacks Expo / Linking.createURL("auth")
  if (!host && (path === "/auth" || path === "/auth/")) return true;
  return false;
}

/**
 * Expo Go : exp://hôte:port/--/auth ou chemin se terminant par /auth.
 */
function isAllowedExpoAuthUrl(u: URL): boolean {
  if (u.protocol !== "exp:") return false;
  if (!allowExpoDeepLinks()) return false;
  if (u.username || u.password) return false;
  const p = u.pathname || "";
  if (/--\/auth(\/|$)/.test(p)) return true;
  if (/\/auth\/?$/.test(p)) return true;
  return false;
}

/**
 * Premier paramètre non vide entre redirect_uri et redirectUri (alias mobile).
 */
export function pickRedirectUriParam(
  redirectUri: string | null | undefined,
  redirectUriAlt: string | null | undefined
): string | null {
  const a = redirectUri?.trim();
  if (a) return a;
  const b = redirectUriAlt?.trim();
  if (b) return b;
  return null;
}

/**
 * Retourne une URL de deep link autorisée, ou null si le candidat est absent ou non autorisé.
 */
export function resolveWhitelistedMobileRedirectUri(raw: string | null | undefined): URL | null {
  if (!raw?.trim()) return null;
  const u = parseDeepLink(raw);
  if (!u) return null;
  const mobileScheme = (process.env.MOBILE_APP_SCHEME || "tenfmobile").toLowerCase();
  if (u.protocol === "http:" || u.protocol === "https:") return null;
  if (isAllowedCustomSchemeAuthUrl(u, mobileScheme)) return u;
  if (isAllowedExpoAuthUrl(u)) return u;
  return null;
}

/**
 * returnUrl relatif sûr à repasser à l'app (navigation post-login).
 */
export function sanitizeHandoffReturnUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim();
  if (!s || s.length > RETURN_URL_MAX_LEN) return null;
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  if (s.includes("://") || s.includes("\\")) return null;
  return s;
}

export function appendHandoffQueryParams(target: URL, params: Record<string, string>): string {
  const out = new URL(target.toString());
  for (const [k, v] of Object.entries(params)) {
    if (!v) continue;
    out.searchParams.set(k, v);
  }
  return out.toString();
}
