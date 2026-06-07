"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  HeartHandshake,
  Sparkles,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";
import type { GestionCopyModel, GestionKpiCounts } from "@/lib/admin/members-gestion/gestionCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "@/components/admin/members-hub/membersHubStyles";
import type { GestionKpiId } from "@/components/admin/members-gestion/GestionPageHeader";

type ActiveFilters = Record<GestionKpiId, boolean>;

type Props = {
  copy: GestionCopyModel;
  counts: GestionKpiCounts;
  activeFilters: ActiveFilters;
  onKpiClick: (id: GestionKpiId) => void;
};

type KpiDef = {
  id: GestionKpiId;
  label: string;
  value: number;
  hint: string;
  Icon: LucideIcon;
  toneActive: string;
  toneIdle: string;
  iconColor: string;
};

export default function GestionKpiStrip({ copy, counts, activeFilters, onKpiClick }: Props) {
  const kpis: KpiDef[] = [
    {
      id: "total",
      label: copy.kpi.total.label,
      value: counts.total,
      hint: copy.kpi.total.hint,
      Icon: Users,
      toneActive: "border-white/25 bg-white/10 text-white",
      toneIdle: "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.07]",
      iconColor: "text-slate-400",
    },
    {
      id: "actifs",
      label: copy.kpi.actifs.label,
      value: counts.active,
      hint: copy.kpi.actifs.hint(counts.activeIntegrated, counts.activeNewRole),
      Icon: UserCheck,
      toneActive: "border-emerald-400/55 bg-emerald-500/22 text-emerald-100",
      toneIdle: "border-emerald-500/30 bg-emerald-500/12 text-emerald-100/95 hover:bg-emerald-500/18",
      iconColor: "text-emerald-300",
    },
    {
      id: "suivi",
      label: copy.kpi.suivi.label,
      value: counts.suivi,
      hint: copy.kpi.suivi.hint,
      Icon: HeartHandshake,
      toneActive: "border-rose-400/55 bg-rose-500/22 text-rose-100",
      toneIdle: "border-rose-500/30 bg-rose-500/10 text-rose-100/95 hover:bg-rose-500/16",
      iconColor: "text-rose-300",
    },
    {
      id: "nouveaux",
      label: copy.kpi.nouveaux.label,
      value: counts.nouveaux,
      hint: copy.kpi.nouveaux.hint,
      Icon: Sparkles,
      toneActive: "border-violet-400/55 bg-violet-500/22 text-violet-100",
      toneIdle: "border-violet-500/30 bg-violet-500/10 text-violet-100/95 hover:bg-violet-500/18",
      iconColor: "text-violet-300",
    },
    {
      id: "incomplets",
      label: copy.kpi.incomplets.label,
      value: counts.incomplets,
      hint: copy.kpi.incomplets.hint,
      Icon: AlertCircle,
      toneActive: "border-amber-400/55 bg-amber-500/22 text-amber-100",
      toneIdle: "border-amber-500/30 bg-amber-500/10 text-amber-100/95 hover:bg-amber-500/18",
      iconColor: "text-amber-300",
    },
    {
      id: "no-twitch-id",
      label: copy.kpi.sansTwitchId.label,
      value: counts.sansTwitchId,
      hint: copy.kpi.sansTwitchId.hint,
      Icon: Zap,
      toneActive: "border-cyan-400/55 bg-cyan-500/22 text-cyan-100",
      toneIdle: "border-cyan-500/30 bg-cyan-500/10 text-cyan-100/95 hover:bg-cyan-500/18",
      iconColor: "text-cyan-300",
    },
  ];

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Filtres annuaire"
        title="Clique une pastille pour filtrer la liste"
        intro="Chaque chiffre ouvre directement la population concernée dans le tableau."
        accentHex={copy.accent}
      />
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6" role="group" aria-label="Filtres KPI annuaire">
        {kpis.map((kpi) => {
          const isActive = activeFilters[kpi.id];
          return (
            <button
              key={kpi.id}
              type="button"
              onClick={() => onKpiClick(kpi.id)}
              aria-pressed={isActive}
              title={kpi.hint}
              className={`flex min-h-[4.25rem] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45 ${
                isActive ? kpi.toneActive : kpi.toneIdle
              } ${hubFocusRingClass}`}
            >
              <kpi.Icon className={`h-4 w-4 shrink-0 ${kpi.iconColor}`} aria-hidden />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-wide leading-none opacity-90">{kpi.label}</p>
                <p className="mt-1 text-lg font-bold tabular-nums leading-none">{kpi.value}</p>
              </div>
            </button>
          );
        })}
      </div>
    </MembersHubPanel>
  );
}
