"use client";

import { CalendarDays, Flame, MessageSquare, Mic, TrendingUp } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberHeroStat,
} from "@/components/member/dashboard/dashboardUi";
import type { DiscordActivitySortMode, DiscordActivityTotals } from "@/components/member/engagement/discord-activity/discordActivityUtils";
import { DISCORD_ACTIVITY_ACCENT, formatMonthShort, formatVocalSummary } from "@/components/member/engagement/discord-activity/discordActivityUtils";

type DiscordActivityStatsPanelProps = {
  totals: DiscordActivityTotals;
  sortMode: DiscordActivitySortMode;
  onSortModeChange: (mode: DiscordActivitySortMode) => void;
  onlyActiveMonths: boolean;
  onOnlyActiveMonthsChange: (value: boolean) => void;
  filteredCount: number;
};

export default function DiscordActivityStatsPanel({
  totals,
  sortMode,
  onSortModeChange,
  onlyActiveMonths,
  onOnlyActiveMonthsChange,
  filteredCount,
}: DiscordActivityStatsPanelProps) {
  return (
    <DashboardPanel
      id="discord-stats"
      tone="accent"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-stats-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Synthèse"
        title="Ta présence en chiffres"
        icon={TrendingUp}
        tone="accent"
        accentHex={DISCORD_ACTIVITY_ACCENT}
        titleId="discord-stats-title"
        badge={<span className="text-[11px] text-white/45">{filteredCount} mois affichés</span>}
      />

      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <MemberHeroStat
          icon={MessageSquare}
          label="Messages"
          value={totals.totalMessages.toLocaleString("fr-FR")}
          accent={DISCORD_ACTIVITY_ACCENT}
        />
        <MemberHeroStat
          icon={Mic}
          label="Vocal cumulé"
          value={`${totals.totalVocalHours} h`}
          accent="#a78bfa"
        />
        <MemberHeroStat
          icon={CalendarDays}
          label="Mois actifs"
          value={String(totals.activeMonthCount)}
          accent="#34d399"
        />
        <MemberHeroStat
          icon={Flame}
          label="Mois le plus dense"
          value={totals.bestMonth ? formatMonthShort(totals.bestMonth.month) : "—"}
          accent="#f59e0b"
        />
      </div>

      {totals.bestMonth ? (
        <p className="mt-2 text-xs text-white/45">
          Record : {totals.bestMonth.messages.toLocaleString("fr-FR")} messages ·{" "}
          {formatVocalSummary(totals.bestMonth.vocalMinutes)} vocal
        </p>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/45">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
            Tri
          </span>
          <button
            type="button"
            onClick={() => onSortModeChange("recent")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              sortMode === "recent"
                ? "bg-[#5865F2] text-white shadow-[0_0_16px_rgba(88,101,242,0.25)]"
                : "border border-white/10 bg-black/30 text-white/55 hover:text-white/80"
            }`}
          >
            Plus récent
          </button>
          <button
            type="button"
            onClick={() => onSortModeChange("activity")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              sortMode === "activity"
                ? "bg-[#5865F2] text-white shadow-[0_0_16px_rgba(88,101,242,0.25)]"
                : "border border-white/10 bg-black/30 text-white/55 hover:text-white/80"
            }`}
          >
            Plus d&apos;activité
          </button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/62">
          <input
            type="checkbox"
            checked={onlyActiveMonths}
            onChange={(event) => onOnlyActiveMonthsChange(event.target.checked)}
            className="rounded border-white/20 bg-black/40 text-[#5865F2] focus:ring-[#5865F2]/40"
          />
          Masquer les mois sans activité
        </label>
      </div>
    </DashboardPanel>
  );
}
