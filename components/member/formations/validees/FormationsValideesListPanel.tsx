"use client";

import Link from "next/link";
import { Award, CalendarDays, ChevronRight, Flame } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { FormationEntry } from "@/components/member/formations/validees/formationsValideesUtils";
import {
  FORMATIONS_VALIDEES_ACCENT,
  formatMonthLabel,
} from "@/components/member/formations/validees/formationsValideesUtils";

type FormationsValideesListPanelProps = {
  selectedMonth: string;
  formations: FormationEntry[];
};

export default function FormationsValideesListPanel({ selectedMonth, formations }: FormationsValideesListPanelProps) {
  return (
    <DashboardPanel
      id="formations-validees-list"
      tone="accent"
      accentHex={FORMATIONS_VALIDEES_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-validees-list-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Historique"
        title={`Formations de ${formatMonthLabel(selectedMonth)}`}
        icon={CalendarDays}
        tone="cyan"
        accentHex="#38bdf8"
        titleId="formations-validees-list-title"
        badge={
          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-200/80">
            <Flame className="h-3 w-3 text-orange-300" aria-hidden />
            Présences validées
          </span>
        }
      />

      {formations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-8 text-sm leading-relaxed text-white/45">
          Aucune formation validée sur {formatMonthLabel(selectedMonth)}. Change de mois avec les pastilles ci-dessus, ou{" "}
          <Link href="/member/formations" className="font-semibold text-violet-300 hover:text-white">
            consulte le catalogue
          </Link>{" "}
          pour t&apos;inscrire aux prochaines dates.
        </div>
      ) : (
        <ul className="space-y-3">
          {formations.map((item, index) => (
            <li key={`${item.id}-${item.date}-${index}`}>
              <div className="flex flex-col gap-3 rounded-xl border border-emerald-400/35 bg-emerald-500/[0.07] px-4 py-3 transition hover:border-emerald-400/45 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-medium leading-snug text-white">{item.title}</p>
                  <p className="mt-1 text-sm text-white/55">
                    {new Date(item.date).toLocaleString("fr-FR")} — {item.category}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/45 px-2.5 py-1 text-xs font-medium text-amber-200">
                    <Award size={12} aria-hidden />
                    Validée
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/45 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    OK
                    <ChevronRight size={12} aria-hidden />
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
