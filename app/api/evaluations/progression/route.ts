import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { evaluationRepository, memberRepository } from "@/lib/repositories";
import { isEligibleForProgression } from "@/lib/evaluationSynthesisHelpers";

export const dynamic = "force-dynamic";

function monthKeyFromDate(date: Date | string): string {
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}$/.test(date)) return date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return date.slice(0, 7);
    const parsed = new Date(date);
    return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function toIsoOrNull(value?: Date | null): string | null {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const twitchLogin = (searchParams.get("twitchLogin") || "").trim().toLowerCase();
    if (!twitchLogin) {
      return NextResponse.json({ error: "twitchLogin est requis" }, { status: 400 });
    }

    const member = await memberRepository.findByTwitchLogin(twitchLogin);
    if (!member) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }

    const evaluations = await evaluationRepository.findByMember(twitchLogin);

    let validatedCount = 0;
    let eligibleCount = 0;
    const timelineRaw: Array<{
      month: string;
      sectionA: number;
      sectionB: number;
      sectionC: number;
      sectionD: number;
      totalCalculated: number;
      finalScore: number;
      calculatedAt: string | null;
    }> = [];

    for (const evaluation of evaluations) {
      const monthKey = monthKeyFromDate(evaluation.month);
      const isValidated = Boolean(evaluation.calculatedAt || evaluation.finalNoteSavedAt);
      const eligible = isEligibleForProgression(
        monthKey,
        member.integrationDate ?? null,
        member.createdAt ?? null
      );

      if (isValidated) validatedCount++;
      if (eligible) eligibleCount++;
      if (!isValidated || !eligible) continue;

      const finalScore = evaluation.finalNote ?? evaluation.totalPoints ?? 0;
      timelineRaw.push({
        month: monthKey,
        sectionA: evaluation.sectionAPoints ?? 0,
        sectionB: evaluation.sectionBPoints ?? 0,
        sectionC: evaluation.sectionCPoints ?? 0,
        sectionD: evaluation.sectionDBonuses ?? 0,
        totalCalculated: evaluation.totalPoints ?? 0,
        finalScore,
        calculatedAt: toIsoOrNull(evaluation.calculatedAt ?? null),
      });
    }

    timelineRaw.sort((a, b) => (a.month < b.month ? -1 : 1));

    const timeline = timelineRaw.map((item, index) => {
      const previous = index > 0 ? timelineRaw[index - 1] : null;
      const delta = previous ? Number((item.finalScore - previous.finalScore).toFixed(2)) : null;
      return {
        ...item,
        delta,
      };
    });

    const firstScore = timeline.length > 0 ? timeline[0].finalScore : null;
    const lastScore = timeline.length > 0 ? timeline[timeline.length - 1].finalScore : null;
    const globalDelta =
      firstScore !== null && lastScore !== null ? Number((lastScore - firstScore).toFixed(2)) : null;

    const positiveMoves = timeline.filter((t) => (t.delta ?? 0) > 0).length;
    const negativeMoves = timeline.filter((t) => (t.delta ?? 0) < 0).length;
    const stableMoves = timeline.filter((t) => t.delta === 0).length;

    return NextResponse.json({
      success: true,
      member: {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.twitchLogin,
        role: member.role,
        integrationDate: member.integrationDate ? member.integrationDate.toISOString() : null,
        createdAt: member.createdAt ? member.createdAt.toISOString() : null,
      },
      summary: {
        pointsCount: timeline.length,
        firstScore,
        lastScore,
        globalDelta,
        trend:
          globalDelta === null ? "insufficient_data" : globalDelta > 0 ? "progression" : globalDelta < 0 ? "regression" : "stable",
        positiveMoves,
        negativeMoves,
        stableMoves,
        source: {
          totalEvaluations: evaluations.length,
          validatedEvaluations: validatedCount,
          eligibleEvaluations: eligibleCount,
        },
      },
      timeline,
    });
  } catch (error) {
    console.error("[API evaluations/progression] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur progression" }, { status: 500 });
  }
}

