"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  ChevronRight,
  ExternalLink,
  Flame,
  GraduationCap,
  Target,
  TrendingUp,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import EmptyFeatureCard from "@/components/member/ui/EmptyFeatureCard";
import FormationsSubnav from "@/components/member/formations/FormationsSubnav";
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
  const [, month] = key.split("-");
  const monthNames = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const year = key.split("-")[0];
  const monthIndex = Number(month) - 1;
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function formatMonthShort(key: string): string {
  const [year, month] = key.split("-");
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const i = Number(month) - 1;
  return `${short[i] || "mois"} ${year}`;
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
  if (validatedCount >= 2) return { label: "Régulier", color: "#34d399" };
  if (validatedCount >= 1) return { label: "En route", color: "#f59e0b" };
  return { label: "Démarrage", color: "#f87171" };
}

function ProgressRing({ value }: { value: number }) {
  const reactId = useId().replace(/:/g, "");
  const gradId = `formation-ring-gradient-${reactId}`;
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 140 140" className="h-36 w-36 -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.14)" strokeWidth="12" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f0c96b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
          {clamped}%
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.15em]" style={{ color: "var(--color-text-secondary)" }}>
          Objectif
        </p>
      </div>
    </div>
  );
}

function ValideesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse" aria-hidden>
      <div className="h-16 rounded-xl bg-white/5" />
      <div className="h-48 rounded-2xl bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 rounded-xl bg-white/5" />
        <div className="h-40 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export default function MemberFormationsValidees() {
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

  const monthOptions = useMemo(() => getLast12Months().slice().reverse(), []);

  if (loading) {
    return (
      <MemberSurface>
        <FormationsSubnav />
        <MemberPageHeader
          title="Mes formations validées"
          description="Chargement de ton historique de présences et de tes objectifs…"
          badge="Academy TENF"
        />
        <ValideesSkeleton />
      </MemberSurface>
    );
  }

  if (error || !data) {
    return (
      <MemberSurface>
        <FormationsSubnav />
        <MemberPageHeader title="Mes formations validées" description="Suivi des présences validées en formation." badge="Academy TENF" />
        <EmptyFeatureCard title="Mes formations validées" description={error || "Données indisponibles."} />
      </MemberSurface>
    );
  }

  return (
    <MemberSurface>
      <FormationsSubnav />

      <MemberPageHeader
        title="Mes formations validées"
        description="Vue motivante sur ce que tu as déjà validé : objectif du mois, paliers et tendance. Les données reposent sur tes présences enregistrées côté TENF."
        badge={tier.label}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/member/formations"
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-violet-500/35 hover:bg-violet-500/5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <GraduationCap className="h-5 w-5 shrink-0 text-violet-200/90" />
          <span className="min-w-0 text-sm font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Retour au catalogue & sessions
          </span>
          <ArrowRight className="ml-auto h-4 w-4 shrink-0 opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
        </Link>
        <Link
          href="/member/objectifs"
          className="group flex items-center gap-3 rounded-xl border p-3 transition hover:border-violet-500/35 hover:bg-violet-500/5"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <Target className="h-5 w-5 shrink-0 text-emerald-200/90" />
          <span className="min-w-0 text-sm font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
            Ajuster l’objectif « formations » du mois
          </span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100" />
        </Link>
      </div>

      <section
        className="rounded-2xl border p-4 md:p-5"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <BookOpen size={16} className="shrink-0 text-amber-200/90" aria-hidden />
            <span className="leading-snug break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
              Mois analysé (12 mois glissants)
            </span>
          </div>
          <label className="sr-only" htmlFor="formation-month-select">
            Choisir un mois
          </label>
          <select
            id="formation-month-select"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm sm:max-w-xs sm:self-end"
            style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-bg)", color: "var(--color-text)" }}
          >
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4" role="tablist" aria-label="Sélection rapide du mois">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
            Raccourcis
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {monthOptions.map((month) => {
              const active = month === selectedMonth;
              const count = (formationsByMonth.get(month) || []).length;
              return (
                <button
                  key={month}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedMonth(month)}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                    active ? "ring-2 ring-violet-400/40" : "hover:border-violet-400/30"
                  }`}
                  style={{
                    borderColor: active ? "rgba(139,92,246,0.5)" : "var(--color-border)",
                    backgroundColor: active ? "rgba(139,92,246,0.15)" : "var(--color-bg)",
                    color: "var(--color-text)",
                  }}
                >
                  <span className="block whitespace-nowrap">{formatMonthShort(month)}</span>
                  <span className="mt-0.5 block text-[10px] font-normal tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                    {count} validée{count > 1 ? "s" : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: "rgba(212, 175, 55, 0.35)",
          background: "radial-gradient(circle at 12% 18%, rgba(212,175,55,0.14), var(--color-card) 46%)",
          boxShadow: "0 18px 36px rgba(0,0,0,0.18)",
        }}
      >
        <div
          className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden
        />
        <div className="relative z-[1] flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <ProgressRing value={completionRate} />
            <div className="min-w-0 text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-200/90">Mon mois formation</p>
              <h2 className="mt-2 text-xl font-bold leading-snug break-words text-pretty sm:text-2xl" style={{ color: "var(--color-text)" }}>
                {currentMonthValidated} formation{currentMonthValidated > 1 ? "s" : ""} validée
                {currentMonthValidated > 1 ? "s" : ""} en {formatMonthLabel(selectedMonth)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                {remainingToTarget > 0
                  ? `Encore ${remainingToTarget} formation(s) pour atteindre ton objectif du mois.`
                  : "Objectif atteint : tu peux viser plus haut depuis la page Objectifs."}
              </p>
              <p className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: `${tier.color}55`, color: tier.color }}>
                Palier actuel : {tier.label}
              </p>
            </div>
          </div>

          <div className="grid min-w-0 gap-3 lg:max-w-sm">
            <div
              className="rounded-xl border px-4 py-3 transition hover:border-violet-400/25"
              style={{ borderColor: "rgba(255,255,255,0.12)", backgroundColor: "rgba(12,12,15,0.25)" }}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm leading-snug break-words" style={{ color: "var(--color-text-secondary)" }}>
                  Objectif formations (page Objectifs)
                </span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--color-text)" }}>
                  {goals.formations} / mois
                </span>
              </div>
              <p className="text-xs leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                La même valeur est utilisée partout sur le site pour rester cohérent.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border px-2 py-2.5 transition hover:border-white/15" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  Delta
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: delta >= 0 ? "#34d399" : "#f87171" }}>
                  {delta >= 0 ? "+" : ""}
                  {delta}
                </p>
              </div>
              <div className="rounded-xl border px-2 py-2.5 transition hover:border-white/15" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  Mois suivis
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                  {monthlyHistory.length}
                </p>
              </div>
              <div className="rounded-xl border px-2 py-2.5 transition hover:border-white/15" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
                <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--color-text-secondary)" }}>
                  Total 12 m.
                </p>
                <p className="mt-1 text-sm font-bold tabular-nums text-sky-300">
                  {totalValidated12Months}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-text)" }}>
              <TrendingUp size={18} aria-hidden />
              Tendance mensuelle
            </h3>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              6 derniers mois avec activité
            </span>
          </div>

          <div className="space-y-4">
            {sparklineData.length === 0 ? (
              <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                Pas encore assez de formations validées pour dessiner une tendance — inscris-toi aux prochaines sessions
                depuis le catalogue.
              </p>
            ) : (
              sparklineData.map((entry) => (
                <div key={entry.monthKey}>
                  <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                    <span className="break-words font-medium" style={{ color: "var(--color-text)" }}>
                      {formatMonthLabel(entry.monthKey)}
                    </span>
                    <span className="shrink-0 tabular-nums" style={{ color: "var(--color-text-secondary)" }}>
                      {entry.validated} validée{entry.validated > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(10, (entry.validated / maxValidated) * 100)}%`,
                        background: "linear-gradient(90deg, rgba(240,201,107,0.95), rgba(139,92,246,0.9))",
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl border p-5" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-text)" }}>
            <Target size={18} aria-hidden />
            Synthèse
          </h3>
          <div className="space-y-3">
            <div className="rounded-xl border px-3 py-3 transition hover:border-violet-400/20" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Progression du mois choisi
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {currentMonthValidated}/{goals.formations}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3 transition hover:border-violet-400/20" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Palier affiché en en-tête
              </p>
              <p className="mt-1 text-2xl font-bold" style={{ color: tier.color }}>
                {tier.label}
              </p>
            </div>
            <div className="rounded-xl border px-3 py-3 transition hover:border-violet-400/20" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                Total validé (historique global)
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: "var(--color-text)" }}>
                {data.stats.formationsValidated}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border p-5 md:p-6" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-lg font-bold" style={{ color: "var(--color-text)" }}>
            <CalendarDays size={18} aria-hidden />
            Formations du mois sélectionné
          </h3>
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}>
            <Flame size={14} className="text-orange-300" aria-hidden />
            Présences validées
          </span>
        </div>
        {selectedFormations.length === 0 ? (
          <p className="text-sm leading-relaxed break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
            Aucune formation validée sur {formatMonthLabel(selectedMonth)}. Change de mois avec les pastilles ou la liste
            déroulante, ou consulte le catalogue pour t’inscrire aux prochaines dates.
          </p>
        ) : (
          <ul className="space-y-3">
            {selectedFormations.map((item, index) => (
              <li key={`${item.id}-${item.date}-${index}`}>
                <div
                  className="flex flex-col gap-3 rounded-xl border px-4 py-3 transition hover:border-emerald-400/35 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
                  style={{
                    borderColor: "rgba(52,211,153,0.35)",
                    backgroundColor: "rgba(52,211,153,0.07)",
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug break-words text-pretty" style={{ color: "var(--color-text)" }}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm break-words text-pretty" style={{ color: "var(--color-text-secondary)" }}>
                      {new Date(item.date).toLocaleString("fr-FR")} — {item.category}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium"
                      style={{ borderColor: "rgba(240,201,107,0.45)", color: "#f0c96b" }}
                    >
                      <Award size={12} aria-hidden />
                      Validée
                    </span>
                    <span
                      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold"
                      style={{ borderColor: "rgba(52,211,153,0.45)", color: "#34d399" }}
                    >
                      OK
                      <ChevronRight size={12} aria-hidden />
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </MemberSurface>
  );
}
