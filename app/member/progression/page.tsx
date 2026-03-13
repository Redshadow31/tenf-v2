"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import ProgressGoalCard from "@/components/member/ui/ProgressGoalCard";
import ComingSoonPanel from "@/components/member/ui/ComingSoonPanel";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberProgressionPage() {
  const { data, loading } = useMemberOverview();
  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement...</p>;

  return (
    <MemberSurface>
      <MemberPageHeader title="Ma progression" description="Suivi global de ton activite membre et de tes jalons." />
      <section className="grid gap-4 md:grid-cols-3">
        <ProgressGoalCard label="Participation du mois" current={data.stats.participationThisMonth} target={14} />
        <ProgressGoalCard label="Formations validees" current={data.stats.formationsValidated} target={12} />
        <ProgressGoalCard label="Profil complet" current={data.profile.percent} target={100} />
      </section>
      <ComingSoonPanel items={["Suivi Academy personnalise", "Progression par competences"]} />
    </MemberSurface>
  );
}
