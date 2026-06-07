"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import RaidDeclareHero from "@/components/member/raids/declare/RaidDeclareHero";
import RaidDeclareSubNav from "@/components/member/raids/declare/RaidDeclareSubNav";
import RaidDeclareFormPanel from "@/components/member/raids/declare/RaidDeclareFormPanel";
import RaidDeclareGuidancePanel from "@/components/member/raids/declare/RaidDeclareGuidancePanel";
import RaidDeclareDeclarationsPanel from "@/components/member/raids/declare/RaidDeclareDeclarationsPanel";
import RaidDeclareSuccessModal from "@/components/member/raids/declare/RaidDeclareSuccessModal";
import RaidDeclareToast from "@/components/member/raids/declare/RaidDeclareToast";
import {
  buildRaidDeclareGuidanceModel,
  buildRaidDeclareHeroModel,
} from "@/components/member/raids/declare/raidDeclareModel";
import { useRaidDeclarePage } from "@/components/member/raids/declare/useRaidDeclarePage";
import { RAID_DECLARE_ACCENT } from "@/components/member/raids/declare/raidDeclareUtils";

export default function MemberDeclareRaidPage() {
  const searchParams = useSearchParams();
  const cibleFromUrl = searchParams?.get("cible")?.trim() ?? "";
  const { data: overview } = useMemberOverview();

  const page = useRaidDeclarePage(cibleFromUrl);

  const heroModel = useMemo(
    () =>
      buildRaidDeclareHeroModel({
        overview,
        declarations: page.declaredRaids,
        cibleFromUrl,
        backendEnabled: page.backendSubmissionEnabled,
      }),
    [overview, page.declaredRaids, cibleFromUrl, page.backendSubmissionEnabled],
  );

  const guidanceModel = useMemo(
    () =>
      buildRaidDeclareGuidanceModel({
        firstName: heroModel.firstName,
        backendEnabled: page.backendSubmissionEnabled,
        hasDeclarations: page.declaredRaids.length > 0,
      }),
    [heroModel.firstName, page.backendSubmissionEnabled, page.declaredRaids.length],
  );

  const pendingCount = useMemo(
    () =>
      page.declaredRaids.filter((row) => row.status === "processing" || row.status === "to_study").length,
    [page.declaredRaids],
  );

  if (page.loadingDeclarations && page.declaredRaids.length === 0) {
    return (
      <MemberBentoShell accentHex={RAID_DECLARE_ACCENT}>
        <DeclareSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={RAID_DECLARE_ACCENT}>
      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidDeclareHero model={heroModel} pendingCount={pendingCount} />
        </MemberBentoCell>
      </MemberBentoRow>

      <RaidDeclareSubNav />

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <RaidDeclareFormPanel
            form={page.form}
            setForm={page.setForm}
            isApproximateTime={page.isApproximateTime}
            setIsApproximateTime={page.setIsApproximateTime}
            error={page.error}
            submitting={page.submitting}
            backendSubmissionEnabled={page.backendSubmissionEnabled}
            showAutocomplete={page.showAutocomplete}
            setShowAutocomplete={page.setShowAutocomplete}
            loadingSuggestions={page.loadingSuggestions}
            groupedSuggestions={page.groupedSuggestions}
            lowRaidedSuggestions={page.lowRaidedSuggestions}
            applySuggestion={page.applySuggestion}
            applyNow={page.applyNow}
            onSubmit={page.handleSubmit}
          />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <RaidDeclareGuidancePanel
            model={guidanceModel}
            formPreview={page.formPreview}
            isApproximateTime={page.isApproximateTime}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <RaidDeclareDeclarationsPanel
            loading={page.loadingDeclarations}
            filteredDeclarations={page.filteredDeclarations}
            totalDeclarations={page.declaredRaids.length}
            declarationFilter={page.declarationFilter}
            onFilterChange={(filter) => {
              page.setDeclarationFilter(filter);
              page.setExpandedDeclarationId(null);
            }}
            declarationCounts={page.declarationCounts}
            expandedDeclarationId={page.expandedDeclarationId}
            onToggleExpand={(id) => page.setExpandedDeclarationId((current) => (current === id ? null : id))}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <RaidDeclareSuccessModal
        open={page.showConfirmation}
        firstName={heroModel.firstName}
        onClose={() => page.setShowConfirmation(false)}
      />
      <RaidDeclareToast toast={page.toast} />
    </MemberBentoShell>
  );
}

function DeclareSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[32rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-[32rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
      <div className="h-48 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
    </div>
  );
}
