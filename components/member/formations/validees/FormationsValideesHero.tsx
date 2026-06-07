"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Sparkles, Target, TrendingUp } from "lucide-react";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberHeroStat,
  MemberInsightChip,
  MemberSecondaryLink,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import FormationsValideesProgressRing from "@/components/member/formations/validees/FormationsValideesProgressRing";
import type { FormationsValideesHeroModel } from "@/components/member/formations/validees/formationsValideesModel";
import {
  FORMATIONS_VALIDEES_ACCENT,
  formatMonthLabel,
} from "@/components/member/formations/validees/formationsValideesUtils";

type FormationsValideesHeroProps = {
  model: FormationsValideesHeroModel;
  selectedMonth: string;
  completionRate: number;
  currentMonthValidated: number;
  delta: number;
  totalValidated12Months: number;
  goalFormations: number;
};

export default function FormationsValideesHero({
  model,
  selectedMonth,
  completionRate,
  currentMonthValidated,
  delta,
  totalValidated12Months,
  goalFormations,
}: FormationsValideesHeroProps) {
  return (
    <DashboardPanel id="formations-validees-hero" tone="accent" accentHex={FORMATIONS_VALIDEES_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[auto_1fr_10.5rem] xl:items-start">
        <FormationsValideesProgressRing value={completionRate} />

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={FORMATIONS_VALIDEES_ACCENT}>
              <GraduationCap className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="gold">
              <Sparkles className="h-3 w-3" aria-hidden />
              {model.tier.label}
            </DashboardBadge>
            {selectedMonth ? (
              <DashboardBadge tone="amber">{formatMonthLabel(selectedMonth).split(" ")[0]}</DashboardBadge>
            ) : null}
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères formations validées">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <MemberSecondaryLink href="/member/formations">
              Catalogue
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
            <MemberSecondaryLink href="/member/objectifs">Objectifs du mois</MemberSecondaryLink>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat
            icon={Target}
            label="Ce mois"
            value={`${currentMonthValidated}/${goalFormations || "—"}`}
            accent="#f59e0b"
          />
          <MemberHeroStat
            icon={TrendingUp}
            label="Delta M-1"
            value={`${delta >= 0 ? "+" : ""}${delta}`}
            accent={delta >= 0 ? "#34d399" : "#f87171"}
          />
          <MemberHeroStat
            icon={GraduationCap}
            label="12 mois"
            value={String(totalValidated12Months)}
            accent={FORMATIONS_VALIDEES_ACCENT}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/member/progression"
          className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-semibold text-white/55 transition hover:bg-white/[0.08] hover:text-white/80"
        >
          Ma progression
          <ArrowRight className="h-3 w-3 opacity-60" aria-hidden />
        </Link>
      </div>
    </DashboardPanel>
  );
}
