"use client";

import { Target, TrendingUp } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { FormationTier } from "@/components/member/formations/validees/formationsValideesUtils";
import {
  FORMATIONS_VALIDEES_ACCENT,
  formatMonthLabel,
  type MonthFormationHistory,
} from "@/components/member/formations/validees/formationsValideesUtils";

type FormationsValideesStatsPanelsProps = {
  sparklineData: MonthFormationHistory[];
  maxValidated: number;
  currentMonthValidated: number;
  goalFormations: number;
  tier: FormationTier;
  totalValidatedGlobal: number;
  selectedMonth: string;
};

export function FormationsValideesTrendPanel({
  sparklineData,
  maxValidated,
}: Pick<FormationsValideesStatsPanelsProps, "sparklineData" | "maxValidated">) {
  return (
    <DashboardPanel
      id="formations-validees-trend"
      tone="accent"
      accentHex={FORMATIONS_VALIDEES_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-validees-trend-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Tendance"
        title="Activité sur 6 mois"
        icon={TrendingUp}
        tone="violet"
        accentHex={FORMATIONS_VALIDEES_ACCENT}
        titleId="formations-validees-trend-title"
        badge={<span className="text-[11px] text-white/45">Mois avec au moins 1 validation</span>}
      />

      {sparklineData.length === 0 ? (
        <p className="text-sm leading-relaxed text-white/45">
          Pas encore assez de formations validées pour dessiner une tendance — inscris-toi aux prochaines sessions depuis
          le catalogue.
        </p>
      ) : (
        <div className="space-y-4">
          {sparklineData.map((entry) => (
            <div key={entry.monthKey}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium text-white">{formatMonthLabel(entry.monthKey)}</span>
                <span className="shrink-0 tabular-nums text-white/45">
                  {entry.validated} validée{entry.validated > 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(10, (entry.validated / maxValidated) * 100)}%`,
                    background: "linear-gradient(90deg, rgba(240,201,107,0.95), rgba(139,92,246,0.9))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardPanel>
  );
}

export function FormationsValideesSummaryPanel({
  currentMonthValidated,
  goalFormations,
  tier,
  totalValidatedGlobal,
  selectedMonth,
}: Omit<FormationsValideesStatsPanelsProps, "sparklineData" | "maxValidated">) {
  return (
    <DashboardPanel
      tone="accent"
      accentHex={FORMATIONS_VALIDEES_ACCENT}
      intensity="soft"
      ariaLabelledBy="formations-validees-summary-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Synthèse"
        title={formatMonthLabel(selectedMonth)}
        icon={Target}
        tone="emerald"
        accentHex="#34d399"
        titleId="formations-validees-summary-title"
      />

      <div className="space-y-3">
        <DashboardInnerCard hover={false} className="!p-3">
          <p className="text-sm text-white/55">Progression du mois choisi</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {currentMonthValidated}/{goalFormations || "—"}
          </p>
          <p className="mt-1 text-[11px] text-white/40">Même objectif que la page Objectifs</p>
        </DashboardInnerCard>
        <DashboardInnerCard hover={false} className="!p-3">
          <p className="text-sm text-white/55">Palier du mois</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: tier.color }}>
            {tier.label}
          </p>
        </DashboardInnerCard>
        <DashboardInnerCard hover={false} className="!p-3">
          <p className="text-sm text-white/55">Total validé (historique global)</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">{totalValidatedGlobal}</p>
        </DashboardInnerCard>
      </div>
    </DashboardPanel>
  );
}
