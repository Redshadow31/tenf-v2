"use client";

import { MessageSquare, Mic } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { DiscordMonthRow } from "@/components/member/engagement/discord-activity/discordActivityUtils";
import {
  DISCORD_ACTIVITY_ACCENT,
  formatMonthLabel,
  formatVocalSummary,
} from "@/components/member/engagement/discord-activity/discordActivityUtils";

type DiscordActivityTimelinePanelProps = {
  rows: DiscordMonthRow[];
  maxMessages: number;
  maxVocalMinutes: number;
};

export default function DiscordActivityTimelinePanel({
  rows,
  maxMessages,
  maxVocalMinutes,
}: DiscordActivityTimelinePanelProps) {
  return (
    <DashboardPanel
      id="discord-timeline"
      tone="accent"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-timeline-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Historique"
        title="Détail mois par mois"
        icon={MessageSquare}
        tone="accent"
        accentHex={DISCORD_ACTIVITY_ACCENT}
        titleId="discord-timeline-title"
        badge={
          <span className="text-[11px] text-white/45">
            {rows.length} ligne{rows.length > 1 ? "s" : ""}
          </span>
        }
      />

      <div className="grid gap-3 md:hidden">
        {rows.map((row) => (
          <MonthCard key={row.month} row={row} maxMessages={maxMessages} maxVocalMinutes={maxVocalMinutes} />
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-white/10 bg-black/20 md:block">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-white/45">
              <th className="px-4 py-3 font-medium">Mois</th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-[#5865F2]" aria-hidden />
                  Messages
                </span>
              </th>
              <th className="hidden lg:table-cell lg:w-[28%] px-4 py-3 font-medium">Relatif</th>
              <th className="px-4 py-3 font-medium">
                <span className="inline-flex items-center gap-1.5">
                  <Mic className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                  Vocal
                </span>
              </th>
              <th className="hidden lg:table-cell lg:w-[28%] px-4 py-3 font-medium">Relatif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row) => {
              const inactive = row.messages === 0 && row.vocalMinutes === 0;
              return (
                <tr key={row.month} className={`transition hover:bg-white/[0.03] ${inactive ? "opacity-55" : ""}`}>
                  <td className="px-4 py-3 font-medium capitalize text-white">{formatMonthLabel(row.month)}</td>
                  <td className="px-4 py-3 tabular-nums text-white/80">{row.messages.toLocaleString("fr-FR")}</td>
                  <td className="hidden lg:table-cell px-4 py-3">
                    <Bar value={row.messages} max={maxMessages} gradient="from-[#5865F2] to-indigo-400" />
                  </td>
                  <td className="px-4 py-3 text-white/80">{formatVocalSummary(row.vocalMinutes)}</td>
                  <td className="hidden lg:table-cell px-4 py-3">
                    <Bar value={row.vocalMinutes} max={maxVocalMinutes} gradient="from-violet-600 to-fuchsia-400" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}

function Bar({ value, max, gradient }: { value: number; max: number; gradient: string }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full bg-gradient-to-r ${gradient}`} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

function MonthCard({
  row,
  maxMessages,
  maxVocalMinutes,
}: {
  row: DiscordMonthRow;
  maxMessages: number;
  maxVocalMinutes: number;
}) {
  const inactive = row.messages === 0 && row.vocalMinutes === 0;
  return (
    <DashboardInnerCard hover={false} className={`!p-4 ${inactive ? "opacity-60" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Mois</p>
      <p className="text-base font-bold capitalize text-white">{formatMonthLabel(row.month)}</p>
      <div className="mt-3 space-y-3">
        <MetricRow
          icon={MessageSquare}
          iconClass="text-[#5865F2]"
          label="Messages"
          value={row.messages.toLocaleString("fr-FR")}
          ratio={row.messages / maxMessages}
          barClass="bg-[#5865F2]"
        />
        <MetricRow
          icon={Mic}
          iconClass="text-violet-300"
          label="Vocal"
          value={formatVocalSummary(row.vocalMinutes)}
          ratio={row.vocalMinutes / maxVocalMinutes}
          barClass="bg-violet-500"
        />
      </div>
    </DashboardInnerCard>
  );
}

function MetricRow({
  icon: Icon,
  iconClass,
  label,
  value,
  ratio,
  barClass,
}: {
  icon: typeof MessageSquare;
  iconClass: string;
  label: string;
  value: string;
  ratio: number;
  barClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-white/45">
        <span className="inline-flex items-center gap-1">
          <Icon className={`h-3 w-3 ${iconClass}`} aria-hidden />
          {label}
        </span>
        <span className="text-white/75">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}
