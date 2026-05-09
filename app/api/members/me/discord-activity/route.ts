import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { loadDiscordActivity } from "@/lib/discordActivityStorage";
import { formatVocalDurationFr, vocalEntryToMinutes } from "@/lib/discordActivityVocal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function normalizeKey(value?: string | null): string {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/^@+/, "");
}

function compactKey(value?: string | null): string {
  return normalizeKey(value).replace(/[^a-z0-9]/g, "");
}

function addIdentityAliases(index: Map<string, string>, rawValue: string | null | undefined, login: string) {
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

function remapAndAggregateEntries(
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

/**
 * GET — Historique mensuel messages + vocal Discord pour le membre connecté (même stockage que l’admin).
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.discordId) {
      return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
    }

    const member = await memberRepository.findByDiscordId(session.user.discordId);
    if (!member?.twitchLogin) {
      return NextResponse.json({ error: "Membre non trouvé" }, { status: 404 });
    }

    const memberLogin = normalizeKey(member.twitchLogin);
    if (!memberLogin) {
      return NextResponse.json({ error: "Profil incomplet (login Twitch)" }, { status: 400 });
    }

    const allMembers = await memberRepository.findAll(2000, 0);
    const identityToLogin = new Map<string, string>();
    for (const m of allMembers) {
      const login = normalizeKey(m.twitchLogin);
      if (!login) continue;
      addIdentityAliases(identityToLogin, login, login);
      addIdentityAliases(identityToLogin, m.discordId, login);
      addIdentityAliases(identityToLogin, m.discordUsername, login);
      addIdentityAliases(identityToLogin, m.displayName, login);
      addIdentityAliases(identityToLogin, m.siteUsername, login);
    }

    const storage = await loadDiscordActivity();
    const months = Object.keys(storage)
      .filter((k) => /^\d{4}-\d{2}$/.test(k))
      .sort((a, b) => b.localeCompare(a));

    const rows = months.map((month) => {
      const data = storage[month];
      if (!data) {
        return {
          month,
          messages: 0,
          vocalMinutes: 0,
          vocalDisplay: formatVocalDurationFr(0),
          vocalHoursDecimal: 0,
        };
      }

      const messagesByUser = data.messagesByUser || {};
      const vocalsByUser = data.vocalsByUser || {};

      const rawMessagesEntries = Object.entries(messagesByUser)
        .map(([k, v]) => ({ key: k, value: typeof v === "number" ? v : 0 }))
        .filter((entry) => entry.key && Number.isFinite(entry.value));

      const messagesEntries = remapAndAggregateEntries(rawMessagesEntries, identityToLogin);
      const msgRow = messagesEntries.find((e) => normalizeKey(e.key) === memberLogin);
      const messages = msgRow?.value ?? 0;

      const rawVocalsEntries = Object.entries(vocalsByUser)
        .map(([k, v]) => ({
          key: k,
          value: vocalEntryToMinutes(v),
        }))
        .filter((entry) => entry.key && Number.isFinite(entry.value));

      const vocalsEntries = remapAndAggregateEntries(rawVocalsEntries, identityToLogin);
      const vocRow = vocalsEntries.find((e) => normalizeKey(e.key) === memberLogin);
      const vocalMinutes = vocRow?.value ?? 0;

      return {
        month,
        messages,
        vocalMinutes,
        vocalDisplay: formatVocalDurationFr(vocalMinutes),
        vocalHoursDecimal: Math.round((vocalMinutes / 60) * 10) / 10,
      };
    });

    const res = NextResponse.json({
      success: true,
      displayName: member.displayName || member.twitchLogin,
      twitchLogin: member.twitchLogin,
      months: rows,
    });
    res.headers.set("Cache-Control", "private, no-store");
    return res;
  } catch (error) {
    console.error("[members/me/discord-activity] GET error:", error);
    return NextResponse.json({ error: "Erreur lors du chargement" }, { status: 500 });
  }
}
