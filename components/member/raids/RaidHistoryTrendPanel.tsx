"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, ExternalLink, Sparkles, Target, TrendingUp } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { type RaidHubMonthRow, type RaidHubTargetRow } from "@/components/member/raids/raidHubStatsUtils";
import { formatMonthLabel, RAID_HISTORY_ACCENT, twitchChannelUrl } from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryTrendPanelProps = {
  selectedMonth: string;
  onMonthSelect: (monthKey: string) => void;
  history: RaidHubMonthRow[];
  loading: boolean;
  targetBreakdown: RaidHubTargetRow[];
};

export default function RaidHistoryTrendPanel({
  selectedMonth,
  onMonthSelect,
  history,
  loading,
  targetBreakdown,
}: RaidHistoryTrendPanelProps) {
  const [targetsExpanded, setTargetsExpanded] = useState(false);
  const maxHistorySent = Math.max(1, ...history.map((entry) => entry.summary.sent));
  const visibleTargets = targetsExpanded ? targetBreakdown : targetBreakdown.slice(0, 6);

  return (
    <DashboardPanel
      id="raid-trends"
      tone="amber"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="soft"
      ariaLabelledBy="raid-trends-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Tendances"
        title="12 mois & cibles"
        icon={TrendingUp}
        tone="amber"
        accentHex={RAID_HISTORY_ACCENT}
        titleId="raid-trends-title"
        badge={<span className="text-[11px] text-white/45">Hub raids TENF</span>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <DashboardInnerCard className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">Activité sur 12 mois</p>
            <span className="text-[11px] text-white/45">Clique une barre pour changer de mois</span>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-9 animate-pulse rounded-xl bg-white/[0.06]" />
              ))}
            </div>
          ) : (
            <div className="flex h-44 items-end justify-between gap-1 sm:gap-2 md:h-52">
              {history.map((entry) => {
                const height = Math.max(6, (entry.summary.sent / maxHistorySent) * 100);
                const active = entry.monthKey === selectedMonth;
                return (
                  <button
                    key={entry.monthKey}
                    type="button"
                    onClick={() => onMonthSelect(entry.monthKey)}
                    title={`${formatMonthLabel(entry.monthKey)} — ${entry.summary.sent} raid(s)`}
                    className={`group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5 rounded-t-lg transition ${
                      active ? "opacity-100" : "opacity-75 hover:opacity-100"
                    }`}
                  >
                    <span className="text-[10px] font-bold tabular-nums text-white/45 group-hover:text-white/70 sm:text-xs">
                      {entry.summary.sent}
                    </span>
                    <span
                      className={`w-full max-w-[34px] rounded-t-md transition-all ${
                        active
                          ? "bg-gradient-to-t from-violet-600 to-amber-400 shadow-[0_0_14px_rgba(139,92,246,0.32)]"
                          : "bg-gradient-to-t from-violet-900/80 to-amber-900/40 group-hover:from-violet-700 group-hover:to-amber-600/55"
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <span className={`hidden text-[9px] font-medium sm:block ${active ? "text-amber-200" : "text-white/35"}`}>
                      {entry.monthKey.slice(5)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DashboardInnerCard>

        <DashboardInnerCard className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-fuchsia-300" aria-hidden />
            <p className="text-sm font-semibold text-white">Cibles du mois</p>
          </div>

          {targetBreakdown.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center">
              <Sparkles className="mx-auto h-7 w-7 text-white/25" aria-hidden />
              <p className="mt-2 text-sm text-white/55">Aucune cible hub sur ce mois.</p>
              <Link
                href="/lives"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:underline"
              >
                Soutenir un live TENF <ChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {visibleTargets.map((item) => {
                  const barColor =
                    item.count >= 3 ? "bg-emerald-500" : item.count >= 2 ? "bg-amber-500" : "bg-rose-500/90";
                  const url = twitchChannelUrl(item.login);
                  return (
                    <li
                      key={item.key}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 transition hover:border-violet-500/25"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-sm font-medium text-white/90">{item.label}</span>
                        <span className="shrink-0 tabular-nums text-sm font-bold text-white/45">×{item.count}</span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.rate}%` }} />
                      </div>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-300 hover:text-violet-200"
                        >
                          Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
              {targetBreakdown.length > 6 ? (
                <button
                  type="button"
                  onClick={() => setTargetsExpanded((value) => !value)}
                  className="mt-3 w-full rounded-xl border border-white/10 py-2 text-sm font-semibold text-white/45 transition hover:bg-white/[0.05] hover:text-white"
                >
                  {targetsExpanded ? "Voir moins" : `Voir tout (${targetBreakdown.length})`}
                </button>
              ) : null}
            </>
          )}
        </DashboardInnerCard>
      </div>
    </DashboardPanel>
  );
}
