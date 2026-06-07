"use client";

import { History, LayoutDashboard, Table2 } from "lucide-react";
import type { EvaluationDCopyModel } from "@/lib/admin/evaluation-d/evaluationDCopyModel";
import { evalDTabClass } from "@/lib/admin/evaluation-d/evaluationDStyles";
import type { EvaluationDTab } from "@/lib/admin/evaluation-d/evaluationDTypes";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";

const TAB_ICONS: Record<EvaluationDTab, typeof LayoutDashboard> = {
  pilotage: LayoutDashboard,
  tableau: Table2,
  historique: History,
};

type Props = {
  copy: EvaluationDCopyModel;
  activeTab: EvaluationDTab;
  onTabChange: (tab: EvaluationDTab) => void;
};

export default function EvaluationDTabNav({ copy, activeTab, onTabChange }: Props) {
  const tabs = (["pilotage", "tableau", "historique"] as const).map((id) => ({
    id,
    ...copy.tabs[id],
    icon: TAB_ICONS[id],
  }));

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="soft" className="!p-1.5">
      <nav className="grid min-w-0 grid-cols-1 gap-1.5 sm:grid-cols-3" role="tablist" aria-label="Sections synthèse évaluation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={evalDTabClass(active)}
            >
              <span className="flex w-full items-center gap-2">
                <span className={`text-[10px] font-black tabular-nums ${active ? "text-violet-200/90" : "text-zinc-600"}`}>
                  {tab.step}
                </span>
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                <span className="truncate font-bold">{tab.label}</span>
              </span>
              <span className={`truncate pl-7 text-[10px] ${active ? "text-violet-100/80" : "text-zinc-600"}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </nav>
    </MembersHubPanel>
  );
}
