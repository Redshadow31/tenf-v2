"use client";

import Link from "next/link";
import { Calendar, UserCircle2 } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import StatCard from "@/components/member/ui/StatCard";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

export default function MemberProfilePage() {
  const { data, loading, error } = useMemberOverview();

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement du profil...</p>;
  if (error || !data) return <EmptyFeatureCard title="Mon profil" description={error || "Impossible de charger le profil."} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mon profil" description="Consulte tes informations et gere ton profil membre." />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pseudo Twitch" value={data.member.twitchLogin} icon={UserCircle2} />
        <StatCard title="Profil complet" value={`${data.profile.percent}%`} />
        <StatCard
          title="Reunion integration"
          value={data.member.integrationDate ? "Faite" : "A faire"}
          subtitle={data.member.integrationDate ? new Date(data.member.integrationDate).toLocaleDateString("fr-FR") : "Aucune date enregistree"}
          icon={Calendar}
        />
      </section>
      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <h2 className="text-lg font-semibold">Actions profil</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/member/profil/completer" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
            Completer mon profil
          </Link>
          <Link href="/member/profil/modifier" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
            Modifier mes informations
          </Link>
        </div>
      </section>
    </MemberSurface>
  );
}
