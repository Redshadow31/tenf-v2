"use client";

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import { MemberAlert } from "@/components/member/dashboard/dashboardUi";
import FormationsRouteNav from "@/components/member/formations/catalog/FormationsRouteNav";
import FormationsValideesHero from "@/components/member/formations/validees/FormationsValideesHero";
import FormationsValideesSubNav from "@/components/member/formations/validees/FormationsValideesSubNav";
import FormationsValideesMonthPickerPanel from "@/components/member/formations/validees/FormationsValideesMonthPickerPanel";
import {
  FormationsValideesSummaryPanel,
  FormationsValideesTrendPanel,
} from "@/components/member/formations/validees/FormationsValideesStatsPanels";
import FormationsValideesListPanel from "@/components/member/formations/validees/FormationsValideesListPanel";
import FormationsValideesGuidancePanel from "@/components/member/formations/validees/FormationsValideesGuidancePanel";
import {
  buildFormationsValideesGuidanceModel,
  buildFormationsValideesHeroModel,
  resolveFormationsValideesProfile,
} from "@/components/member/formations/validees/formationsValideesModel";
import { FORMATIONS_VALIDEES_ACCENT } from "@/components/member/formations/validees/formationsValideesUtils";
import { useFormationsValideesPage } from "@/components/member/formations/validees/useFormationsValideesPage";

export default function FormationsValideesPage() {
  const { data, loading, error } = useMemberOverview();
  const page = useFormationsValideesPage(data);

  const heroModel = useMemo(() => {
    if (!data || !page.selectedMonth) return null;
    return buildFormationsValideesHeroModel({
      overview: data,
      selectedMonth: page.selectedMonth,
      currentMonthValidated: page.currentMonthValidated,
      goalFormations: page.goals.formations,
      totalValidated12Months: page.totalValidated12Months,
      completionRate: page.completionRate,
      remainingToTarget: page.remainingToTarget,
    });
  }, [data, page]);

  const profile = useMemo(() => {
    if (!data) return "starting" as const;
    return resolveFormationsValideesProfile({
      currentMonthValidated: page.currentMonthValidated,
      goalFormations: page.goals.formations,
      totalValidated12Months: page.totalValidated12Months,
      totalValidatedGlobal: data.stats.formationsValidated ?? 0,
    });
  }, [data, page.currentMonthValidated, page.goals.formations, page.totalValidated12Months]);

  const guidanceModel = useMemo(() => {
    if (!heroModel) return null;
    return buildFormationsValideesGuidanceModel({
      firstName: heroModel.firstName,
      profile,
      remainingToTarget: page.remainingToTarget,
    });
  }, [heroModel, profile, page.remainingToTarget]);

  if (!loading && (error || !data)) {
    return (
      <MemberBentoShell accentHex={FORMATIONS_VALIDEES_ACCENT}>
        <MemberAlert variant="error">
          {error || "Données indisponibles."}{" "}
          <button type="button" onClick={() => window.location.reload()} className="ml-1 inline-flex items-center gap-1 underline underline-offset-2">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Réessayer
          </button>
        </MemberAlert>
      </MemberBentoShell>
    );
  }

  if (loading || !data || !heroModel || !guidanceModel || !page.selectedMonth) {
    return (
      <MemberBentoShell accentHex={FORMATIONS_VALIDEES_ACCENT}>
        <FormationsValideesSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={FORMATIONS_VALIDEES_ACCENT}>
      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <FormationsRouteNav />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <FormationsValideesHero
            model={heroModel}
            selectedMonth={page.selectedMonth}
            completionRate={page.completionRate}
            currentMonthValidated={page.currentMonthValidated}
            delta={page.delta}
            totalValidated12Months={page.totalValidated12Months}
            goalFormations={page.goals.formations}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <FormationsValideesSubNav />

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <FormationsValideesMonthPickerPanel
            selectedMonth={page.selectedMonth}
            onSelectedMonthChange={page.setSelectedMonth}
            monthOptions={page.monthOptions}
            formationsByMonth={page.formationsByMonth}
          />
          <div className="grid gap-0 lg:grid-cols-2 lg:gap-3">
            <FormationsValideesTrendPanel sparklineData={page.sparklineData} maxValidated={page.maxValidated} />
            <FormationsValideesSummaryPanel
              currentMonthValidated={page.currentMonthValidated}
              goalFormations={page.goals.formations}
              tier={heroModel.tier}
              totalValidatedGlobal={data.stats.formationsValidated ?? 0}
              selectedMonth={page.selectedMonth}
            />
          </div>
          <FormationsValideesListPanel selectedMonth={page.selectedMonth} formations={page.selectedFormations} />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <FormationsValideesGuidancePanel model={guidanceModel} />
        </MemberBentoCell>
      </MemberBentoRow>
    </MemberBentoShell>
  );
}

function FormationsValideesSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-14 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[28rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-[28rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
