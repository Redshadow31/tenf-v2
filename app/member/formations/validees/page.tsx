"use client";

import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, CalendarDays, ChevronRight, Flame, Target, TrendingUp } from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

type FormationEntry = {
  id: string;
  title: string;
  date: string;
  category: string;
};

type MonthFormationHistory = {
  monthKey: string;
  validated: number;
};

function normalizeCategory(value?: string): string {
  return String(value || "").toLowerCase().trim();
}

function isFormationCategory(category?: string): boolean {
  return normalizeCategory(category).includes("formation");
}

function formatMonthLabel(key: string): string {
  const [year, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const monthNames = ["Janvier", "Fevrier", "Mars", "Avril", "Mai", "Juin", "Juillet", "Aout", "Septembre", "Octobre", "Novembre", "Decembre"];
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const date = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

function getTier(validatedCount: number): { label: string; color: string } {
  if (validatedCount >= 4) return { label: "Masterclass", color: "#d4af37" };
  if (validatedCount >= 3) return { label: "Pilier", color: "#60a5fa" };
  if (validatedCount >= 2) return { label: "Regulier", color: "#34d399" };
  if (validatedCount >= 1) return { label: "En route", color: "#f59e0b" };
  return { label: "Demarrage", color: "#f87171" };
}

function ProgressRing({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
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
          stroke="url(#formation-ring-gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="formation-ring-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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
          Objectif
        </p>
      </div>
    </div>
  );
}

export default function MemberValidatedFormationsPage() {
  const { data, loading, error } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const { goals } = useMemberMonthlyGoals(selectedMonth);

  useEffect(() => {
    const currentMonth = getLast12Months().slice(-1)[0] || "";
    setSelectedMonth(currentMonth);
  }, []);

  const formationsByMonth = useMemo(() => {
    if (!data) return new Map<string, FormationEntry[]>();

    const map = new Map<string, FormationEntry[]>();

    const attendanceByMonth = data.attendance?.monthEventsByMonth || [];
    for (const monthBlock of attendanceByMonth) {
      const formations = monthBlock.events
        .filter((event) => event.attended && isFormationCategory(event.category))
        .map((event) => ({
          id: event.id,
          title: event.title,
          date: event.date,
          category: event.category,
        }));
      if (formations.length > 0) {
        map.set(monthBlock.monthKey, formations);
      }
    }

    if (map.size === 0 && data.formationHistory?.length) {
      for (const item of data.formationHistory) {
        const monthKey = item.date.slice(0, 7);
        const existing = map.get(monthKey) || [];
        existing.push({
          id: item.id,
          title: item.title,
          date: item.date,
          category: "Formation",
        });
        map.set(monthKey, existing);
      }
    }

    return map;
  }, [data]);

  const selectedFormations = useMemo(
    () =>
      (formationsByMonth.get(selectedMonth) || [])
        .slice()
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [formationsByMonth, selectedMonth]
  );

  const monthlyHistory = useMemo<MonthFormationHistory[]>(() => {
    const months = getLast12Months();
    return months.map((monthKey) => ({
      monthKey,
      validated: (formationsByMonth.get(monthKey) || []).length,
    }));
  }, [formationsByMonth]);

  const totalValidated12Months = monthlyHistory.reduce((sum, item) => sum + item.validated, 0);
  const currentMonthValidated = selectedFormations.length;
  const previousMonthKey = (() => {
    if (!selectedMonth) return "";
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  })();
  const previousMonthValidated = (formationsByMonth.get(previousMonthKey) || []).length;
  const delta = currentMonthValidated - previousMonthValidated;
  const completionRate = goals.formations > 0 ? (currentMonthValidated / goals.formations) * 100 : 0;
  const remainingToTarget = Math.max(0, goals.formations - currentMonthValidated);
  const tier = getTier(currentMonthValidated);
  const sparklineData = monthlyHistory.filter((item) => item.validated > 0).slice(-6);
  const maxValidated = Math.max(1, ...sparklineData.map((item) => item.validated));

  if (loading) return <p style={{ color: "var(--color-text-secondary)" }}>Chargement des formations...</p>;
  if (error || !data) return <EmptyFeatureCard title="Mes formations validees" description={error || "Donnees indisponibles."} />;

  return (
    <MemberSurface>
      <MemberPageHeader title="Mes formations validees" description="Un espace premium pour suivre ta progression formation." badge={tier.label} />

      <section className="rounded-xl border p-3 md:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.14)" }}>
            <BookOpen size={16} style={{ color: "#f0c96b" }} />
            <span style={{ color: "var(--color-text-secondary)" }}>Suivi formations (12 mois)</span>
          </div>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--color-border)", backgroundColor: "rgba(10,10,14,0.55)", color: "var(--color-text)" }}
          >
            {getLast12Months()
              .slice()
              .reverse()
              .map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
          </select>
        </div>
      </section>

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
            <ProgressRing value={completionRate} />
            <div>
              <p className="text-xs uppercase tracking-[0.16em]" style={{ color: "rgba(240, 201, 107, 0.88)" }}>
                Mon mois formation
              </p>
              <h2 className="mt-2 text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
                {currentMonthValidated} formation(s) validee(s) en {formatMonthLabel(selectedMonth)}
              </h2>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {remainingToTarget > 0
                  ? `Encore ${remainingToTarget} formation(s) pour atteindre ton objectif.`
                  : "Objectif atteint. Continue pour renforcer ton parcours Academy."}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 xl:min-w-[280px]">
            <div className="rounded-xl border px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.45)" }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Objectif formations (depuis /member/objectifs)
                </span>
                <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {goals.formations} formations
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Modifie cet objectif depuis la page Objectifs pour garder la meme valeur partout.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Delta
                </p>
                <p className="text-sm font-semibold" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Mois suivis
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {monthlyHistory.length}
                </p>
              </div>
              <div className="rounded-lg border px-3 py-2" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  Total 12m
                </p>
                <p className="text-sm font-semibold" style={{ color: "#60a5fa" }}>
                  {totalValidated12Months}
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
              Tendance mensuelle
            </h3>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              12 derniers mois
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
                    <span style={{ color: "var(--color-text-secondary)" }}>{entry.validated} validee(s)</span>
                  </div>
                  <div className="h-2.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(8, (entry.validated / maxValidated) * 100)}%`,
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
            Objectifs formation
          </h3>
          <div className="space-y-2">
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Progression du mois
              </p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {currentMonthValidated}/{goals.formations}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Statut actuel
              </p>
              <p className="mt-1 text-xl font-semibold" style={{ color: tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="rounded-lg border px-3 py-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Total valide depuis le debut
              </p>
              <p className="mt-1 text-xl font-semibold" style={{ color: "var(--color-text)" }}>
                {data.stats.formationsValidated}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold" style={{ color: "var(--color-text)" }}>
            <CalendarDays size={17} />
            Timeline des formations du mois
          </h3>
          <span className="inline-flex items-center gap-1 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            <Flame size={14} />
            Presences validees en formation
          </span>
        </div>
        {selectedFormations.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            Aucune formation validee sur {formatMonthLabel(selectedMonth)}.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedFormations.map((item, index) => (
              <div
                key={`${item.id}-${item.date}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
                style={{
                  borderColor: "rgba(52,211,153,0.35)",
                  backgroundColor: "rgba(52,211,153,0.08)",
                }}
              >
                <div>
                  <p style={{ color: "var(--color-text)" }}>{item.title}</p>
                  <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    {new Date(item.date).toLocaleString("fr-FR")} - {item.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs" style={{ borderColor: "rgba(240,201,107,0.45)", color: "#f0c96b" }}>
                    <Award size={12} />
                    Validee
                  </span>
                  <span
                    className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold"
                    style={{ borderColor: "rgba(52,211,153,0.45)", color: "#34d399" }}
                  >
                    OK
                    <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </MemberSurface>
  );
}
