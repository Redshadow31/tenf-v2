"use client";

import type { LucideIcon } from "lucide-react";
import { AlertTriangle, FileText, History, Star, Users, Zap } from "lucide-react";
import type { EvaluationDCopyModel, EvaluationDKpiCounts } from "@/lib/admin/evaluation-d/evaluationDCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "@/components/admin/members-hub/membersHubStyles";
import type { EvaluationDPreset, EvaluationDTab } from "@/lib/admin/evaluation-d/evaluationDTypes";

export type EvaluationDKpiAction =
  | { type: "tab"; tab: EvaluationDTab }
  | { type: "preset"; preset: EvaluationDPreset; tab?: EvaluationDTab };

type Props = {
  copy: EvaluationDCopyModel;
  counts: EvaluationDKpiCounts;
  onAction: (action: EvaluationDKpiAction) => void;
};

type KpiDef = {
  id: string;
  label: string;
  value: number;
  hint: string;
  Icon: LucideIcon;
  toneActive: string;
  toneIdle: string;
  iconColor: string;
  action: EvaluationDKpiAction;
  highlight?: boolean;
};

export default function EvaluationDKpiStrip({ copy, counts, onAction }: Props) {
  const kpis: KpiDef[] = [
    {
      id: "members",
      label: copy.kpi.members.label,
      value: counts.members,
      hint: copy.kpi.members.hint,
      Icon: Users,
      toneActive: "border-white/25 bg-white/10 text-white",
      toneIdle: "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.07]",
      iconColor: "text-slate-400",
      action: { type: "tab", tab: "pilotage" },
    },
    {
      id: "vip",
      label: copy.kpi.vip.label,
      value: counts.vip,
      hint: copy.kpi.vip.hint,
      Icon: Star,
      toneActive: "border-emerald-400/55 bg-emerald-500/22 text-emerald-100",
      toneIdle: "border-emerald-500/30 bg-emerald-500/12 text-emerald-100/95 hover:bg-emerald-500/18",
      iconColor: "text-emerald-300",
      action: { type: "preset", preset: "vip", tab: "tableau" },
    },
    {
      id: "surveiller",
      label: copy.kpi.surveiller.label,
      value: counts.surveiller,
      hint: copy.kpi.surveiller.hint,
      Icon: AlertTriangle,
      toneActive: "border-amber-400/55 bg-amber-500/22 text-amber-100",
      toneIdle: "border-amber-500/30 bg-amber-500/12 text-amber-100/95 hover:bg-amber-500/18",
      iconColor: "text-amber-300",
      action: { type: "preset", preset: "surveiller", tab: "tableau" },
      highlight: counts.surveiller > 0,
    },
    {
      id: "pending",
      label: copy.kpi.pending.label,
      value: counts.pendingEdits,
      hint: copy.kpi.pending.hint,
      Icon: Zap,
      toneActive: "border-violet-400/55 bg-violet-500/22 text-violet-100",
      toneIdle: "border-violet-500/30 bg-violet-500/12 text-violet-100/95 hover:bg-violet-500/18",
      iconColor: "text-violet-300",
      action: { type: "tab", tab: "tableau" },
      highlight: counts.pendingEdits > 0,
    },
    {
      id: "manual",
      label: copy.kpi.manual.label,
      value: counts.manualOverrides,
      hint: copy.kpi.manual.hint,
      Icon: FileText,
      toneActive: "border-cyan-400/55 bg-cyan-500/22 text-cyan-100",
      toneIdle: "border-cyan-500/30 bg-cyan-500/12 text-cyan-100/95 hover:bg-cyan-500/18",
      iconColor: "text-cyan-300",
      action: { type: "preset", preset: "manual", tab: "tableau" },
    },
    {
      id: "history",
      label: copy.kpi.history.label,
      value: counts.historyLogs,
      hint: copy.kpi.history.hint,
      Icon: History,
      toneActive: "border-pink-400/55 bg-pink-500/22 text-pink-100",
      toneIdle: "border-pink-500/30 bg-pink-500/12 text-pink-100/95 hover:bg-pink-500/18",
      iconColor: "text-pink-300",
      action: { type: "tab", tab: "historique" },
    },
  ];

  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="soft" ariaLabelledBy="eval-d-kpi-heading">
      <MembersHubPanelHeader
        kicker="Signaux"
        title="Indicateurs du mois"
        intro="Clique pour filtrer ou changer d'onglet."
        accentHex={copy.accent}
        titleId="eval-d-kpi-heading"
      />
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.Icon;
          const pulse = kpi.highlight && kpi.value > 0;
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => onAction(kpi.action)}
              className={`flex flex-col items-start rounded-xl border px-3 py-2.5 text-left transition ${hubFocusRingClass} ${
                pulse ? kpi.toneActive : kpi.toneIdle
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <Icon className={`h-4 w-4 shrink-0 ${kpi.iconColor}`} aria-hidden />
                <span className="text-lg font-black tabular-nums">{kpi.value}</span>
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wide">{kpi.label}</span>
              <span className="mt-0.5 line-clamp-2 text-[10px] opacity-70">{kpi.hint}</span>
            </button>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}
