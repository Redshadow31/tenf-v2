"use client";

import type { LucideIcon } from "lucide-react";
import { Activity, TrendingUp, Users, Zap } from "lucide-react";
import type { PilotageCopyModel, PilotageKpiCounts } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";

type Props = {
  copy: PilotageCopyModel;
  counts: PilotageKpiCounts;
  onScrollToOps?: () => void;
};

export default function PilotageKpiStrip({ copy, counts, onScrollToOps }: Props) {
  const cells: Array<{
    label: string;
    value: string | number;
    hint: string;
    Icon: LucideIcon;
    tone: string;
    onClick?: () => void;
  }> = [
    {
      label: copy.kpi.totalMembers.label,
      value: counts.totalMembers,
      hint: copy.kpi.totalMembers.hint,
      Icon: Users,
      tone: "text-violet-200",
    },
    {
      label: copy.kpi.avgCompletion.label,
      value: `${counts.avgCompletion}%`,
      hint: copy.kpi.avgCompletion.hint,
      Icon: TrendingUp,
      tone: "text-emerald-200",
    },
    {
      label: copy.kpi.raidsPending.label,
      value: counts.raidsPending,
      hint: copy.kpi.raidsPending.hint,
      Icon: Zap,
      tone: "text-amber-200",
    },
    {
      label: copy.kpi.tasksInView.label,
      value: counts.tasksInView,
      hint: copy.kpi.tasksInView.hint,
      Icon: Activity,
      tone: "text-sky-200",
      onClick: onScrollToOps,
    },
  ];

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Signaux du jour"
        title="État du serveur en un coup d'œil"
        intro="Indicateurs synchronisés avec les files et l'activité Discord."
        accentHex={copy.accent}
      />
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {cells.map((cell) => {
          const Tag = cell.onClick ? "button" : "div";
          return (
            <Tag
              key={cell.label}
              type={cell.onClick ? "button" : undefined}
              onClick={cell.onClick}
              title={cell.hint}
              className={`flex min-h-[4.5rem] flex-col rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-left transition ${
                cell.onClick ? "hover:border-violet-400/35 hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45" : ""
              }`}
            >
              <cell.Icon className={`mb-2 h-4 w-4 ${cell.tone}`} aria-hidden />
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">{cell.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums text-white">{cell.value}</p>
            </Tag>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}
