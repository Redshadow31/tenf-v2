import type { Evaluation } from "@/lib/repositories/EvaluationRepository";
import { roundEvalScore } from "@/lib/admin/evaluation-d/evaluationDMonthScores";

export type FicheEvaluationRecord = {
  month: string;
  score: {
    total: number;
    sectionA: number;
    sectionB: number;
    sectionC: number;
    sectionDBonuses: number;
  };
  source: "supabase" | "blob";
  finalNote?: number | null;
  savedAt?: string | null;
};

export function monthKeyFromEvaluation(month: Date | string): string {
  if (typeof month === "string") {
    if (/^\d{4}-\d{2}$/.test(month)) return month;
    if (/^\d{4}-\d{2}-\d{2}/.test(month)) return month.slice(0, 7);
    const parsed = new Date(month);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, "0")}`;
    }
    return month;
  }
  return `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Mappe une ligne Supabase (Evaluation D sauvegardée) vers le format fiche. */
export function mapSupabaseEvaluationToFicheRecord(evaluation: Evaluation): FicheEvaluationRecord {
  const finalScore = roundEvalScore(evaluation.finalNote ?? evaluation.totalPoints ?? 0);
  const savedAt =
    evaluation.finalNoteSavedAt?.toISOString?.() ??
    evaluation.calculatedAt?.toISOString?.() ??
    null;

  return {
    month: monthKeyFromEvaluation(evaluation.month),
    score: {
      total: finalScore,
      sectionA: roundEvalScore(evaluation.sectionAPoints ?? 0),
      sectionB: roundEvalScore(evaluation.sectionBPoints ?? 0),
      sectionC: roundEvalScore(evaluation.sectionCPoints ?? 0),
      sectionDBonuses: roundEvalScore(evaluation.sectionDBonuses ?? 0),
    },
    source: "supabase",
    finalNote: evaluation.finalNote ?? null,
    savedAt,
  };
}

export function filterEvaluationsByMonthKeys(
  records: FicheEvaluationRecord[],
  monthKeys: string[]
): FicheEvaluationRecord[] {
  const allowed = new Set(monthKeys);
  return records.filter((row) => allowed.has(row.month)).sort((a, b) => a.month.localeCompare(b.month));
}

export function buildMonthKeys(months: number): string[] {
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}
