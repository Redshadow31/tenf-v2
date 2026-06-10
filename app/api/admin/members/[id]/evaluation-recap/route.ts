import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { evaluationRepository } from "@/lib/repositories";
import { resolveMemberForFiche } from "@/lib/admin/members-fiche/resolveMemberForFiche";
import {
  buildMonthKeys,
  filterEvaluationsByMonthKeys,
  mapSupabaseEvaluationToFicheRecord,
} from "@/lib/admin/members-fiche/memberEvaluationRecapApi";

export const dynamic = "force-dynamic";

function parseMonthsParam(request: NextRequest): number {
  const monthsParam = new URL(request.url).searchParams.get("months");
  const parsed = Number.parseInt(monthsParam || "24", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return 24;
  return Math.min(parsed, 36);
}

/**
 * GET — Récap évaluations membre (source Evaluation D / Supabase monthly_evaluations).
 * Aligné sur /api/evaluations/progression et la synthèse D.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
    }

    const decodedId = decodeURIComponent(params.id || "").trim();
    if (!decodedId) {
      return NextResponse.json({ error: "Identifiant membre requis" }, { status: 400 });
    }

    const member = await resolveMemberForFiche(decodedId);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const twitchLogin = String(member.twitchLogin || "").trim().toLowerCase();
    if (!twitchLogin) {
      return NextResponse.json(
        { error: "Ce membre n'a pas de login Twitch — récap Evaluation D indisponible" },
        { status: 422 }
      );
    }

    const months = parseMonthsParam(request);
    const monthKeys = buildMonthKeys(months);

    const supabaseEvaluations = await evaluationRepository.findByMember(twitchLogin);
    const evaluations = filterEvaluationsByMonthKeys(
      supabaseEvaluations.map(mapSupabaseEvaluationToFicheRecord),
      monthKeys
    );

    return NextResponse.json({
      success: true,
      source: "supabase",
      member: {
        twitchLogin,
        discordId: member.discordId || null,
        displayName: member.displayName || member.siteUsername || twitchLogin,
      },
      evaluations,
      meta: {
        months,
        monthKeys,
        totalInDb: supabaseEvaluations.length,
        monthsReturned: evaluations.length,
      },
    });
  } catch (error) {
    console.error("[evaluation-recap] Erreur:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur chargement récap évaluations" },
      { status: 500 }
    );
  }
}
