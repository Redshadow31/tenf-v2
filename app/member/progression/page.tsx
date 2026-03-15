"use client";

import { useMemo } from "react";
import { Award, CalendarDays, ChevronRight, Rocket, Target, TrendingUp } from "lucide-react";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import ProgressGoalCard from "@/components/member/ui/ProgressGoalCard";
import MemberSurface from "@/components/member/ui/MemberSurface";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

function getTier(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite TENF", color: "#d4af37" };
  if (score >= 75) return { label: "Pilier", color: "#60a5fa" };
  if (score >= 55) return { label: "Regulier", color: "#34d399" };
  if (score >= 35) return { label: "En progression", color: "#f59e0b" };
  return { label: "Demarrage", color: "#f87171" };
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function ProgressRing({ value }: { value: number }) {
  const clamped = clampPercent(value);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="12" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="url(#progression-ring-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="progression-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold" style={{ color: "var(--color-text)" }}>
          {clamped}%
        </p>
        <p className="text-xs uppercase tracking-[0.15em]" style={{ color: "var(--color-text-secondary)" }}>
          Progression
        </p>
      </div>
    </div>
  );
}

export default function MemberProgressionPage() {
  const { data, loading, error } = useMemberOverview();
  const monthKey = data?.monthKey || "";
  const { goals } = useMemberMonthlyGoals(monthKey);

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement de ta progression...</p>;
  if (error || !data) return <EmptyFeatureCard title="Ma progression" description={error || "Donnees indisponibles."} />;

  const formationsThisMonth =
    data.stats.formationsValidatedThisMonth ??
    data.formationHistory.filter((item) => item.date.slice(0, 7) === monthKey).length;

  const raidsRatio = clampPercent((data.stats.raidsThisMonth / Math.max(1, goals.raids)) * 100);
  const eventsRatio = clampPercent((data.stats.eventPresencesThisMonth / Math.max(1, goals.events)) * 100);
  const formationsRatio = clampPercent((formationsThisMonth / Math.max(1, goals.formations)) * 100);
  const profileRatio = clampPercent(data.profile.percent);
  const totalScore = Math.round((raidsRatio + eventsRatio + formationsRatio + profileRatio) / 4);
  const tier = getTier(totalScore);

  const monthlyHistory = data.attendance?.monthlyHistory || [];
  const trendData = monthlyHistory.filter((entry) => entry.totalEvents > 0 || entry.attendedEvents > 0).slice(-6);
  const maxAttendance = Math.max(1, ...trendData.map((entry) => entry.attendedEvents));

  const recentMoments = useMemo(() => {
    const formations = (data.formationHistory || []).map((item) => ({
      type: "formation" as const,
      id: `formation-${item.id}-${item.date}`,
      title: item.title,
      date: item.date,
      subtitle: "Formation validee",
    }));

    const presences = (data.eventPresenceHistory || []).map((item) => ({
      type: "presence" as const,
      id: `presence-${item.id}-${item.date}`,
      title: item.title,
      date: item.date,
      subtitle: item.category || "Evenement",
    }));

    return [...formations, ...presences]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [data.eventPresenceHistory, data.formationHistory]);

  return (
    <MemberSurface>
      <MemberPageHeader title="Ma progression" description="Une vue claire et premium de ton evolution membre." badge={tier.label} />

      <section
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.16), rgba(25,25,31,0.96) 42%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.24)",
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <ProgressRing value={totalScore} />
            <div>
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
                Score global du mois
              </p>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {totalScore}% de tes objectifs atteints
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Mois suivi: {formatMonthLabel(monthKey)} - continue sur ce rythme pour consolider ton niveau.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-[300px]">
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.45)" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Participation totale du mois
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {data.stats.participationThisMonth}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Raids
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {data.stats.raidsThisMonth}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Presences
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {data.stats.eventPresencesThisMonth}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Formations
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {formationsThisMonth}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <ProgressGoalCard label="Objectif raids du mois" current={data.stats.raidsThisMonth} target={goals.raids} />
        <ProgressGoalCard label="Objectif presences du mois" current={data.stats.eventPresencesThisMonth} target={goals.events} />
        <ProgressGoalCard label="Objectif formations du mois" current={formationsThisMonth} target={goals.formations} />
        <ProgressGoalCard label="Profil complet" current={data.profile.percent} target={100} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              <TrendingUp size={17} />
              Tendance de presence
            </h3>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              6 derniers mois
            </span>
          </div>
          <div className="space-y-3">
            {trendData.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Pas assez de donnees pour afficher ta tendance.
              </p>
            ) : (
              trendData.map((entry) => (
                <div key={entry.monthKey}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>{formatMonthLabel(entry.monthKey)}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {entry.attendedEvents}/{entry.totalEvents}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(8, (entry.attendedEvents / maxAttendance) * 100)}%`,
                        background: "linear-gradient(90deg, rgba(240,201,107,0.9), rgba(139,92,246,0.85))",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            <Target size={17} />
            Prochains jalons
          </h3>
          <div className="space-y-2">
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Raids pour atteindre l objectif
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {Math.max(0, goals.raids - data.stats.raidsThisMonth)} restant(s)
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Presences pour atteindre l objectif
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {Math.max(0, goals.events - data.stats.eventPresencesThisMonth)} restant(s)
              </p>
            </div>
            <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Formations pour atteindre l objectif
              </p>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                {Math.max(0, goals.formations - formationsThisMonth)} restante(s)
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            <CalendarDays size={17} />
            Prochains evenements
          </h3>
          {data.upcomingEvents.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucun evenement a venir pour le moment.
            </p>
          ) : (
            <div className="space-y-2">
              {data.upcomingEvents.slice(0, 6).map((event) => (
                <div key={`${event.id}-${event.date}`} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                  <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                  </p>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            <Award size={17} />
            Moments recents
          </h3>
          {recentMoments.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Pas encore d activite recente a afficher.
            </p>
          ) : (
            <div className="space-y-2">
              {recentMoments.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: item.type === "formation" ? "rgba(240,201,107,0.35)" : "rgba(52,211,153,0.35)",
                    backgroundColor: item.type === "formation" ? "rgba(240,201,107,0.06)" : "rgba(52,211,153,0.06)",
                  }}
                >
                  <div>
                    <p style={{ color: "var(--color-text)" }}>{item.title}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {item.subtitle} - {new Date(item.date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      borderColor: item.type === "formation" ? "rgba(240,201,107,0.45)" : "rgba(52,211,153,0.45)",
                      color: item.type === "formation" ? "#f0c96b" : "#34d399",
                    }}
                  >
                    {item.type === "formation" ? <Rocket size={12} /> : <ChevronRight size={12} />}
                    {item.type === "formation" ? "Formation" : "Presence"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </MemberSurface>
  );
}
