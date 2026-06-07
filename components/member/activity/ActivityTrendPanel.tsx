"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { ACTIVITY_ACCENT, formatMonthLabel, formatMonthShort } from "@/components/member/activity/activityUtils";

type MonthlyHistoryEntry = {
  monthKey: string;
  attendedEvents: number;
  totalEvents: number;
  attendanceRate: number;
};

type ActivityTrendPanelProps = {
  monthlyHistory: MonthlyHistoryEntry[];
};

export default function ActivityTrendPanel({ monthlyHistory }: ActivityTrendPanelProps) {
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<string | null>(null);

  const trendHighlight = useMemo(() => {
    if (selectedTrendMonth) {
      return monthlyHistory.find((m) => m.monthKey === selectedTrendMonth);
    }
    return monthlyHistory[monthlyHistory.length - 1];
  }, [monthlyHistory, selectedTrendMonth]);

  const maxAttended = useMemo(
    () => Math.max(...monthlyHistory.map((m) => m.attendedEvents), 1),
    [monthlyHistory],
  );

  return (
    <DashboardPanel
      id="activity-trend"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-trend-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Tendance"
        title="Présences mois par mois"
        icon={TrendingUp}
        tone="violet"
        accentHex={ACTIVITY_ACCENT}
        titleId="activity-trend-title"
      />

      <p className="mb-4 text-xs text-white/45">Clique une barre pour isoler un mois.</p>

      {monthlyHistory.length === 0 ? (
        <p className="text-sm text-white/45">Historique pas encore disponible.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-2 md:gap-3">
            {monthlyHistory.map((entry) => {
              const h = Math.max(14, Math.round((entry.attendedEvents / maxAttended) * 100));
              const active =
                (selectedTrendMonth ?? monthlyHistory[monthlyHistory.length - 1]?.monthKey) === entry.monthKey;
              return (
                <button
                  key={entry.monthKey}
                  type="button"
                  className={`flex flex-col items-center gap-2 rounded-xl border px-2 pb-2 pt-3 transition ${
                    active ? "border-orange-400/55 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedTrendMonth(entry.monthKey)}
                >
                  <div
                    className="w-7 rounded-t-md bg-gradient-to-t from-orange-600/95 to-rose-500/75 md:w-9"
                    style={{ height: `${h}px` }}
                  />
                  <span className="max-w-[4rem] text-center text-[10px] font-semibold text-slate-300">
                    {formatMonthShort(entry.monthKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {trendHighlight ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
                {formatMonthLabel(trendHighlight.monthKey)}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-black text-white">{trendHighlight.attendanceRate}%</p>
                  <p className="text-[11px] text-slate-400">Taux</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">
                    {trendHighlight.attendedEvents}/{trendHighlight.totalEvents}
                  </p>
                  <p className="text-[11px] text-slate-400">Présences / suivis</p>
                </div>
                <div className="flex items-end">
                  <Link
                    href="/member/evenements/presences"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-violet-200 hover:text-white"
                  >
                    Détail <ArrowRight className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </>
      )}
    </DashboardPanel>
  );
}
