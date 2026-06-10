import { roundEvalScore } from "@/lib/admin/evaluation-d/evaluationDMonthScores";

export type EvalTimelineRow = {
  month: string;
  total: number;
  sectionA: number;
  sectionB: number;
  sectionC: number;
  sectionD: number;
  delta: number | null;
};

export type EvalRecapMetrics = {
  rows: EvalTimelineRow[];
  lastScore: number | null;
  avg6Months: number | null;
  avg12Months: number | null;
  avgTotal: number | null;
  monthsWithData: number;
  trend: number;
  trendPercent: number | null;
  trendLabel: string;
  deltaLastMonth: number | null;
};

function rollingAverage(rows: EvalTimelineRow[], window: number): number | null {
  const known = rows.filter((r) => Number.isFinite(r.total));
  if (known.length === 0) return null;
  const slice = known.slice(-window);
  if (slice.length === 0) return null;
  return roundEvalScore(slice.reduce((sum, row) => sum + row.total, 0) / slice.length);
}

export function buildEvalRecapMetrics(evaluations: unknown[]): EvalRecapMetrics {
  const rows = [...evaluations]
    .map((raw) => {
      const e = raw as {
        month?: string;
        score?: {
          total?: number;
          sectionA?: number;
          sectionB?: number;
          sectionC?: number;
          sectionDBonuses?: number;
        };
      };
      return {
        month: e.month || "",
        total: Number(e?.score?.total ?? 0),
        sectionA: Number(e?.score?.sectionA ?? 0),
        sectionB: Number(e?.score?.sectionB ?? 0),
        sectionC: Number(e?.score?.sectionC ?? 0),
        sectionD: Number(e?.score?.sectionDBonuses ?? 0),
      };
    })
    .filter((row) => row.month)
    .sort((a, b) => a.month.localeCompare(b.month));

  const withDelta: EvalTimelineRow[] = rows.map((row, idx) => {
    if (idx === 0) return { ...row, delta: null };
    return { ...row, delta: roundEvalScore(row.total - rows[idx - 1].total) };
  });

  const known = withDelta.filter((r) => Number.isFinite(r.total));
  const lastScore = known.length > 0 ? known[known.length - 1].total : null;

  let trend = 0;
  let trendPercent: number | null = null;
  if (known.length >= 2) {
    const last = known[known.length - 1].total;
    const prev = known[known.length - 2].total;
    trend = roundEvalScore(last - prev);
    if (prev !== 0) trendPercent = roundEvalScore((trend / Math.abs(prev)) * 100);
  }

  const trendLabel = trend > 0 ? "Progression" : trend < 0 ? "Regression" : "Stable";

  return {
    rows: withDelta,
    lastScore,
    avg6Months: rollingAverage(withDelta, 6),
    avg12Months: rollingAverage(withDelta, 12),
    avgTotal: rollingAverage(withDelta, withDelta.length),
    monthsWithData: known.length,
    trend,
    trendPercent,
    trendLabel,
    deltaLastMonth: known.length >= 2 ? trend : null,
  };
}
