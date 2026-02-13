import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { evaluationRepository } from "@/lib/repositories";
import { loadRaidsFaits, loadRaidsRecus } from "@/lib/raidStorage";
import { getDiscordActivityForMonth } from "@/lib/discordActivityStorage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
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
    const evaluation = await evaluationRepository.findByMemberAndMonth(
      member.twitchLogin,
      monthKey
    );

    // 1. Raids TENF — depuis raidStorage (même source que /admin/raids)
    let raidsTENF = 0;
    try {
      const raidsFaits = await loadRaidsFaits(monthKey);
      const raidsRecus = await loadRaidsRecus(monthKey);
      const filteredFaits = raidsFaits.filter((r: any) => r.source !== "discord");
      const filteredRecus = raidsRecus.filter((r: any) => r.source !== "discord");

      for (const raid of filteredFaits) {
        const raiderMatch =
          raid.raider === member.discordId ||
          raid.raider?.toLowerCase?.() === member.twitchLogin?.toLowerCase();
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

    // 2. Spotlight — depuis evaluation
    let spotlightPresence = { present: 0, total: 0, rate: 0 };
    if (evaluation?.spotlightEvaluations?.length) {
      const spotlights = evaluation.spotlightEvaluations;
      const presentCount = spotlights.filter((s: any) =>
        s.members?.some(
          (m: any) =>
            m.twitchLogin?.toLowerCase() === member!.twitchLogin.toLowerCase() && m.present
        )
      ).length;
      spotlightPresence = {
        present: presentCount,
        total: spotlights.length,
        rate: spotlights.length ? Math.round((presentCount / spotlights.length) * 100) : 0,
      };
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
