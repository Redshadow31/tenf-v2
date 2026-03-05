import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/requireAdmin";
import { evaluationRepository, memberRepository } from "@/lib/repositories";

export const dynamic = "force-dynamic";

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") || getCurrentMonthKey();

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const [evaluations, members] = await Promise.all([
      evaluationRepository.findByMonth(month, 2000, 0),
      memberRepository.findAll(2000, 0),
    ]);

    const memberMap = new Map(
      members.map((m) => [
        m.twitchLogin.toLowerCase(),
        {
          displayName: m.displayName || m.twitchLogin,
          role: m.role,
          isActive: m.isActive !== false,
          isVip: m.isVip === true,
        },
      ])
    );

    const rows = evaluations
      .map((evaluation) => {
        const login = evaluation.twitchLogin.toLowerCase();
        const member = memberMap.get(login);
        const finalScore = evaluation.finalNote ?? evaluation.totalPoints ?? 0;
        return {
          twitchLogin: login,
          displayName: member?.displayName || evaluation.twitchLogin,
          role: member?.role || "Affilié",
          isActive: member?.isActive ?? true,
          isVip: member?.isVip ?? false,
          sectionAPoints: evaluation.sectionAPoints ?? 0,
          sectionBPoints: evaluation.sectionBPoints ?? 0,
          sectionCPoints: evaluation.sectionCPoints ?? 0,
          sectionDBonuses: evaluation.sectionDBonuses ?? 0,
          totalPoints: evaluation.totalPoints ?? 0,
          finalNote: evaluation.finalNote ?? null,
          finalScore,
          calculatedAt: evaluation.calculatedAt?.toISOString() || null,
          calculatedBy: evaluation.calculatedBy || null,
          finalNoteSavedAt: evaluation.finalNoteSavedAt?.toISOString() || null,
          finalNoteSavedBy: evaluation.finalNoteSavedBy || null,
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    const stats = {
      membersCount: rows.length,
      avgFinalScore: rows.length
        ? Math.round((rows.reduce((sum, row) => sum + row.finalScore, 0) / rows.length) * 100) / 100
        : 0,
      vipCount: rows.filter((row) => row.finalScore >= 16).length,
      surveillerCount: rows.filter((row) => row.finalScore < 5).length,
      validatedCount: rows.filter((row) => row.calculatedAt || row.finalNoteSavedAt).length,
    };

    return NextResponse.json({
      success: true,
      month,
      stats,
      rows,
    });
  } catch (error) {
    console.error("[API evaluations/result] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

