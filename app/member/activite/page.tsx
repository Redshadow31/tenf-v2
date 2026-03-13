"use client";

import { Calendar, Rocket, Users } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import StatCard from "@/components/member/ui/StatCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberMonthlyActivityPage() {
  const { data, loading } = useMemberOverview();
  if (loading || !data) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement de l'activite...</p>;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mon activite du mois" description="Raids + presences valides sur le mois en cours." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Raids" value={data.stats.raidsThisMonth} icon={Rocket} />
        <StatCard title="Presences evenements" value={data.stats.eventPresencesThisMonth} icon={Users} />
        <StatCard title="Total actions du mois" value={data.stats.participationThisMonth} icon={Calendar} />
      </section>
    </MemberSurface>
  );
}
