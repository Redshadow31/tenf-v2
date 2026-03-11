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
  return (value || "").toLowerCase().trim();
}

/**
 * Calcule le rang d'un membre dans un classement trié
 * Les clés peuvent être twitch login, display name ou discord username
 */
function getRank(
  allEntries: Array<{ key: string; value: number }>,
  member: { twitchLogin: string; displayName?: string; siteUsername?: string; discordUsername?: string }
): number {
  const candidates = [
    member.twitchLogin,
    member.displayName,
    member.siteUsername,
    member.discordUsername,
  ]
    .filter(Boolean)
    .map((s) => (s || "").toLowerCase().trim());
  const idx = allEntries.findIndex((e) => {
    const k = e.key.toLowerCase().trim();
    return candidates.some((c) => c && k === c);
  });
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * GET - Récupère les stats du mois en cours pour le membre
 * Utilise les mêmes sources que l'admin : raids (raidStorage), Discord (discordActivityStorage)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const twitchLoginParam = searchParams.get("twitchLogin");

    let member = null;
    const session = await getServerSession(authOptions);

    if (session?.user?.discordId) {
      member = await memberRepository.findByDiscordId(session.user.discordId);
    }
    if (!member && twitchLoginParam) {
      member = await memberRepository.findByTwitchLogin(twitchLoginParam);
    }

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
      identityToLogin.set(login, login);
      if (m.discordId) identityToLogin.set(normalizeKey(m.discordId), login);
      if (m.discordUsername) identityToLogin.set(normalizeKey(m.discordUsername), login);
      if (m.displayName) identityToLogin.set(normalizeKey(m.displayName), login);
      if (m.siteUsername) identityToLogin.set(normalizeKey(m.siteUsername), login);
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
      const [year, month] = monthKey.split("-").map((v) => parseInt(v, 10));
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

      let totalValidatedSpotlights = 0;
      let presentCount = 0;

      for (const event of spotlightEvents) {
        const presences = await eventRepository.getPresences(event.id);
        // Compter uniquement les spotlights réellement validés (au moins une présence enregistrée)
        if (!presences || presences.length === 0) continue;
        totalValidatedSpotlights += 1;

        const isPresent = presences.some(
          (p: any) =>
            normalizeKey(p.twitchLogin) === memberLogin &&
            p.present === true
        );
        if (isPresent) presentCount += 1;
      }

      spotlightPresence = {
        present: presentCount,
        total: totalValidatedSpotlights,
        rate: totalValidatedSpotlights ? Math.round((presentCount / totalValidatedSpotlights) * 100) : 0,
      };
    } catch {
      // Fallback historique : evaluation.spotlightEvaluations si event_presences indisponible
      if (evaluation?.spotlightEvaluations?.length) {
        const spotlights = evaluation.spotlightEvaluations;
        const presentCount = spotlights.filter((s: any) =>
          s.members?.some(
            (m: any) =>
              normalizeKey(m.twitchLogin) === memberLogin && m.present
          )
        ).length;
        spotlightPresence = {
          present: presentCount,
          total: spotlights.length,
          rate: spotlights.length ? Math.round((presentCount / spotlights.length) * 100) : 0,
        };
      }
    }

    // 3. Discord messages / vocaux — depuis discordActivityStorage (même source que admin dashboard)
    let messagesRanking = { rank: 0, lastUpdate: "" };
    let vocalRanking = { rank: 0, lastUpdate: "" };
    try {
      const activityData = await getDiscordActivityForMonth(monthKey);
      if (activityData) {
        const messagesByUser = activityData.messagesByUser || {};
        const vocalsByUser = activityData.vocalsByUser || {};

        const messagesEntries = Object.entries(messagesByUser)
          .map(([k, v]) => ({ key: k, value: typeof v === "number" ? v : 0 }))
          .sort((a, b) => b.value - a.value);
        const vocalsEntries = Object.entries(vocalsByUser)
          .map(([k, v]) => ({
            key: k,
            value:
              typeof v === "object" && v !== null && "totalMinutes" in v
                ? (v as any).totalMinutes ?? 0
                : 0,
          }))
          .sort((a, b) => b.value - a.value);

        messagesRanking = {
          rank: getRank(messagesEntries, member),
          lastUpdate: new Date().toLocaleDateString("fr-FR"),
        };
        vocalRanking = {
          rank: getRank(vocalsEntries, member),
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
