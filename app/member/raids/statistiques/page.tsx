"use client";

import { Activity, BarChart3, Rocket } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import StatCard from "@/components/member/ui/StatCard";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberRaidStatsPage() {
  const { data, loading, error } = useMemberOverview();

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des statistiques...</p>;
  if (error || !data) return <EmptyFeatureCard title="Statistiques de raids" description={error || "Donnnees indisponibles."} />;

  const evolutionText = data.stats.raidsTotal > data.stats.raidsThisMonth ? "Historique en progression" : "Debut de suivi";

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Statistiques de raids"
        description="Suivi simple de tes raids ce mois et sur l'historique recent."
      />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Raids ce mois" value={data.stats.raidsThisMonth} icon={Rocket} />
        <StatCard title="Raids total (12 mois)" value={data.stats.raidsTotal} icon={BarChart3} />
        <StatCard title="Evolution" value={evolutionText} icon={Activity} />
      </section>
    </MemberSurface>
  );
}
