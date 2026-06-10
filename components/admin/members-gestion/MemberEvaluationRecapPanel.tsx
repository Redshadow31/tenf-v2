"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EvalRecapMetrics } from "@/lib/admin/members-fiche/memberEvaluationRecap";
import { FICHE_ACCENT, ficheFocusRing } from "@/lib/admin/members-fiche/memberFicheStyles";
import {
  MemberFicheFieldGrid,
  MemberFichePanel,
  MemberFicheSkeleton,
  MemberFicheStatCard,
  MemberFicheTableHead,
  MemberFicheTableRow,
  MemberFicheTableShell,
} from "@/components/admin/members-gestion/MemberFicheLayout";

type Props = {
  metrics: EvalRecapMetrics;
  loading: boolean;
  error: string | null;
  twitchLogin?: string;
  toMonthLabel: (monthKey?: string) => string;
};

type SeriesKey = "total" | "sectionA" | "sectionB" | "sectionC" | "sectionD";

const SERIES_DEF: Array<{ key: SeriesKey; label: string; color: string }> = [
  { key: "total", label: "Total /30", color: FICHE_ACCENT },
  { key: "sectionA", label: "A", color: "#a855f7" },
  { key: "sectionB", label: "B", color: "#3b82f6" },
  { key: "sectionC", label: "C", color: "#22c55e" },
  { key: "sectionD", label: "Bonus D", color: "#f59e0b" },
];

function formatScore(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}

function formatDelta(value: number | null): ReactNode {
  if (value === null) return "—";
  const sign = value > 0 ? "+" : "";
  const color = value > 0 ? "text-emerald-400" : value < 0 ? "text-red-400" : "text-zinc-400";
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span className={`inline-flex items-center gap-1 ${color}`}>
      <Icon className="h-3 w-3" aria-hidden />
      {sign}
      {value.toFixed(1)}
    </span>
  );
}

function RecapTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/95 px-3 py-2 shadow-xl ring-1 ring-white/[0.06] backdrop-blur-sm">
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-bold tabular-nums text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MemberEvaluationRecapPanel({
  metrics,
  loading,
  error,
  twitchLogin,
  toMonthLabel,
}: Props) {
  const [visibleSeries, setVisibleSeries] = useState<Record<SeriesKey, boolean>>({
    total: true,
    sectionA: true,
    sectionB: false,
    sectionC: false,
    sectionD: false,
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [showAvgLines, setShowAvgLines] = useState(true);

  const chartData = useMemo(
    () =>
      metrics.rows.map((row) => ({
        monthKey: row.month,
        month: `${row.month.slice(5)}/${row.month.slice(0, 4)}`,
        total: row.total,
        sectionA: row.sectionA,
        sectionB: row.sectionB,
        sectionC: row.sectionC,
        sectionD: row.sectionD,
      })),
    [metrics.rows]
  );

  function toggleSeries(key: SeriesKey) {
    setVisibleSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const trendIcon =
    metrics.trend > 0 ? TrendingUp : metrics.trend < 0 ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  return (
    <div className="space-y-4">
      <MemberFichePanel
        kicker="Evaluation D"
        title="Recapitulatif & evolution"
        intro="Notes retenues depuis Evaluation D (Supabase / monthly_evaluations) — aligné sur la synthese staff."
        tone="violet"
        headerRight={
          twitchLogin ? (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/evaluation/d"
                className={`inline-flex items-center gap-1.5 rounded-xl border border-violet-400/35 bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/35 hover:shadow-sm ${ficheFocusRing}`}
              >
                Synthese D
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
              <Link
                href={`/admin/evaluation/progression?twitchLogin=${encodeURIComponent(twitchLogin)}`}
                className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-white/20 hover:text-white ${ficheFocusRing}`}
              >
                Progression
                <ExternalLink className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          ) : null
        }
      >
        {loading ? (
          <MemberFicheSkeleton rows={4} />
        ) : error ? (
          <p className="text-red-300">{error}</p>
        ) : metrics.rows.length === 0 ? (
          <p className="text-zinc-500">Aucune evaluation disponible pour ce membre.</p>
        ) : (
          <>
            <MemberFicheFieldGrid cols={4}>
              <MemberFicheStatCard
                label="Dernier mois"
                value={formatScore(metrics.lastScore)}
                hint={metrics.trendLabel}
                numericValue={metrics.lastScore ?? undefined}
                scoreMax={30}
                icon={TrendIcon}
              />
              <MemberFicheStatCard
                label="Moyenne 6 mois"
                value={formatScore(metrics.avg6Months)}
                hint="Fenetre glissante"
                numericValue={metrics.avg6Months ?? undefined}
                scoreMax={30}
              />
              <MemberFicheStatCard
                label="Moyenne 12 mois"
                value={formatScore(metrics.avg12Months)}
                hint="Fenetre glissante"
                numericValue={metrics.avg12Months ?? undefined}
                scoreMax={30}
              />
              <MemberFicheStatCard
                label="Moyenne totale"
                value={formatScore(metrics.avgTotal)}
                hint={`${metrics.monthsWithData} mois avec donnees`}
                numericValue={metrics.avgTotal ?? undefined}
                scoreMax={30}
              />
            </MemberFicheFieldGrid>

            <MemberFicheFieldGrid cols={3} className="mt-3">
              <MemberFicheStatCard
                label="Delta dernier mois"
                value={
                  metrics.deltaLastMonth !== null
                    ? `${metrics.deltaLastMonth > 0 ? "+" : ""}${metrics.deltaLastMonth.toFixed(1)}`
                    : "—"
                }
                hint={
                  metrics.trendPercent !== null
                    ? `${metrics.trendPercent > 0 ? "+" : ""}${metrics.trendPercent.toFixed(1)}%`
                    : undefined
                }
              />
              <MemberFicheStatCard label="Mois analyses" value={metrics.monthsWithData} />
              <MemberFicheStatCard
                label="Note max /30"
                value={
                  metrics.rows.length > 0
                    ? Math.max(...metrics.rows.map((r) => r.total)).toFixed(1)
                    : "—"
                }
              />
            </MemberFicheFieldGrid>
          </>
        )}
      </MemberFichePanel>

      {!loading && !error && metrics.rows.length > 0 && (
        <>
          <MemberFichePanel
            kicker="Courbe"
            title="Evolution mois par mois"
            intro="Clique une ligne du tableau pour surligner le mois. Active/desactive les series ci-dessous."
            tone="indigo"
            headerRight={
              <button
                type="button"
                onClick={() => setShowAvgLines((v) => !v)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition ${ficheFocusRing} ${
                  showAvgLines
                    ? "border-cyan-400/35 bg-cyan-500/15 text-cyan-100"
                    : "border-white/10 bg-white/[0.03] text-zinc-500"
                }`}
              >
                Moyennes {showAvgLines ? "ON" : "OFF"}
              </button>
            }
          >
            <div className="mb-3 flex flex-wrap gap-1.5">
              {SERIES_DEF.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleSeries(s.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all duration-150 ${ficheFocusRing} ${
                    visibleSeries[s.key]
                      ? "border-white/15 bg-white/[0.06] text-zinc-100"
                      : "border-transparent bg-transparent text-zinc-600 line-through opacity-60"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>

            <div className="h-80 rounded-xl border border-white/[0.06] bg-black/20 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  onClick={(state) => {
                    const key = (state as { activePayload?: Array<{ payload?: { monthKey?: string } }> })?.activePayload?.[0]?.payload?.monthKey;
                    if (key) setSelectedMonth((prev) => (prev === key ? null : key));
                  }}
                >
                  <defs>
                    <linearGradient id="ficheTotalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={FICHE_ACCENT} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={FICHE_ACCENT} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" vertical={false} />
                  <XAxis dataKey="month" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" domain={[0, 30]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<RecapTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />

                  {showAvgLines && metrics.avg6Months !== null ? (
                    <ReferenceLine
                      y={metrics.avg6Months}
                      stroke="#22d3ee"
                      strokeDasharray="4 4"
                      label={{ value: "Moy. 6M", position: "insideTopRight", fill: "#22d3ee", fontSize: 10 }}
                    />
                  ) : null}
                  {showAvgLines && metrics.avg12Months !== null ? (
                    <ReferenceLine
                      y={metrics.avg12Months}
                      stroke="#f472b6"
                      strokeDasharray="6 3"
                      label={{ value: "Moy. 12M", position: "insideBottomRight", fill: "#f472b6", fontSize: 10 }}
                    />
                  ) : null}

                  {visibleSeries.total ? (
                    <>
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total /30"
                        stroke={FICHE_ACCENT}
                        fill="url(#ficheTotalGradient)"
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 0 }}
                        activeDot={{ r: 6, stroke: "#fff", strokeWidth: 1 }}
                      />
                    </>
                  ) : null}
                  {visibleSeries.sectionA ? (
                    <Line type="monotone" dataKey="sectionA" name="A" stroke="#a855f7" dot={false} strokeWidth={1.5} />
                  ) : null}
                  {visibleSeries.sectionB ? (
                    <Line type="monotone" dataKey="sectionB" name="B" stroke="#3b82f6" dot={false} strokeWidth={1.5} />
                  ) : null}
                  {visibleSeries.sectionC ? (
                    <Line type="monotone" dataKey="sectionC" name="C" stroke="#22c55e" dot={false} strokeWidth={1.5} />
                  ) : null}
                  {visibleSeries.sectionD ? (
                    <Line type="monotone" dataKey="sectionD" name="Bonus D" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </MemberFichePanel>

          <MemberFichePanel
            kicker="Detail"
            title="Tableau mensuel"
            intro="Clique une ligne pour la mettre en evidence sur le graphique."
            tone="neutral"
          >
            <MemberFicheTableShell minWidth="900px">
              <MemberFicheTableHead>
                <tr>
                  <th className="px-3 py-2 text-left">Mois</th>
                  <th className="px-3 py-2 text-center">Total</th>
                  <th className="px-3 py-2 text-center">A</th>
                  <th className="px-3 py-2 text-center">B</th>
                  <th className="px-3 py-2 text-center">C</th>
                  <th className="px-3 py-2 text-center">Bonus D</th>
                  <th className="px-3 py-2 text-center">Delta</th>
                </tr>
              </MemberFicheTableHead>
              <tbody>
                {[...metrics.rows].reverse().map((row) => (
                  <MemberFicheTableRow
                    key={row.month}
                    selected={selectedMonth === row.month}
                    onClick={() => setSelectedMonth((prev) => (prev === row.month ? null : row.month))}
                  >
                    <td className="px-3 py-2 font-medium text-zinc-200">{toMonthLabel(row.month)}</td>
                    <td className="px-3 py-2 text-center font-bold tabular-nums text-violet-200">{row.total}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-zinc-300">{row.sectionA}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-zinc-300">{row.sectionB}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-zinc-300">{row.sectionC}</td>
                    <td className="px-3 py-2 text-center tabular-nums text-zinc-300">{row.sectionD}</td>
                    <td className="px-3 py-2 text-center tabular-nums">{formatDelta(row.delta)}</td>
                  </MemberFicheTableRow>
                ))}
              </tbody>
            </MemberFicheTableShell>
          </MemberFichePanel>
        </>
      )}
    </div>
  );
}
