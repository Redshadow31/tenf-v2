import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { memberRepository } from "@/lib/repositories";
import { evaluationRepository } from "@/lib/repositories";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * GET - Récupère les stats du mois en cours pour le membre
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

    // Raids (depuis les données Discord/raids si disponibles)
    let raidsTENF = 0;
    let spotlightPresence = { present: 0, total: 0, rate: 0 };
    let messagesRanking = { rank: 0, lastUpdate: "" };
    let vocalRanking = { rank: 0, lastUpdate: "" };

    if (evaluation) {
      raidsTENF = evaluation.raidPoints ?? 0;
      const spotlights = evaluation.spotlightEvaluations || [];
      const presentCount = spotlights.filter((s: any) =>
        s.members?.some((m: any) => m.twitchLogin?.toLowerCase() === member!.twitchLogin.toLowerCase() && m.present)
      ).length;
      spotlightPresence = {
        present: presentCount,
        total: spotlights.length || 1,
        rate: spotlights.length ? Math.round((presentCount / spotlights.length) * 100) : 0,
      };
    }

    // Discord engagement (messages, vocals) - depuis evaluation.discordEngagement
    const discordEngagement = evaluation?.discordEngagement as { messages?: number; vocals?: number } | undefined;
    if (discordEngagement) {
      messagesRanking = {
        rank: discordEngagement.messages ?? 0,
        lastUpdate: new Date().toLocaleDateString("fr-FR"),
      };
      vocalRanking = {
        rank: discordEngagement.vocals ?? 0,
        lastUpdate: new Date().toLocaleDateString("fr-FR"),
      };
    }

    // Classement messages/vocaux : requête pour le rang (simplifié)
    try {
      const monthDate = `${monthKey}-01`;
      const { data: evals } = await supabaseAdmin
        .from("evaluations")
        .select("twitch_login, discord_engagement")
        .eq("month", monthDate)
        .not("discord_engagement", "is", null);

      const withMessages = (evals || [])
        .map((e: any) => ({
          login: e.twitch_login,
          messages: e.discord_engagement?.messages ?? 0,
          vocals: e.discord_engagement?.vocals ?? 0,
        }))
        .sort((a: any, b: any) => b.messages - a.messages);

      const msgRank = withMessages.findIndex((e: any) => e.login?.toLowerCase() === member.twitchLogin.toLowerCase());
      if (msgRank >= 0) {
        messagesRanking.rank = msgRank + 1;
      }

      const withVocals = [...withMessages].sort((a: any, b: any) => b.vocals - a.vocals);
      const vocRank = withVocals.findIndex((e: any) => e.login?.toLowerCase() === member.twitchLogin.toLowerCase());
      if (vocRank >= 0) {
        vocalRanking.rank = vocRank + 1;
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
