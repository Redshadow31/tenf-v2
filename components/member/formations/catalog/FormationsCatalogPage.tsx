"use client";

import { useMemo } from "react";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import FormationRequestModal from "@/components/member/formations/FormationRequestModal";
import FormationsRouteNav from "@/components/member/formations/catalog/FormationsRouteNav";
import FormationsCatalogHero from "@/components/member/formations/catalog/FormationsCatalogHero";
import FormationsCatalogSubNav from "@/components/member/formations/catalog/FormationsCatalogSubNav";
import FormationsCatalogUpcomingPanel from "@/components/member/formations/catalog/FormationsCatalogUpcomingPanel";
import FormationsCatalogArchivePanel from "@/components/member/formations/catalog/FormationsCatalogArchivePanel";
import FormationsCatalogGuidancePanel from "@/components/member/formations/catalog/FormationsCatalogGuidancePanel";
import FormationEventDetailModal from "@/components/member/formations/catalog/FormationEventDetailModal";
import {
  buildFormationsCatalogGuidanceModel,
  buildFormationsCatalogHeroModel,
  resolveFormationsCatalogProfile,
} from "@/components/member/formations/catalog/formationsCatalogModel";
import { FORMATIONS_CATALOG_ACCENT } from "@/components/member/formations/catalog/formationsCatalogUtils";
import { useFormationsCatalogPage } from "@/components/member/formations/catalog/useFormationsCatalogPage";

export default function FormationsCatalogPage() {
  const { data: overview } = useMemberOverview();
  const page = useFormationsCatalogPage();

  const heroModel = useMemo(
    () =>
      buildFormationsCatalogHeroModel({
        overview,
        upcomingCount: page.upcomingFormations.length,
        catalogCount: page.pastFormationsUnique.length,
        interestedCount: page.interestedCount,
        registeredUpcoming: page.registeredUpcoming,
      }),
    [
      overview,
      page.upcomingFormations.length,
      page.pastFormationsUnique.length,
      page.interestedCount,
      page.registeredUpcoming,
    ],
  );

  const profile = useMemo(
    () =>
      resolveFormationsCatalogProfile({
        validatedTotal: overview?.stats.formationsValidated ?? 0,
        validatedThisMonth:
          overview?.stats.formationsValidatedThisMonth ??
          (overview?.formationHistory ?? []).filter(
            (item) => (item.date ?? "").slice(0, 7) === (overview?.monthKey ?? ""),
          ).length,
        interestedCount: page.interestedCount,
        registeredUpcoming: page.registeredUpcoming,
        upcomingCount: page.upcomingFormations.length,
      }),
    [overview, page.interestedCount, page.registeredUpcoming, page.upcomingFormations.length],
  );

  const guidanceModel = useMemo(
    () =>
      buildFormationsCatalogGuidanceModel({
        firstName: heroModel.firstName,
        profile,
        twitchConnected: page.twitchLinkState.connected,
      }),
    [heroModel.firstName, profile, page.twitchLinkState.connected],
  );

  if (page.loading && page.upcomingFormations.length === 0 && page.pastFormationsUnique.length === 0) {
    return (
      <MemberBentoShell accentHex={FORMATIONS_CATALOG_ACCENT}>
        <FormationsCatalogSkeleton />
      </MemberBentoShell>
    );
  }

  return (
    <MemberBentoShell accentHex={FORMATIONS_CATALOG_ACCENT}>
      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <FormationsRouteNav />
        </MemberBentoCell>
      </MemberBentoRow>

      <MemberBentoRow>
        <MemberBentoCell span={12}>
          <FormationsCatalogHero
            model={heroModel}
            upcomingCount={page.upcomingFormations.length}
            catalogCount={page.pastFormationsUnique.length}
            interestedCount={page.interestedCount}
            loading={page.loading}
            onOpenRequest={() => page.setRequestModalOpen(true)}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <FormationsCatalogSubNav />

      {page.feedback ? (
        <div
          className="rounded-xl border border-violet-400/35 bg-violet-500/10 px-4 py-3 text-sm text-violet-50"
          role="status"
        >
          {page.feedback}
        </div>
      ) : null}

      <MemberBentoRow>
        <MemberBentoCell span={8}>
          <FormationsCatalogUpcomingPanel
            loading={page.loading}
            formations={page.upcomingFormations}
            registeredEventIds={page.registeredEventIds}
            registeringEventId={page.registeringEventId}
            onToggleRegistration={page.toggleRegistration}
            onSelectEvent={page.setSelectedEvent}
          />
          <FormationsCatalogArchivePanel
            loading={page.loading}
            filteredCount={page.filteredPastFormations.length}
            displayedCatalog={page.displayedPastCatalog}
            catalogQuery={page.catalogQuery}
            onCatalogQueryChange={page.setCatalogQuery}
            showInterestedOnly={page.showInterestedOnly}
            onShowInterestedOnlyChange={page.setShowInterestedOnly}
            catalogSort={page.catalogSort}
            onCatalogSortChange={page.setCatalogSort}
            catalogViewMode={page.catalogViewMode}
            onCatalogViewModeChange={page.setCatalogViewMode}
            catalogLetter={page.catalogLetter}
            onCatalogLetterChange={page.setCatalogLetter}
            catalogLetterChips={page.catalogLetterChips}
            pendingTitles={page.pendingTitles}
            submittingTitle={page.submittingTitle}
            onSubmitInterest={(title, sourceEventId) => void page.submitInterest(title, sourceEventId)}
            onOpenRequest={() => page.setRequestModalOpen(true)}
          />
        </MemberBentoCell>
        <MemberBentoCell span={4}>
          <FormationsCatalogGuidancePanel
            model={guidanceModel}
            twitchLoading={page.twitchLinkState.loading}
            twitchConnected={page.twitchLinkState.connected}
            onOpenRequest={() => page.setRequestModalOpen(true)}
          />
        </MemberBentoCell>
      </MemberBentoRow>

      <FormationEventDetailModal event={page.selectedEvent} onClose={() => page.setSelectedEvent(null)} />

      <FormationRequestModal
        open={page.requestModalOpen}
        onClose={() => page.setRequestModalOpen(false)}
        catalogSuggestions={page.catalogSuggestionsForModal}
        onSuccess={() => {
          void page.refreshPendingFormationRequests();
          page.setFeedback("Demande enregistrée. L'équipe la verra dans l'admin « Demandes de formation ».");
        }}
      />
    </MemberBentoShell>
  );
}

function FormationsCatalogSkeleton() {
  return (
    <div className="flex w-full animate-pulse flex-col gap-3">
      <div className="h-14 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-44 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="h-11 rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04]" />
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="h-[36rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-8" />
        <div className="h-[36rem] rounded-[1.35rem] border border-white/[0.06] bg-white/[0.04] lg:col-span-4" />
      </div>
    </div>
  );
}
