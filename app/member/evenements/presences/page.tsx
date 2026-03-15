"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, CalendarDays, ChevronRight, Flame, Star, Target, TrendingUp } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

type AttendanceEntry = {
  monthKey: string;
  totalEvents: number;
  attendedEvents: number;
  attendanceRate: number;
};

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function getTier(rate: number): { label: string; color: string } {
  if (rate >= 90) return { label: "Pilier", color: "#d4af37" };
  if (rate >= 75) return { label: "Engage", color: "#60a5fa" };
  if (rate >= 50) return { label: "Regulier", color: "#34d399" };
  if (rate >= 25) return { label: "Lancement", color: "#f59e0b" };
  return { label: "Demarrage", color: "#f87171" };
}

function getEncouragement(input: { rate: number; delta: number; remainingToTarget: number; totalEvents: number; targetEvents: number; attendedEvents: number }): string {
  const { rate, delta, remainingToTarget, totalEvents, targetEvents, attendedEvents } = input;
  if (totalEvents === 0) return "Aucun evenement termine ce mois. Des qu'un event est passe, ton suivi se mettra a jour.";
  if (attendedEvents >= targetEvents) return delta >= 0 ? "Excellent rythme. Tu maintiens un niveau premium ce mois-ci." : "Objectif atteint. Garde cette regularite jusqu'a la fin du mois.";
  if (remainingToTarget <= 0) return "Objectif quasiment verrouille. Encore un petit effort pour passer au palier suivant.";
  if (delta > 0) return `Bonne dynamique: +${delta}% vs mois precedent. Encore ${remainingToTarget} evenement(s) pour atteindre ton objectif.`;
  if (delta < 0) return `Legere baisse vs mois precedent (${delta}%). Tu peux corriger vite avec ${remainingToTarget} presence(s) supplementaire(s).`;
  return `Tu es stable. Vise ${remainingToTarget} presence(s) de plus pour atteindre ton objectif du mois.`;
}

function getRemainingToTarget(attendedEvents: number, targetEvents: number): number {
  return Math.max(0, targetEvents - attendedEvents);
}

function isSpotlightCategory(category: string): boolean {
  return category.toLowerCase().includes("spotlight");
}

function ProgressRing({ rate }: { rate: number }) {
  const clamped = Math.max(0, Math.min(100, rate));
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
          stroke="url(#presence-ring-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="presence-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
          Presence
        </p>
      </div>
    </div>
  );
}

