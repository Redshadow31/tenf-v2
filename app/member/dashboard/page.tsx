"use client";

import Link from "next/link";
import { Calendar, CheckCircle2, Clock3, Flag, Rocket, UserCircle2 } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import StatCard from "@/components/member/ui/StatCard";
import ProgressGoalCard from "@/components/member/ui/ProgressGoalCard";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import ComingSoonPanel from "@/components/member/ui/ComingSoonPanel";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

const monthlyGoals = {
  raids: 8,
  presences: 6,
};

export default function MemberDashboardPage() {
  const { data, loading, error } = useMemberOverview();

  if (loading) {
    return <p style={{ color: "var(--color-text-secondary)" }}>Chargement du dashboard...</p>;
  }

  if (error || !data) {
    return (
      <MemberSurface>
        <MemberPageHeader title="Dashboard membre" description="Synthese de ton activite et de tes prochaines actions." />
        <EmptyFeatureCard title="Dashboard indisponible" description={error || "Impossible de charger les informations membre."} />
      </MemberSurface>
    );
  }

  const integrationLabel = data.member.integrationDate
    ? `Faite le ${new Date(data.member.integrationDate).toLocaleDateString("fr-FR")}`
    : "Non faite";

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Dashboard membre"
        description="Vue d'ensemble de ta participation TENF et des prochaines etapes."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Raids ce mois" value={data.stats.raidsThisMonth} icon={Rocket} />
        <StatCard title="Formations validees" value={data.stats.formationsValidated} icon={CheckCircle2} />
        <StatCard title="Participation mensuelle" value={data.stats.participationThisMonth} icon={Flag} />
        <StatCard title="Reunion integration" value={data.member.integrationDate ? "Oui" : "Non"} subtitle={integrationLabel} icon={Calendar} />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <ProgressGoalCard label="Objectif raids du mois" current={data.stats.raidsThisMonth} target={monthlyGoals.raids} />
        <ProgressGoalCard label="Objectif presences du mois" current={data.stats.eventPresencesThisMonth} target={monthlyGoals.presences} />
        <ProgressGoalCard label="Profil complete" current={data.profile.percent} target={100} />
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
          Completer mon profil
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          {data.profile.completed
            ? "Ton profil est complet. Tu peux modifier tes informations quand tu veux."
            : "Ton profil est incomplet. Termine les champs manquants pour finaliser ton espace membre."}
        </p>
        <Link
          href={data.profile.completed ? "/member/profil/modifier" : "/member/profil/completer"}
          className="mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {data.profile.completed ? "Modifier mes informations" : "Completer mon profil"}
        </Link>
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
          Mes prochaines actions
        </h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <Link href="/member/raids/declarer" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Declarer un raid
          </Link>
          <Link href="/member/profil/completer" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Completer mon profil
          </Link>
          <Link href="/member/evenements" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Voir le planning des evenements
          </Link>
          <Link href="/member/formations" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}>
            Consulter mes formations
          </Link>
        </div>
      </section>

      {data.upcomingEvents.length > 0 ? (
        <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Planning / prochains evenements
          </h2>
          <div className="mt-3 space-y-2">
            {data.upcomingEvents.map((event) => (
              <div key={event.id} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "var(--color-border)" }}>
                <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                <p style={{ color: "var(--color-text-secondary)" }}>
                  {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <EmptyFeatureCard title="Planning des evenements" description="Les prochains evenements seront affiches ici des qu'ils sont publies." icon={Clock3} />
      )}

      <ComingSoonPanel
        items={["Mon evaluation", "Historique des evaluations", "Suivi personnalise Academy", "Mes notifications"]}
        title="Fonctionnalites a venir"
      />
    </MemberSurface>
  );
}
