"use client";

import { Activity, CalendarRange, LayoutDashboard } from "lucide-react";
import type { PilotageCopyModel } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "@/components/admin/members-hub/membersHubStyles";

export type PilotageTabId = "cockpit" | "vitals" | "evenements";

type Props = {
  copy: PilotageCopyModel;
  activeTab: PilotageTabId;
  onTabChange: (tab: PilotageTabId) => void;
};

const TAB_META: Record<PilotageTabId, { Icon: typeof LayoutDashboard; id: PilotageTabId }> = {
  cockpit: { Icon: LayoutDashboard, id: "cockpit" },
  vitals: { Icon: Activity, id: "vitals" },
  evenements: { Icon: CalendarRange, id: "evenements" },
};

export default function PilotageTabNav({ copy, activeTab, onTabChange }: Props) {
  const tabs: PilotageTabId[] = ["cockpit", "vitals", "evenements"];

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="soft" className="!p-2">
      <nav className="flex flex-wrap gap-2" aria-label="Sections du pilotage">
        {tabs.map((tabId) => {
          const active = activeTab === tabId;
          const TabIcon = TAB_META[tabId].Icon;
          const tabCopy = copy.tabs[tabId];
          return (
            <button
              key={tabId}
              type="button"
              onClick={() => onTabChange(tabId)}
              aria-pressed={active}
              className={`flex min-w-[140px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${hubFocusRingClass} ${
                active
                  ? "border-violet-400/50 bg-violet-600/20 text-white shadow-inner shadow-violet-900/40"
                  : "border-transparent bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]"
              }`}
            >
              <TabIcon className={`h-5 w-5 shrink-0 ${active ? "text-violet-200" : "text-slate-500"}`} aria-hidden />
              <span>
                <span className="block text-sm font-semibold">{tabCopy.label}</span>
                <span className="block text-[11px] font-normal text-slate-500">{tabCopy.desc}</span>
              </span>
            </button>
          );
        })}
      </nav>
    </MembersHubPanel>
  );
}
