"use client";

import { useEffect, useState } from "react";
import MembersHubHeader from "@/components/admin/members-hub/MembersHubHeader";
import MembersTodayPulse from "@/components/admin/members-hub/MembersTodayPulse";
import MembersDailyQueue from "@/components/admin/members-hub/MembersDailyQueue";
import MembersHealthCards from "@/components/admin/members-hub/MembersHealthCards";
import MembersTrendCard from "@/components/admin/members-hub/MembersTrendCard";
import MembersWeakSignals from "@/components/admin/members-hub/MembersWeakSignals";
import MembersManagementPaths from "@/components/admin/members-hub/MembersManagementPaths";
import MembersExperienceLinks from "@/components/admin/members-hub/MembersExperienceLinks";
import MembersCrossHubLinks from "@/components/admin/members-hub/MembersCrossHubLinks";
import MembersHubSkeleton from "@/components/admin/members-hub/MembersHubSkeleton";
import MembersCockpitShell from "@/components/admin/members-hub/MembersCockpitShell";
import MembersHubCockpitAside from "@/components/admin/members-hub/MembersHubCockpitAside";
import MembersHubStaffGuide from "@/components/admin/members-hub/MembersHubStaffGuide";
import { useMembersHubData } from "@/lib/admin/members/membersHubModel";
import { getDiscordUser } from "@/lib/discord";

/**
 * Hub `/admin/membres` — V2 pilotage communauté (cockpit zinc/violet).
 */

const OWNERS_LOCAL_KEY = "tenf-admin-members-pilotage-owners";

export default function MembersHubPage() {
  const data = useMembersHubData();
  const [username, setUsername] = useState("Admin");
  const [roleLabel, setRoleLabel] = useState<string | null>(null);
  const [opsOwners, setOpsOwners] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    async function loadIdentity() {
      try {
        const [user, aliasRes, roleRes] = await Promise.all([
          getDiscordUser().catch(() => null),
          fetch("/api/admin/access/self", { cache: "no-store" }).catch(() => null),
          fetch("/api/user/role", { cache: "no-store" }).catch(() => null),
        ]);
        if (!mounted) return;

        let displayName = user?.username || "Admin";
        if (aliasRes?.ok) {
          const aliasData = await aliasRes.json();
          const alias = typeof aliasData?.adminAlias === "string" ? aliasData.adminAlias.trim() : "";
          if (alias) displayName = alias;
        }
        setUsername(displayName);

        if (roleRes?.ok) {
          const roleData = await roleRes.json();
          setRoleLabel(typeof roleData?.role === "string" ? roleData.role : null);
        }
      } catch {
        /* identité non bloquante */
      }
    }
    void loadIdentity();
    return () => {
      mounted = false;
    };
  }, []);

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

  if (data.loading) {
    return <MembersHubSkeleton />;
  }

  return (
    <MembersCockpitShell
      aside={
        <MembersHubCockpitAside
          pendingTotal={data.pendingTotal}
          profileValidationPending={data.ops.profileValidationPendingCount}
        />
      }
    >
      <MembersHubHeader
        username={username}
        roleLabel={roleLabel}
        generatedAt={data.generatedAt}
        pendingTotal={data.pendingTotal}
        refreshing={data.refreshing}
        partial={data.partial}
        onRefresh={() => void data.refresh()}
      />

      <MembersHubStaffGuide
        pendingTotal={data.pendingTotal}
        profileValidationPending={data.ops.profileValidationPendingCount}
      />

      <MembersTodayPulse
        urgentCount={data.urgentActions.reduce((sum, item) => sum + item.count, 0)}
        importantCount={data.importantActions.reduce((sum, item) => sum + item.count, 0)}
        pendingTotal={data.pendingTotal}
        qualityScore={data.qualityScore}
        qualityTier={data.qualityTier}
        weakSignalsCount={data.weakSignals.reduce((sum, item) => sum + item.count, 0)}
      />

      <MembersDailyQueue
        urgent={data.urgentActions}
        important={data.importantActions}
        totalPending={data.pendingTotal}
        ownersStore={opsOwners}
        ownersIsLocal
      />

      <MembersHealthCards
        totalMembers={data.summary.total}
        validatedProfiles={data.summary.validatedProfiles}
        qualityScore={data.qualityScore}
        qualityTier={data.qualityTier}
        reviewOverdue={data.summary.reviewOverdue}
        reviewDue7d={data.summary.reviewDue7d}
        incomplete={data.summary.incomplete}
        profileValidationPending={data.ops.profileValidationPendingCount}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_minmax(0,1.7fr)]">
        <MembersTrendCard pendingTotal={data.pendingTotal} qualityScore={data.qualityScore} />
        <MembersManagementPaths
          counters={{
            profileValidationPending: data.ops.profileValidationPendingCount,
            incomplete: data.summary.incomplete,
            reviewOverdue: data.summary.reviewOverdue,
            syncMissing: data.syncMissingCount,
            staffApplicationsPending: data.ops.staffApplicationsPendingCount,
            qualityScore: data.qualityScore,
            dataErrors: data.dataHealth.errors,
          }}
        />
      </div>

      <MembersWeakSignals signals={data.weakSignals} />
      <MembersExperienceLinks />
      <MembersCrossHubLinks />
    </MembersCockpitShell>
  );
}
