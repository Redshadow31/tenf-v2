"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, CheckCircle2, Clock3, Crown, Flag, Rocket, Sparkles, UserCircle2 } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberBreadcrumbs from "@/components/member/ui/MemberBreadcrumbs";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import ComingSoonPanel from "@/components/member/ui/ComingSoonPanel";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

const monthlyGoals = {
  raids: 8,
  presences: 6,
};

function formatDate(value: string | null) {
  if (!value) return "Non planifiee";
  return new Date(value).toLocaleDateString("fr-FR");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

export default function MemberDashboardPage() {
  const { data, loading, error } = useMemberOverview();

  if (loading) {
    return (
      <MemberSurface>
        <section
          className="rounded-2xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(212, 175, 55, 0.25)",
            background: "linear-gradient(145deg, rgba(20,20,24,0.95), rgba(33,33,40,0.95))",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.28)",
          }}
        >
          <p className="text-sm uppercase tracking-[0.16em]" style={{ color: "rgba(229, 199, 115, 0.86)" }}>
            Dashboard executive
          </p>
          <p className="mt-4 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
            Chargement de ton espace premium...
          </p>
        </section>
      </MemberSurface>
    );
  }

  if (error || !data) {
    return (
      <MemberSurface>
        <MemberBreadcrumbs />
        <section className="rounded-2xl border p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Espace membre
          </p>
          <h1 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Dashboard ultra premium
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Synthese de ton activite et de tes prochaines actions.
          </p>
        </section>
        <EmptyFeatureCard title="Dashboard indisponible" description={error || "Impossible de charger les informations membre."} />
      </MemberSurface>
    );
  }

  const integrationLabel = data.member.integrationDate ? `Faite le ${formatDate(data.member.integrationDate)}` : "Non faite";
  const displayName = data.member.displayName || data.member.twitchLogin;
  const firstName = displayName.split(" ")[0] || "Membre";
  const profileRemaining = Math.max(0, 100 - data.profile.percent);
  const vipActive = Boolean(data.vip?.activeThisMonth);

  const keyStats = [
    { title: "Raids ce mois", value: data.stats.raidsThisMonth, subtitle: `Objectif: ${monthlyGoals.raids}`, icon: Rocket },
    { title: "Participation mensuelle", value: `${data.stats.participationThisMonth}%`, subtitle: "Engagement actuel", icon: Flag },
    { title: "Formations validees", value: data.stats.formationsValidated, subtitle: "Capital competence", icon: CheckCircle2 },
    { title: "Reunion integration", value: data.member.integrationDate ? "Validee" : "A planifier", subtitle: integrationLabel, icon: Calendar },
  ];

  const goals = [
    { label: "Raids mensuels", current: data.stats.raidsThisMonth, target: monthlyGoals.raids, href: "/member/raids/declarer" },
    { label: "Presences evenements", current: data.stats.eventPresencesThisMonth, target: monthlyGoals.presences, href: "/member/evenements" },
    { label: "Profil membre", current: data.profile.percent, target: 100, href: "/member/profil/completer" },
  ];

  const priorityActions = [
    { href: "/member/raids/declarer", label: "Declarer un raid", description: "Ajoute ta derniere action pour booster ton score." },
    { href: "/member/profil/completer", label: data.profile.completed ? "Mettre a jour mon profil" : "Completer mon profil", description: "Ton profil nourrit les recommandations et opportunites." },
    { href: "/member/evenements", label: "Consulter les evenements", description: "Repere les rendez-vous a plus fort impact cette semaine." },
    { href: "/member/formations", label: "Continuer mes formations", description: "Maintiens un rythme regulier pour accelerer ta progression." },
  ];

  const executiveInsights = [
    `Ton taux de participation est a ${data.stats.participationThisMonth}%.`,
    data.profile.completed
      ? "Ton profil est complet, continue sur cette dynamique."
      : `Il te reste ${profileRemaining}% pour finaliser ton profil.`,
    data.upcomingEvents.length > 0
      ? `${data.upcomingEvents.length} evenement(s) planifie(s) prochainement.`
      : "Aucun evenement programme, pense a consulter le planning.",
  ];

  return (
    <MemberSurface>
      <section
        className="rounded-3xl border p-6 md:p-8"
        style={{
          borderColor: "rgba(212, 175, 55, 0.24)",
          background: "radial-gradient(circle at 15% 15%, rgba(212,175,55,0.18), rgba(27,27,33,0.96) 42%)",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.28)",
        }}
      >
        <MemberBreadcrumbs />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: "rgba(230, 201, 128, 0.9)" }}>
              Espace membre premium
            </p>
            <h1 className="mt-3 text-3xl font-semibold md:text-4xl" style={{ color: "var(--color-text)" }}>
              {firstName}, voici ton dashboard executive.
            </h1>
            <p className="mt-3 text-sm md:text-base" style={{ color: "rgba(236, 236, 239, 0.84)" }}>
              Pilote tes priorites, ton engagement et tes prochaines opportunites depuis un seul espace.
            </p>
          </div>
          <div className="grid gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.09em]"
              style={{
                borderColor: vipActive ? "rgba(212,175,55,0.46)" : "rgba(160,160,173,0.4)",
                backgroundColor: vipActive ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.05)",
                color: vipActive ? "rgba(244, 219, 151, 0.95)" : "rgba(220,220,225,0.86)",
              }}
            >
              <Crown size={14} />
              {data.vip?.statusLabel || "Membre standard"}
            </span>
            <Link
              href="/member/profil/completer"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px]"
              style={{ backgroundColor: "rgba(212,175,55,0.95)", color: "#201b12" }}
            >
              Optimiser mon profil
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {keyStats.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border p-5 transition-all hover:-translate-y-[1px]"
            style={{
              borderColor: "rgba(212,175,55,0.2)",
              background: "linear-gradient(150deg, rgba(32,32,38,0.95), rgba(22,22,27,0.96))",
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.1em]" style={{ color: "rgba(214, 214, 224, 0.75)" }}>
                {item.title}
              </p>
              <item.icon size={16} style={{ color: "rgba(236, 204, 120, 0.95)" }} />
            </div>
            <p className="mt-3 text-3xl font-semibold" style={{ color: "var(--color-text)" }}>
              {item.value}
            </p>
            <p className="mt-1 text-xs" style={{ color: "rgba(214, 214, 224, 0.72)" }}>
              {item.subtitle}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article
          className="rounded-2xl border p-5"
          style={{
            borderColor: "rgba(212,175,55,0.2)",
            background: "linear-gradient(165deg, rgba(28,28,34,0.96), rgba(17,17,21,0.98))",
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Executive snapshot
            </h2>
            <span className="inline-flex items-center gap-1 text-xs" style={{ color: "rgba(230, 199, 115, 0.88)" }}>
              <Sparkles size={14} />
              Semaine en cours
            </span>
          </div>
          <div className="mt-4 space-y-4">
            {goals.map((goal) => {
              const percent = Math.min(100, Math.round((goal.current / Math.max(goal.target, 1)) * 100));
              return (
                <div key={goal.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>{goal.label}</span>
                    <span style={{ color: "rgba(214, 214, 224, 0.75)" }}>
                      {goal.current}/{goal.target}
                    </span>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${percent}%`,
                        background: "linear-gradient(90deg, rgba(212,175,55,0.95), rgba(238,211,138,0.95))",
                      }}
                    />
                  </div>
                  <Link href={goal.href} className="mt-2 inline-flex items-center gap-1 text-xs hover:opacity-80" style={{ color: "rgba(230, 199, 115, 0.92)" }}>
                    Voir le detail
                    <ArrowUpRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Insights prioritaires
          </h2>
          <div className="mt-4 space-y-2">
            {executiveInsights.map((insight) => (
              <p key={insight} className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.08)", color: "var(--color-text-secondary)" }}>
                {insight}
              </p>
            ))}
          </div>
          <p className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Integration: {integrationLabel}
          </p>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            Actions recommandees
          </h2>
          <div className="mt-3 space-y-2">
            {priorityActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="block rounded-xl border p-3 transition-all hover:-translate-y-[1px]"
                style={{ borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {action.label}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      {action.description}
                    </p>
                  </div>
                  <ArrowUpRight size={14} style={{ color: "rgba(230, 199, 115, 0.92)" }} />
                </div>
              </Link>
            ))}
          </div>
        </article>

        {data.upcomingEvents.length > 0 ? (
          <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Agenda a venir
            </h2>
            <div className="mt-3 space-y-2">
              {data.upcomingEvents.slice(0, 5).map((event) => (
                <div key={event.id} className="rounded-xl border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                    {event.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {formatDateTime(event.date)} - {event.category}
                  </p>
                </div>
              ))}
            </div>
            <Link href="/member/evenements" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold hover:opacity-80" style={{ color: "rgba(230, 199, 115, 0.92)" }}>
              Voir le planning complet
              <ArrowUpRight size={14} />
            </Link>
          </article>
        ) : (
          <EmptyFeatureCard title="Agenda a venir" description="Les prochains evenements premium apparaitront ici des leur publication." icon={Clock3} />
        )}
      </section>

      <section className="rounded-2xl border p-5" style={{ borderColor: "rgba(212,175,55,0.22)", background: "linear-gradient(145deg, rgba(37,33,22,0.72), rgba(22,21,18,0.95))" }}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(239, 214, 145, 0.86)" }}>
              Concierge member
            </p>
            <h2 className="mt-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Acces prioritaire et support personnalise
            </h2>
            <p className="mt-2 text-sm" style={{ color: "rgba(223, 217, 201, 0.86)" }}>
              Besoin d'une recommandation, d'une mise en relation ou d'un suivi specifique? Le concierge te guide.
            </p>
          </div>
          <Link
            href="/member/notifications"
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition hover:-translate-y-[1px]"
            style={{ borderColor: "rgba(239, 214, 145, 0.45)", color: "rgba(245, 227, 179, 0.95)" }}
          >
            Ouvrir mon concierge
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <ComingSoonPanel
        items={["Board view mobile", "Resume hebdomadaire intelligent", "Mode pilotage en temps reel", "Recommandations IA avancees"]}
        title="Extensions premium a venir"
      />
    </MemberSurface>
  );
}
