"use client";

import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import ProgressGoalCard from "@/components/member/ui/ProgressGoalCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberGoalsPage() {
  const { data, loading } = useMemberOverview();
  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des objectifs...</p>;

  const goals = {
    raids: 8,
    presences: 6,
  };

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Objectifs du mois"
        description="Version initiale des objectifs membre. La personnalisation sera ajoutee prochainement."
        badge="Personnalisation bientot disponible"
      />
      <section className="grid gap-4 md:grid-cols-3">
        <ProgressGoalCard label="Objectif raids du mois" current={data.stats.raidsThisMonth} target={goals.raids} />
        <ProgressGoalCard label="Objectif presences du mois" current={data.stats.eventPresencesThisMonth} target={goals.presences} />
        <ProgressGoalCard label="Objectif profil complete" current={data.profile.percent} target={100} />
      </section>
    </MemberSurface>
  );
}
