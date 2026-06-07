"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  formatMonthShort,
  formatVocalSummary,
  timelineAscendingMonths,
} from "@/components/member/engagement/discord-activity/discordActivityUtils";

type DiscordActivityChartsPanelProps = {
  months: DiscordMonthRow[];
  onlyActiveMonths: boolean;
};

const DISCORD_MUTED = "rgba(148,163,184,0.35)";
const MSG_FILL = "#5865F2";
const VOCAL_FILL = "#a78bfa";

export default function DiscordActivityChartsPanel({ months, onlyActiveMonths }: DiscordActivityChartsPanelProps) {
  const timeline = useMemo(() => timelineAscendingMonths(months, onlyActiveMonths), [months, onlyActiveMonths]);

  const chartMessagesData = useMemo(
    () =>
      timeline.map((row) => ({
        label: formatMonthShort(row.month),
        full: formatMonthLabel(row.month),
        messages: row.messages,
      })),
    [timeline],
  );

  const chartVocalData = useMemo(
    () =>
      timeline.map((row) => ({
        label: formatMonthShort(row.month),
        full: formatMonthLabel(row.month),
        hours: Math.round((row.vocalMinutes / 60) * 10) / 10,
        vocalMinutes: row.vocalMinutes,
      })),
    [timeline],
  );

  return (
    <DashboardPanel
      id="discord-charts"
      tone="accent"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-charts-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Évolution"
        title="Graphiques mensuels"
        tone="accent"
        accentHex={DISCORD_ACTIVITY_ACCENT}
        titleId="discord-charts-title"
        badge={<span className="text-[11px] text-white/45">Filtre « mois actifs » appliqué ici aussi</span>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Messages par mois">
          {chartMessagesData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartMessagesData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke={DISCORD_MUTED} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis stroke={DISCORD_MUTED} tick={{ fill: "#94a3b8", fontSize: 11 }} width={36} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const point = payload[0].payload as { full: string; messages: number };
                      return (
                        <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                          <p className="font-semibold capitalize text-white">{point.full}</p>
                          <p className="tabular-nums text-[#a5b4fc]">{point.messages.toLocaleString("fr-FR")} messages</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="messages" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartMessagesData.map((_, index) => (
                      <Cell key={index} fill={MSG_FILL} opacity={0.85 + (index % 3) * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Temps vocal par mois">
          {chartVocalData.length === 0 ? (
            <EmptyChart />
          ) : (
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartVocalData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke={DISCORD_MUTED} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis
                    stroke={DISCORD_MUTED}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={36}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    content={({ active, payload }) => {
                      if (!active || !payload?.[0]) return null;
                      const point = payload[0].payload as { full: string; vocalMinutes: number };
                      return (
                        <div className="rounded-lg border border-white/10 bg-[#1e293b] px-3 py-2 text-xs shadow-xl">
                          <p className="font-semibold capitalize text-white">{point.full}</p>
                          <p className="text-violet-200">{formatVocalSummary(point.vocalMinutes)}</p>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartVocalData.map((_, index) => (
                      <Cell key={index} fill={VOCAL_FILL} opacity={0.85 + (index % 3) * 0.05} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </div>
    </DashboardPanel>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <DashboardInnerCard hover={false} className="!p-4 sm:!p-5">
      <p className="mb-3 text-sm font-semibold text-white">{title}</p>
      {children}
    </DashboardInnerCard>
  );
}

function EmptyChart() {
  return <p className="py-12 text-center text-sm text-white/45">Pas assez de données pour ce filtre.</p>;
}
