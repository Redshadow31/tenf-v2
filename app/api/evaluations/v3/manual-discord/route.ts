import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { getCurrentMonthKey } from "@/lib/evaluationStorage";
import { memberRepository } from "@/lib/repositories";
import { getDiscordEngagementData } from "@/lib/discordEngagementStorage";
import { loadEvaluationV3Pilotage, upsertEvaluationV3PilotageDiscord } from "@/lib/evaluationV3PilotageStorage";
import { scoreV3DiscordBlock } from "@/lib/evaluationV3Scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseMonth(raw: string | null): string {
  if (raw && /^\d{4}-\d{2}$/.test(raw)) return raw;
  return getCurrentMonthKey();
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseMonth(searchParams.get("month"));
    const withSuggestions = searchParams.get("suggestions") === "1";

    const pilotage = await loadEvaluationV3Pilotage(month);
    const entries: Record<string, unknown> = {};
    for (const [login, row] of Object.entries(pilotage?.entries || {})) {
      if (row.discord) entries[login] = { twitchLogin: login, ...row.discord };
    }

    let suggestions: Record<
      string,
      { nbMessages: number; nbVocalMinutes: number; source: "blob_primary" | "none" }
    > = {};

    if (withSuggestions) {
      const members = await memberRepository.findAll(2000, 0);
      const discordIdToLogin = new Map<string, string>();
      for (const m of members) {
        if (m.discordId && m.twitchLogin) {
          discordIdToLogin.set(m.discordId, m.twitchLogin.toLowerCase());
        }
      }

      const engagement = await getDiscordEngagementData(month);
      suggestions = {};
      if (engagement?.dataByMember) {
        for (const [discordId, row] of Object.entries(engagement.dataByMember)) {
          const login = discordIdToLogin.get(discordId);
          if (!login) continue;
          suggestions[login] = {
            nbMessages: Math.max(0, Math.floor(Number((row as any).nbMessages) || 0)),
            nbVocalMinutes: Math.max(0, Math.floor(Number((row as any).nbVocalMinutes) || 0)),
            source: "blob_primary",
          };
        }
      }
    }

    return NextResponse.json({
      success: true,
      month,
      lastUpdated: pilotage?.lastUpdated || null,
      entries,
      suggestions: withSuggestions ? suggestions : undefined,
    });
  } catch (error) {
    console.error("[API evaluations/v3/manual-discord] GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const month = parseMonth(typeof body?.month === "string" ? body.month : null);
    const twitchLogin = String(body?.twitchLogin || "")
      .toLowerCase()
      .trim();
    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin est requis" }, { status: 400 });
    }

    const reasonRaw = typeof body?.reason === "string" ? body.reason.trim() : "";
    const reason = reasonRaw || "Saisie pilotage v3 (Discord manuel)";

    const nbMessages = Math.max(0, Math.floor(Number(body?.nbMessages) ?? 0));
    const nbVocalMinutes = Math.max(0, Number(body?.nbVocalMinutes) ?? 0);
    const nbReactions = Math.max(0, Math.floor(Number(body?.nbReactions) ?? 0));
    const staffNote = typeof body?.staffNote === "string" ? body.staffNote.trim() : undefined;

    const savedDiscord = await upsertEvaluationV3PilotageDiscord(month, {
      twitchLogin,
      nbMessages,
      nbVocalMinutes,
      nbReactions,
      staffNote,
      reason,
      updatedBy: admin.discordId || admin.username || "admin",
    });

    const scores = scoreV3DiscordBlock({
      nbMessages: savedDiscord.discord!.nbMessages,
      nbVocalMinutes: savedDiscord.discord!.nbVocalMinutes,
      nbReactions: savedDiscord.discord!.nbReactions,
    });

    return NextResponse.json({ success: true, month, entry: savedDiscord.discord, scores });
  } catch (error) {
    console.error("[API evaluations/v3/manual-discord] PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
