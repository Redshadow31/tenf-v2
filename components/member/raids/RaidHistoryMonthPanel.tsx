"use client";

import { CalendarDays, Clock3, ShieldAlert, ShieldCheck, Target, XCircle } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberHeroStat,
} from "@/components/member/dashboard/dashboardUi";
import { formatMonthLabel, RAID_HISTORY_ACCENT, type RaidHistoryResponse } from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryMonthPanelProps = {
  selectedMonth: string;
  monthOptions: string[];
  onMonthChange: (month: string) => void;
  summary: RaidHistoryResponse["summary"] | null;
  validationRate: number;
};

export default function RaidHistoryMonthPanel({
  selectedMonth,
  monthOptions,
  onMonthChange,
  summary,
  validationRate,
}: RaidHistoryMonthPanelProps) {
  return (
    <DashboardPanel
      id="raid-month"
      tone="amber"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="soft"
      ariaLabelledBy="raid-month-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Calendrier"
        title="Mois affiché"
        icon={CalendarDays}
        tone="amber"
        accentHex={RAID_HISTORY_ACCENT}
        titleId="raid-month-title"
        badge={
          summary && summary.total > 0 ? (
            <span className="text-[11px] font-bold tabular-nums text-amber-200">{validationRate}% validés</span>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {monthOptions.map((m) => {
            const active = m === selectedMonth;
            return (
              <button
                key={m}
                type="button"
                onClick={() => onMonthChange(m)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "border-amber-400/50 bg-amber-500/18 text-amber-50"
                    : "border-white/10 bg-black/25 text-white/50 hover:border-white/18 hover:text-white/80"
                }`}
              >
                {formatMonthLabel(m)}
              </button>
            );
          })}
        </div>
        <label className="sr-only" htmlFor="raid-month-select">
          Mois affiché
        </label>
        <select
          id="raid-month-select"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full max-w-xs cursor-pointer rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-sm text-white lg:w-auto"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
        <MemberHeroStat icon={Target} label="Total" value={String(summary?.total ?? 0)} accent={RAID_HISTORY_ACCENT} />
        <MemberHeroStat icon={ShieldCheck} label="Validés" value={String(summary?.validated ?? 0)} accent="#22c55e" />
        <MemberHeroStat icon={Clock3} label="En cours" value={String(summary?.pending ?? 0)} accent="#facc15" />
        <MemberHeroStat icon={XCircle} label="Non retenus" value={String(summary?.rejected ?? 0)} accent="#ef4444" />
        <MemberHeroStat icon={Target} label="Points OK" value={String(summary?.pointsAwarded ?? 0)} accent="#38bdf8" />
        <MemberHeroStat icon={ShieldAlert} label="Pts attente" value={String(summary?.pointsPending ?? 0)} accent="#a78bfa" />
      </div>
    </DashboardPanel>
  );
}