export default function MemberEventPresencesPage() {
  const { data, loading, error } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"general" | "spotlight">("general");
  const history = data?.attendance?.monthlyHistory || [];
  const currentMonthKey = data?.attendance?.currentMonthKey || data?.monthKey || "";
  const { goals } = useMemberMonthlyGoals(selectedMonth || currentMonthKey);

  useEffect(() => {
    if (!selectedMonth) setSelectedMonth(currentMonthKey);
  }, [currentMonthKey, selectedMonth]);

  const selectedAttendance = useMemo<AttendanceEntry | null>(() => {
    if (!history.length) return null;
    return history.find((entry) => entry.monthKey === selectedMonth) || history[history.length - 1] || null;
  }, [history, selectedMonth]);

  const previousAttendance = useMemo<AttendanceEntry | null>(() => {
    if (!selectedAttendance) return null;
    const idx = history.findIndex((entry) => entry.monthKey === selectedAttendance.monthKey);
    if (idx <= 0) return null;
    return history[idx - 1];
  }, [history, selectedAttendance]);

  const selectedMonthEvents =
    data?.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedAttendance?.monthKey)?.events || [];

  const selectedCategoryBreakdown = useMemo(() => {
    const byCategory = new Map<string, { totalEvents: number; attendedEvents: number }>();
    for (const event of selectedMonthEvents) {
      const stats = byCategory.get(event.category) || { totalEvents: 0, attendedEvents: 0 };
      stats.totalEvents += 1;
      if (event.attended) stats.attendedEvents += 1;
      byCategory.set(event.category, stats);
    }
    return Array.from(byCategory.entries())
      .map(([category, value]) => ({
        category,
        totalEvents: value.totalEvents,
        attendedEvents: value.attendedEvents,
        attendanceRate: value.totalEvents > 0 ? Math.round((value.attendedEvents / value.totalEvents) * 100) : 0,
      }))
      .sort((a, b) => b.totalEvents - a.totalEvents || b.attendanceRate - a.attendanceRate);
  }, [selectedMonthEvents]);

  const spotlightEventHistory = useMemo(
    () =>
      (data?.attendance?.monthEventsByMonth || [])
        .flatMap((monthEntry) =>
          monthEntry.events
            .filter((event) => isSpotlightCategory(event.category))
            .map((event) => ({ ...event, monthKey: monthEntry.monthKey }))
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [data?.attendance?.monthEventsByMonth]
  );

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des presences...</p>;
  if (error || !data) return <EmptyFeatureCard title="Mes presences" description={error || "Donnees indisponibles."} />;

  if (!selectedAttendance) {
    return (
      <MemberSurface>
        <MemberPageHeader title="Mes presences" description="Suivi mensuel de tes participations aux evenements." />
        <EmptyFeatureCard title="Pas encore de donnees" description="Ton espace de suivi se remplira des que des evenements seront disponibles." />
      </MemberSurface>
    );
  }

  const attended = selectedAttendance.attendedEvents;
  const total = selectedAttendance.totalEvents;
  const rate = selectedAttendance.attendanceRate;
  const previousRate = previousAttendance?.attendanceRate ?? 0;
  const delta = rate - previousRate;
  const tier = getTier(rate);
  const remainingToTarget = getRemainingToTarget(attended, goals.events);
  const encouragement = getEncouragement({ rate, delta, remainingToTarget, totalEvents: total, targetEvents: goals.events, attendedEvents: attended });

  const sparklineData = history.filter((entry) => entry.totalEvents > 0 || entry.attendedEvents > 0).slice(-6);
  const maxRate = Math.max(1, ...sparklineData.map((entry) => entry.attendanceRate));
  const spotlightMonthEvents = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category));
  const spotlightAttended = spotlightMonthEvents.filter((event) => event.attended).length;
  const spotlightTotal = spotlightMonthEvents.length;
  const spotlightRate = spotlightTotal > 0 ? Math.round((spotlightAttended / spotlightTotal) * 100) : 0;
  const previousSpotlightMonthEvents =
    data.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === previousAttendance?.monthKey)?.events.filter((event) => isSpotlightCategory(event.category)) || [];
  const previousSpotlightRate =
    previousSpotlightMonthEvents.length > 0
      ? Math.round((previousSpotlightMonthEvents.filter((event) => event.attended).length / previousSpotlightMonthEvents.length) * 100)
      : 0;
  const spotlightDelta = spotlightRate - previousSpotlightRate;

  let spotlightStreak = 0;
  for (const event of spotlightEventHistory) {
    if (event.attended) {
      spotlightStreak += 1;
    } else {
      break;
    }
  }

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes presences" description="Un vrai espace de suivi premium, mois par mois." badge={tier.label} />

      <section className="rounded-xl border p-3 md:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-lg border p-1" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              style={{
                backgroundColor: activeTab === "general" ? "rgba(139,92,246,0.28)" : "transparent",
                color: activeTab === "general" ? "var(--color-text)" : "var(--color-text-secondary)",
              }}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("spotlight")}
              className="rounded-md px-3 py-1.5 text-sm font-semibold transition"
              style={{
                backgroundColor: activeTab === "spotlight" ? "rgba(240,201,107,0.22)" : "transparent",
                color: activeTab === "spotlight" ? "#f0c96b" : "var(--color-text-secondary)",
              }}
            >
              Spotlight
            </button>
          </div>

          <select
            value={selectedAttendance.monthKey}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(10,10,14,0.55)", color: "var(--color-text)" }}
          >
            {history
              .slice()
              .reverse()
              .map((entry) => (
                <option key={entry.monthKey} value={entry.monthKey}>
                  {formatMonthLabel(entry.monthKey)}
                </option>
              ))}
          </select>
        </div>
      </section>

      {activeTab === "general" ? (
        <>
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
                <ProgressRing rate={rate} />
                <div>
                  <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
                    Mon mois TENF
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                    {attended}/{total} evenements suivis en {formatMonthLabel(selectedAttendance.monthKey)}
                  </h2>
                  <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {encouragement}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:min-w-[280px]">
                <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.45)" }}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                          Objectif presences (depuis /member/objectifs)
                    </span>
                    <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {goals.events} presences
                    </span>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {remainingToTarget > 0 ? `Encore ${remainingToTarget} evenement(s) pour atteindre ton objectif.` : "Objectif atteint sur ce mois."}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Delta
                    </p>
                    <p className="text-sm font-semibold" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                      {delta >= 0 ? "+" : ""}
                      {delta}%
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Rang
                    </p>
                    <p className="text-sm font-semibold" style={{ color: tier.color }}>
                      {tier.label}
                    </p>
                  </div>
                  <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                    <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                      Mois
                    </p>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                      {history.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              <TrendingUp size={17} />
              Suivi par mois
            </h3>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {formatMonthLabel(selectedAttendance.monthKey)}
            </span>
          </div>

          <div className="space-y-3">
            {sparklineData.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Pas assez de donnees pour afficher la tendance.
              </p>
            ) : (
              sparklineData.map((entry) => (
                <div key={entry.monthKey}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>{formatMonthLabel(entry.monthKey)}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {entry.attendedEvents}/{entry.totalEvents} ({entry.attendanceRate}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(6, (entry.attendanceRate / maxRate) * 100)}%`,
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
            Repartition par categorie
          </h3>
          {selectedCategoryBreakdown.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Aucune categorie disponible sur ce mois.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedCategoryBreakdown.map((item) => (
                <div key={item.category} className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: "var(--color-text)" }}>{item.category}</span>
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      {item.attendedEvents}/{item.totalEvents}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.11)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${item.attendanceRate}%`,
                        backgroundColor: item.attendanceRate >= 70 ? "#34d399" : item.attendanceRate >= 40 ? "#f59e0b" : "#f87171",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
          </section>

          <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                <CalendarDays size={17} />
                Timeline du mois
              </h3>
              <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                <Flame size={14} />
                Vert = present, gris = absent
              </span>
            </div>
            {selectedMonthEvents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun evenement passe sur ce mois pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedMonthEvents.map((event) => (
                  <div
                    key={`${event.id}-${event.date}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                    style={{
                      borderColor: event.attended ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)",
                      backgroundColor: event.attended ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.01)",
                    }}
                  >
                    <div>
                      <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                      <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        {new Date(event.date).toLocaleString("fr-FR")} - {event.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.isKeyEvent ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs" style={{ borderColor: "rgba(240,201,107,0.45)", color: "#f0c96b" }}>
                          <Award size={12} />
                          Event cle
                        </span>
                      ) : null}
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                        style={{
                          borderColor: event.attended ? "rgba(52,211,153,0.45)" : "rgba(255,255,255,0.14)",
                          color: event.attended ? "#34d399" : "var(--color-text-secondary)",
                        }}
                      >
                        {event.attended ? "Present" : "Absent"}
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <section
          className="rounded-xl border p-5"
          style={{
            borderColor: "rgba(240,201,107,0.35)",
            background: "linear-gradient(145deg, rgba(240,201,107,0.08), rgba(17,17,22,0.95))",
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              <Star size={17} />
              Espace Spotlight (event phare)
            </h3>
            <span className="rounded-full border px-2 py-1 text-xs" style={{ borderColor: "rgba(240,201,107,0.45)", color: "#f0c96b" }}>
              Categorie Spotlight uniquement
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                Taux Spotlight
              </p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "#f0c96b" }}>
                {spotlightRate}%
              </p>
            </div>
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                Presence / objectif
              </p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {spotlightAttended}/{goals.spotlight}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                Delta vs mois precedent
              </p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: spotlightDelta >= 0 ? "#34d399" : "#f87171" }}>
                {spotlightDelta >= 0 ? "+" : ""}
                {spotlightDelta}%
              </p>
            </div>
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
              <p className="text-xs uppercase tracking-[0.08em]" style={{ color: "var(--color-text-secondary)" }}>
                Serie Spotlight
              </p>
              <p className="mt-1 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {spotlightStreak}
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {spotlightMonthEvents.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun Spotlight sur {formatMonthLabel(selectedAttendance.monthKey)}.
              </p>
            ) : (
              spotlightMonthEvents.map((event) => (
                <div
                  key={`${event.id}-${event.date}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: event.attended ? "rgba(240,201,107,0.35)" : "rgba(255,255,255,0.1)",
                    backgroundColor: event.attended ? "rgba(240,201,107,0.07)" : "rgba(255,255,255,0.01)",
                  }}
                >
                  <div>
                    <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(event.date).toLocaleString("fr-FR")}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      borderColor: event.attended ? "rgba(240,201,107,0.5)" : "rgba(255,255,255,0.16)",
                      color: event.attended ? "#f0c96b" : "var(--color-text-secondary)",
                    }}
                  >
                    {event.attended ? "Spotlight present" : "Spotlight absent"}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
              Historique Spotlight recent
            </p>
            {spotlightEventHistory.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Aucun evenement Spotlight enregistre pour le moment.
              </p>
            ) : (
              spotlightEventHistory.slice(0, 6).map((event) => (
                <div
                  key={`${event.id}-${event.date}-history`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                  style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(0,0,0,0.08)" }}
                >
                  <div>
                    <p style={{ color: "var(--color-text)" }}>{event.title}</p>
                    <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(event.date).toLocaleString("fr-FR")} - {formatMonthLabel(event.monthKey)}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{
                      borderColor: event.attended ? "rgba(240,201,107,0.5)" : "rgba(255,255,255,0.16)",
                      color: event.attended ? "#f0c96b" : "var(--color-text-secondary)",
                    }}
                  >
                    {event.attended ? "Spotlight present" : "Spotlight absent"}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </MemberSurface>
  );
}
