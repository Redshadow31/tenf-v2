"use client";

import { BookOpen } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import {
  FORMATIONS_VALIDEES_ACCENT,
  formatMonthLabel,
  formatMonthShort,
} from "@/components/member/formations/validees/formationsValideesUtils";

type FormationsValideesMonthPickerPanelProps = {
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  monthOptions: string[];
  formationsByMonth: Map<string, unknown[]>;
};

export default function FormationsValideesMonthPickerPanel({
  selectedMonth,
  onSelectedMonthChange,
  monthOptions,
  formationsByMonth,
}: FormationsValideesMonthPickerPanelProps) {
  return (
    <DashboardPanel
      id="formations-validees-goal"
      tone="accent"
      accentHex={FORMATIONS_VALIDEES_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-validees-goal-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Période"
        title="Choisir le mois analysé"
        icon={BookOpen}
        tone="amber"
        accentHex="#f59e0b"
        titleId="formations-validees-goal-title"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-white/55">Fenêtre glissante de 12 mois — présences formation validées côté TENF.</p>
        <label className="sr-only" htmlFor="formation-month-select">
          Choisir un mois
        </label>
        <select
          id="formation-month-select"
          value={selectedMonth}
          onChange={(e) => onSelectedMonthChange(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-violet-400/50 focus:outline-none sm:max-w-xs"
        >
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {formatMonthLabel(month)}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4" role="tablist" aria-label="Sélection rapide du mois">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-white/45">Raccourcis</p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {monthOptions.map((month) => {
            const active = month === selectedMonth;
            const count = (formationsByMonth.get(month) || []).length;
            return (
              <button
                key={month}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectedMonthChange(month)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  active ? "border-violet-400/50 bg-violet-500/15 ring-2 ring-violet-400/30" : "border-white/10 bg-black/20 hover:border-violet-400/30"
                }`}
              >
                <span className="block whitespace-nowrap text-white">{formatMonthShort(month)}</span>
                <span className="mt-0.5 block text-[10px] font-normal tabular-nums text-white/45">
                  {count} validée{count > 1 ? "s" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </DashboardPanel>
  );
}
