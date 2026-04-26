import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { evaluationRepository } from "@/lib/repositories";
import { loadRaidsFaits } from "@/lib/raidStorage";
import { getDiscordActivityForMonth } from "@/lib/discordActivityStorage";
import { eventRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

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

  // Alias Discord legacy: username#1234 -> username
  const hashIdx = normalized.indexOf("#");
  if (hashIdx > 0) {
    index.set(normalized.slice(0, hashIdx), login);
  }

  // Alias mention Discord: <@123> or <@!123>
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

function safeTimestamp(value?: string): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function dedupeEventPresences(presences: any[]): any[] {
  const byLogin = new Map<string, any>();
  for (const presence of presences || []) {
    const key = normalizeKey(presence?.twitchLogin);
    if (!key) continue;

    const existing = byLogin.get(key);
    if (!existing) {
      byLogin.set(key, presence);
      continue;
    }

    const existingTs = Math.max(safeTimestamp(existing?.validatedAt), safeTimestamp(existing?.createdAt));
    const currentTs = Math.max(safeTimestamp(presence?.validatedAt), safeTimestamp(presence?.createdAt));
    const hasClearNewer = currentTs !== existingTs;
    const newer = hasClearNewer ? (currentTs > existingTs ? presence : existing) : presence;
    const older = newer === presence ? existing : presence;
    const resolvedPresent = hasClearNewer ? newer.present : (newer.present && older.present);

    byLogin.set(key, {
      ...newer,
      present: resolvedPresent,
      note: newer.note || older.note,
      addedManually: newer.addedManually || older.addedManually,
      isRegistered: newer.isRegistered || older.isRegistered,
    });
  }
  return Array.from(byLogin.values());
}

/**
 * Calcule le rang d'un membre dans un classement trié
 * Les clés peuvent être twitch login, display name ou discord username
 */
function getRank(
  allEntries: Array<{ key: string; value: number }>,
  member: { twitchLogin: string; displayName?: string; siteUsername?: string; discordUsername?: string }
): number {
  const rawCandidates = [
    member.twitchLogin,
    member.displayName,
    member.siteUsername,
    member.discordUsername,
  ].filter(Boolean);
  const normalizedCandidates = rawCandidates.map((s) => normalizeKey(s || ""));
  const compactCandidates = normalizedCandidates.map((s) => compactKey(s));

  const idx = allEntries.findIndex((e) => {
    const k = normalizeKey(e.key);
    const kc = compactKey(k);
    return (
      normalizedCandidates.some((c) => c && k === c) ||
      compactCandidates.some((c) => c && kc === c)
    );
  });
  return idx >= 0 ? idx + 1 : 0;
}

function formatMinutesToHHMM(totalMinutes: number): string {
  const safeMinutes = Number.isFinite(totalMinutes) ? Math.max(0, Math.round(totalMinutes)) : 0;
  const hh = Math.floor(safeMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mm = (safeMinutes % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * GET - Récupère les stats du mois en cours pour le membre
 * Utilise les mêmes sources que l'admin : raids (raidStorage), Discord (discordActivityStorage)
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Authentification requise" },
        { status: 401 }
      );
    }

    const member = await memberRepository.findByDiscordId(session.user.discordId);

    if (!member) {
      return NextResponse.json(
        { error: "Membre non trouvé" },
        { status: 404 }
      );
    }

    const monthKey = getCurrentMonthKey();
    const evaluation = await evaluationRepository.findByMemberAndMonth(member.twitchLogin, monthKey);
    const memberLogin = normalizeKey(member.twitchLogin);
    const memberIdentityCandidates = new Set<string>(
      [
        member.twitchLogin,
        member.discordId,
        member.discordUsername,
        member.displayName,
        member.siteUsername,
      ]
        .filter(Boolean)
        .map((v) => normalizeKey(v))
    );

    // Préparer un index d'identité (discordId / usernames / displayName -> twitchLogin)
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

    // 1. Raids TENF — depuis raidStorage (même source que /admin/raids)
    let raidsTENF = 0;
    try {
      const raidsFaits = await loadRaidsFaits(monthKey);
      const filteredFaits = raidsFaits.filter((raid: any) => {
        const source = raid.source || (raid.manual ? "admin" : "twitch-live");
        if (source === "discord") return false;
        return source === "manual" || source === "admin" || raid.manual;
      });

      for (const raid of filteredFaits) {
        const rawRaider = normalizeKey(raid.raider);
        const mappedRaiderLogin = identityToLogin.get(rawRaider) || rawRaider;

        // Matching robuste: accepte login, discordId, username et displayName.
        const raiderMatch =
          mappedRaiderLogin === memberLogin ||
          memberIdentityCandidates.has(rawRaider) ||
          memberIdentityCandidates.has(mappedRaiderLogin);

        if (raiderMatch) {
          raidsTENF += raid.count ?? 1;
        }
      }
    } catch {
      // Fallback: evaluation.raidPoints si disponible (points, pas le count - on préfère 0 si pas de raids)
      if (evaluation?.raidPoints != null && raidsTENF === 0) {
        // raidPoints = points 0-5, pas le count; on ne l'utilise pas pour le nombre affiché
      }
    }

    // 2. Spotlight — depuis event_presences (même logique que /admin/events/presence)
    let spotlightPresence = { present: 0, total: 0, rate: 0 };
    try {
      const now = new Date();
      const allEvents = await eventRepository.findAll(1000, 0);
      const spotlightEvents = allEvents.filter((event) => {
        const d = event.date instanceof Date ? event.date : new Date(event.date);
        const eventMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const category = normalizeKey(event.category);
        return (
          eventMonth === monthKey &&
          category.includes("spotlight") &&
          d.getTime() <= now.getTime()
        );
      });

      let totalSpotlights = spotlightEvents.length;
      let presentCount = 0;

      for (const event of spotlightEvents) {
        const rawPresences = await eventRepository.getPresences(event.id);
        const presences = dedupeEventPresences(rawPresences || []);
        if (!presences || presences.length === 0) continue;

        const isPresent = presences.some(
          (p: any) => {
            if (p.present !== true) return false;
            const rawPresenceIdentity = normalizeKey(p?.twitchLogin);
            const mappedPresenceLogin = identityToLogin.get(rawPresenceIdentity) || rawPresenceIdentity;
            return (
              mappedPresenceLogin === memberLogin ||
              memberIdentityCandidates.has(rawPresenceIdentity) ||
              memberIdentityCandidates.has(mappedPresenceLogin)
            );
          }
        );
        if (isPresent) presentCount += 1;
      }

      spotlightPresence = {
        present: presentCount,
        total: totalSpotlights,
        rate: totalSpotlights ? Math.round((presentCount / totalSpotlights) * 100) : 0,
      };
    } catch {
      // Ignore: fallback ci-dessous
    }

    // Fallback / consolidation via évaluations Spotlight si disponible
    if (evaluation?.spotlightEvaluations?.length) {
      const spotlights = evaluation.spotlightEvaluations;
      const fallbackPresent = spotlights.filter((s: any) =>
        s.members?.some((m: any) => {
          const mKey = normalizeKey(m.twitchLogin);
          const mCompact = compactKey(mKey);
          return (
            m.present &&
            (mKey === memberLogin ||
              memberIdentityCandidates.has(mKey) ||
              memberIdentityCandidates.has(mCompact))
          );
        })
      ).length;
      const fallbackTotal = spotlights.length;

      const mergedTotal = spotlightPresence.total > 0 ? spotlightPresence.total : fallbackTotal;
      const mergedPresent = Math.max(spotlightPresence.present, fallbackPresent);
      spotlightPresence = {
        present: mergedPresent,
        total: mergedTotal,
        rate: mergedTotal ? Math.round((mergedPresent / mergedTotal) * 100) : 0,
      };
    }

    // 3. Discord messages / vocaux — depuis discordActivityStorage (même source que admin dashboard)
    let messagesRanking = { rank: 0, messages: 0, lastUpdate: "" };
    let vocalRanking = { rank: 0, totalMinutes: 0, display: "00:00", lastUpdate: "" };
    try {
      const activityData = await getDiscordActivityForMonth(monthKey);
      if (activityData) {
        const messagesByUser = activityData.messagesByUser || {};
        const vocalsByUser = activityData.vocalsByUser || {};

        const rawMessagesEntries = Object.entries(messagesByUser)
          .map(([k, v]) => ({ key: k, value: typeof v === "number" ? v : 0 }))
          .filter((entry) => entry.key && Number.isFinite(entry.value));
        const rawVocalsEntries = Object.entries(vocalsByUser)
          .map(([k, v]) => ({
            key: k,
            value:
              typeof v === "object" && v !== null && "totalMinutes" in v
                ? (v as any).totalMinutes ?? 0
                : 0,
          }))
          .filter((entry) => entry.key && Number.isFinite(entry.value));

        const messagesEntries = remapAndAggregateEntries(rawMessagesEntries, identityToLogin);
        const vocalsEntries = remapAndAggregateEntries(rawVocalsEntries, identityToLogin);
        const messagesRank = getRank(messagesEntries, member);
        const vocalsRank = getRank(vocalsEntries, member);
        const messagesValue = messagesRank > 0 ? messagesEntries[messagesRank - 1]?.value || 0 : 0;
        const vocalsMinutes = vocalsRank > 0 ? vocalsEntries[vocalsRank - 1]?.value || 0 : 0;

        messagesRanking = {
          rank: messagesRank,
          messages: messagesValue,
          lastUpdate: new Date().toLocaleDateString("fr-FR"),
        };
        vocalRanking = {
          rank: vocalsRank,
          totalMinutes: vocalsMinutes,
          display: formatMinutesToHHMM(vocalsMinutes),
          lastUpdate: new Date().toLocaleDateString("fr-FR"),
        };
      }
    } catch {
      // Ignorer
    }

    return NextResponse.json({
      monthKey,
      raidsTENF,
      spotlightPresence,
      messagesRanking,
      vocalRanking,
    });
  } catch (error) {
    console.error("[members/me/monthly] GET error:", error);
    return NextResponse.json(
      { error: "Erreur lors du chargement des stats" },
      { status: 500 }
    );
  }
}
