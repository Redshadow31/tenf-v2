"use client";

import { useEffect, useMemo, useState } from "react";
import MemberBentoShell, { MemberBentoCell, MemberBentoRow } from "@/components/member/layout/MemberBentoShell";
import AdminDashboardLoadingScreen from "@/components/admin/dashboard/AdminDashboardLoadingScreen";
import MembersCrossHubLinks from "@/components/admin/members-hub/MembersCrossHubLinks";
import MembersDailyQueue from "@/components/admin/members-hub/MembersDailyQueue";
import MembersExperienceLinks from "@/components/admin/members-hub/MembersExperienceLinks";
import MembersHealthCards from "@/components/admin/members-hub/MembersHealthCards";
import MembersHubCockpitAside from "@/components/admin/members-hub/MembersHubCockpitAside";
import MembersHubHeader from "@/components/admin/members-hub/MembersHubHeader";
import MembersHubStaffGuide from "@/components/admin/members-hub/MembersHubStaffGuide";
import MembersManagementPaths from "@/components/admin/members-hub/MembersManagementPaths";
import MembersTodayPulse from "@/components/admin/members-hub/MembersTodayPulse";
import MembersTrendCard from "@/components/admin/members-hub/MembersTrendCard";
import MembersWeakSignals from "@/components/admin/members-hub/MembersWeakSignals";
import {
  buildMembersHubCopyModel,
  MEMBERS_HUB_LOADING_COPY,
} from "@/lib/admin/members/membersHubCopyModel";
import { useMembersHubData } from "@/lib/admin/members/membersHubModel";

const OWNERS_LOCAL_KEY = "tenf-admin-members-pilotage-owners";

export default function MembersHubView() {
  const data = useMembersHubData();
  const [opsOwners, setOpsOwners] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OWNERS_LOCAL_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        setOpsOwners(parsed as Record<string, string>);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const urgentCount = useMemo(
    () => data.urgentActions.reduce((sum, item) => sum + item.count, 0),
    [data.urgentActions],
  );
  const importantCount = useMemo(
    () => data.importantActions.reduce((sum, item) => sum + item.count, 0),
    [data.importantActions],
  );
  const weakSignalsCount = useMemo(
    () => data.weakSignals.reduce((sum, item) => sum + item.count, 0),
    [data.weakSignals],
  );

  const pathCounters = useMemo(
    () => ({
      profileValidationPending: data.ops.profileValidationPendingCount,
      incomplete: data.summary.incomplete,
      reviewOverdue: data.summary.reviewOverdue,
      syncMissing: data.syncMissingCount,
      staffApplicationsPending: data.ops.staffApplicationsPendingCount,
      qualityScore: data.qualityScore,
      dataErrors: data.dataHealth.errors,
    }),
    [data.ops, data.summary, data.syncMissingCount, data.qualityScore, data.dataHealth.errors],
  );

  const copy = useMemo(
    () =>
      buildMembersHubCopyModel({
        displayName: data.user?.displayName || "Staff",
        roleLabel: data.user?.roleLabel || "",
        rawRole: data.user?.rawRole ?? null,
        summary: data.summary,
        ops: data.ops,
        pendingTotal: data.pendingTotal,
        urgentCount,
        importantCount,
        weakSignalsCount,
        qualityScore: data.qualityScore,
        qualityTier: data.qualityTier,
        pathCounters,
      }),
    [data.user, data.summary, data.ops, data.pendingTotal, urgentCount, importantCount, weakSignalsCount, data.qualityScore, data.qualityTier, pathCounters],
  );

  if (data.loading && !data.user) {
    return (
      <AdminDashboardLoadingScreen
        title={MEMBERS_HUB_LOADING_COPY.loadingTitle}
        subtitle={MEMBERS_HUB_LOADING_COPY.loadingSubtitle}
      />
    );
  }

  return (
    <div className="-mx-4 md:-mx-6">
      <MemberBentoShell accentHex={copy.accent}>
        <MemberBentoRow stretch>
          <MemberBentoCell span={7} stretch>
            <MembersHubHeader
              copy={copy}
              generatedAt={data.generatedAt}
              pendingTotal={data.pendingTotal}
              refreshing={data.refreshing}
              partial={data.partial}
              onRefresh={() => void data.refresh()}
            />
          </MemberBentoCell>
          <MemberBentoCell span={5} stretch>
            <MembersHubCockpitAside
              copy={copy}
              pendingTotal={data.pendingTotal}
              profileValidationPending={data.ops.profileValidationPendingCount}
            />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={4} stretch>
            <MembersTodayPulse
              copy={copy}
              urgentCount={urgentCount}
              importantCount={importantCount}
              pendingTotal={data.pendingTotal}
              qualityScore={data.qualityScore}
              qualityTier={data.qualityTier}
            />
          </MemberBentoCell>
          <MemberBentoCell span={8} stretch>
            <MembersHubStaffGuide copy={copy} profileValidationPending={data.ops.profileValidationPendingCount} />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={8} stretch>
            <MembersDailyQueue
              copy={copy}
              urgent={data.urgentActions}
              important={data.importantActions}
              totalPending={data.pendingTotal}
              ownersStore={opsOwners}
              ownersIsLocal
            />
          </MemberBentoCell>
          <MemberBentoCell span={4} stretch>
            <MembersTrendCard copy={copy} pendingTotal={data.pendingTotal} qualityScore={data.qualityScore} />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow>
          <MemberBentoCell span={12}>
            <MembersHealthCards
              copy={copy}
              totalMembers={data.summary.total}
              validatedProfiles={data.summary.validatedProfiles}
              qualityScore={data.qualityScore}
              qualityTier={data.qualityTier}
              reviewOverdue={data.summary.reviewOverdue}
              reviewDue7d={data.summary.reviewDue7d}
              incomplete={data.summary.incomplete}
              profileValidationPending={data.ops.profileValidationPendingCount}
            />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={8} stretch>
            <MembersManagementPaths copy={copy} counters={pathCounters} />
          </MemberBentoCell>
          <MemberBentoCell span={4} stretch>
            <MembersWeakSignals copy={copy} signals={data.weakSignals} />
          </MemberBentoCell>
        </MemberBentoRow>

        <MemberBentoRow stretch>
          <MemberBentoCell span={5} stretch>
            <MembersExperienceLinks copy={copy} />
          </MemberBentoCell>
          <MemberBentoCell span={7} stretch>
            <MembersCrossHubLinks copy={copy} />
          </MemberBentoCell>
        </MemberBentoRow>
      </MemberBentoShell>
    </div>
  );
}
