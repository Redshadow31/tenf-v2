"use client";

import type { MonthFinalScoreSource } from "@/lib/admin/evaluation-d/evaluationDMonthScores";
import { FINAL_SCORE_MAX } from "@/lib/evaluationSynthesisHelpers";

type Props = {
  delta: number | null;
  baseline?: number | null;
  baselineLabel?: string;
  source?: MonthFinalScoreSource;
  detail?: string;
  compact?: boolean;
};

function deltaClassName(delta: number): string {
  if (delta > 0) return "text-emerald-400";
  if (delta < 0) return "text-red-400";
  return "text-zinc-500";
}

export default function EvaluationDTrendCell({
  delta,
  baseline,
  baselineLabel,
  source,
  detail,
  compact = false,
}: Props) {
  if (delta === null) {
    return (
      <span className="text-zinc-500" title={detail || "Historique insuffisant pour calculer la tendance"}>
        n.d.
      </span>
    );
  }

  const prefix = delta > 0 ? "+" : "";
  const titleParts = [
    baselineLabel && baseline !== undefined && baseline !== null
      ? `${baselineLabel}: ${baseline.toFixed(2)} /${FINAL_SCORE_MAX}`
      : null,
    source ? (source === "manual" ? "Base validée (override)" : "Base calculée barème") : null,
    detail,
  ].filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-0.5" title={titleParts.join(" · ") || undefined}>
      <span className={`font-semibold tabular-nums ${deltaClassName(delta)}`}>
        {prefix}
        {delta.toFixed(2)}
      </span>
      {!compact && baseline !== undefined && baseline !== null ? (
        <span className="text-[10px] tabular-nums text-zinc-500">
          vs {baseline.toFixed(2)}
          {source === "manual" ? " ✓" : ""}
        </span>
      ) : null}
    </div>
  );
}
