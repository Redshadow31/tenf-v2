/**
 * Rattachement des clés d’import Discord (messages / vocaux) aux comptes Twitch.
 *
 * On n’utilise PAS displayName ni siteUsername ici : ce sont des chaînes libres qui
 * peuvent coïncider avec le login Twitch d’un autre membre et voler / détourner des stats
 * (la page admin agrège par clé brute ; l’espace membre doit résoudre sans ambiguïté).
 */

import type { MemberData } from "@/lib/memberData";

export function normalizeKey(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/^@+/, "");
}

export function compactKey(value?: string | null): string {
  return normalizeKey(value).replace(/[^a-z0-9]/g, "");
}

export function addIdentityAliases(index: Map<string, string>, rawValue: string | null | undefined, login: string) {
  const normalized = normalizeKey(rawValue);
  if (!normalized) return;

  index.set(normalized, login);
  const compact = compactKey(normalized);
  if (compact) index.set(compact, login);

  const hashIdx = normalized.indexOf("#");
  if (hashIdx > 0) {
    index.set(normalized.slice(0, hashIdx), login);
  }

  if (normalized.startsWith("<@") && normalized.endsWith(">")) {
    const mentionId = normalized.replace(/[<@!>]/g, "");
    if (mentionId) {
      index.set(mentionId, login);
      const mentionCompact = compactKey(mentionId);
      if (mentionCompact) index.set(mentionCompact, login);
    }
  }
}

/** Index strict pour résoudre les clés du stockage `discord-activity` vers `twitch_login`. */
export function buildDiscordStorageIdentityMap(members: MemberData[]): Map<string, string> {
  const identityToLogin = new Map<string, string>();
  for (const m of members) {
    const login = normalizeKey(m.twitchLogin);
    if (!login) continue;
    addIdentityAliases(identityToLogin, login, login);
    addIdentityAliases(identityToLogin, m.discordId, login);
    addIdentityAliases(identityToLogin, m.discordUsername, login);
  }
  return identityToLogin;
}

export function remapAndAggregateEntries(
  entries: Array<{ key: string; value: number }>,
  identityToLogin: Map<string, string>
): Array<{ key: string; value: number }> {
  const aggregated = new Map<string, number>();
  for (const entry of entries) {
    const rawKey = normalizeKey(entry.key);
    if (!rawKey) continue;
    const canonicalKey = identityToLogin.get(rawKey) || identityToLogin.get(compactKey(rawKey)) || rawKey;
    const current = aggregated.get(canonicalKey) || 0;
    aggregated.set(canonicalKey, current + (Number.isFinite(entry.value) ? entry.value : 0));
  }

  return Array.from(aggregated.entries())
    .map(([key, value]) => ({ key, value }))
    .sort((a, b) => b.value - a.value);
}

export function coerceMessageCount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}
