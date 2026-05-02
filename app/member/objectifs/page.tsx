"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Flag,
  GraduationCap,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

function isSpotlightCategory(category?: string): boolean {
  return String(category || "").toLowerCase().includes("spotlight");
}

function formatMonthLabel(key: string): string {
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
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
  const [year] = key.split("-");
  return `${monthNames[monthIndex] || "Mois"} ${year}`;
}

function formatMonthShort(key: string): string {
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [year] = key.split("-");
  return `${short[monthIndex] || "?"} ${year}`;
}

function getLast12Months(): string[] {
  const now = new Date();
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - idx, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }).reverse();
}

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function objectiveMessage(current: number, target: number): string {
  const remaining = Math.max(0, target - current);
  const progress = progressPercent(current, target);
  if (remaining <= 0) return "Palier atteint pour cet axe — chapeau si tu le voulais.";
  if (remaining === 1) return "Plus qu’un petit pas de ton côté pour ce critère.";
  if (progress >= 75) return "Tu es déjà bien engagé·e sur cette ligne.";
  if (progress >= 40) return "La dynamique est là ; la suite viendra quand tu pourras.";
  return "Pas de stress : chaque présence ou raid compte, même espacé.";
}

function globalObjectiveMessage(score: number): string {
  if (score >= 100) return "Sur tes réglages actuels, tout est au vert — profite-en sans t’en faire une obligation.";
  if (score >= 80) return "Tu es tout près : quelques actions quand tu veux suffisent.";
  if (score >= 50) return "Mi-parcours sympathique — tu avances à ton rythme.";
  return "Le mois est vivant ; ce tableau sert à te repérer, pas à te juger.";
}

type GoalKey = "events" | "spotlight" | "raids" | "formations";
type GoalValidationMap = Record<string, Partial<Record<GoalKey, string>>>;
const GOALS_VALIDATION_STORAGE_KEY = "member-monthly-goals-validation-v1";

function readGoalValidationMap(): GoalValidationMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GOALS_VALIDATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as GoalValidationMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeGoalValidationMap(map: GoalValidationMap) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GOALS_VALIDATION_STORAGE_KEY, JSON.stringify(map));
}

const PRESETS = {
  douceur: { events: 3, spotlight: 1, raids: 4, formations: 1 },
  equilibre: { events: 6, spotlight: 2, raids: 8, formations: 2 },
  ambitieux: { events: 12, spotlight: 5, raids: 16, formations: 4 },
} as const;

export default function MemberGoalsPage() {
  const { data, loading, error: overviewError } = useMemberOverview();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const [validatedGoals, setValidatedGoals] = useState<Partial<Record<GoalKey, string>>>({});
  const [expandedGoal, setExpandedGoal] = useState<GoalKey | null>(null);
  const months = useMemo(() => getLast12Months(), []);
  const ringGid = useId();

  useEffect(() => {
    if (data?.monthKey) setSelectedMonth(data.monthKey);
  }, [data?.monthKey]);

  const { goals, updateGoals, resetGoals } = useMemberMonthlyGoals(selectedMonth);

  useEffect(() => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    setValidatedGoals(map[selectedMonth] || {});
  }, [selectedMonth]);

  useEffect(() => {
    if (!selectedMonth || !data?.member?.twitchLogin) return;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${selectedMonth}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: { raiderTwitchLogin?: string }) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === data.member!.twitchLogin.toLowerCase()
        );
        const total = mine.reduce((sum: number, raid: { count?: number }) => sum + (raid.count || 1), 0);
        setRaidsForMonth(total);
      } catch {
        setRaidsForMonth(0);
      }
    })();
  }, [selectedMonth, data?.member?.twitchLogin]);

  const selectedAttendance = data?.attendance?.monthlyHistory.find((entry) => entry.monthKey === selectedMonth) || null;
  const eventsCurrent = selectedAttendance?.attendedEvents || 0;

  const selectedMonthEvents =
    data?.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || [];
  const spotlightCurrent = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category) && event.attended).length;

  const formationsFromAttendance = (
    data?.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === selectedMonth)?.events || []
  ).filter((event) => event.attended && String(event.category || "").toLowerCase().includes("formation")).length;
  const formationsFallback =
    data?.stats?.formationsValidatedThisMonth ??
    (data?.formationHistory ?? []).filter((item) => (item.date ?? "").slice(0, 7) === (data?.monthKey ?? "")).length;
  const formationsCurrent = formationsFromAttendance > 0 ? formationsFromAttendance : formationsFallback;

  const eventsProgress = progressPercent(eventsCurrent, goals.events);
  const spotlightProgress = progressPercent(spotlightCurrent, goals.spotlight);
  const raidsProgress = progressPercent(raidsForMonth, goals.raids);
  const formationsProgress = progressPercent(formationsCurrent, goals.formations);
  const globalScore = Math.round((eventsProgress + spotlightProgress + raidsProgress + formationsProgress) / 4);
  const globalMessage = globalObjectiveMessage(globalScore);

  const objectives = [
    {
      key: "events" as const,
      label: "Présence événements",
      sub: "Hors obligation : ce qui compte, c’est ce que tu fixes toi-même.",
      current: eventsCurrent,
      target: goals.events,
      progress: eventsProgress,
      icon: CalendarDays,
      accent: "from-sky-500/30 to-indigo-600/15",
      border: "border-sky-400/35",
      hintHref: "/member/evenements",
      hintLabel: "Voir le planning événements",
    },
    {
      key: "spotlight" as const,
      label: "Spotlight",
      sub: "Les lives mis en avant dans le mois.",
      current: spotlightCurrent,
      target: goals.spotlight,
      progress: spotlightProgress,
      icon: Sparkles,
      accent: "from-fuchsia-500/25 to-violet-700/15",
      border: "border-fuchsia-400/35",
      hintHref: "/member/evenements/presences",
      hintLabel: "Mes présences & tendances",
    },
    {
      key: "raids" as const,
      label: "Raids TENF",
      sub: "Compteur mois depuis Discord — à titre indicatif.",
      current: raidsForMonth,
      target: goals.raids,
      progress: raidsProgress,
      icon: Zap,
      accent: "from-amber-500/25 to-orange-900/15",
      border: "border-amber-400/35",
      hintHref: "/member/raids/declarer",
      hintLabel: "Déclarer un raid",
    },
    {
      key: "formations" as const,
      label: "Formations",
      sub: "Selon ton activité ou ton historique sur la période.",
      current: formationsCurrent,
      target: goals.formations,
      progress: formationsProgress,
      icon: GraduationCap,
      accent: "from-emerald-500/25 to-teal-900/15",
      border: "border-emerald-400/35",
      hintHref: "/member/formations",
      hintLabel: "Espace formations",
    },
  ];

  const validatedCount = objectives.filter((objective) => Boolean(validatedGoals[objective.key])).length;
  const validationProgress = Math.round((validatedCount / objectives.length) * 100);

  const goalMaxByKey: Record<GoalKey, number> = {
    events: 30,
    spotlight: 20,
    raids: 40,
    formations: 20,
  };

  const handleValidateObjective = (goalKey: GoalKey) => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    const monthState = map[selectedMonth] || {};
    monthState[goalKey] = new Date().toISOString();
    map[selectedMonth] = monthState;
    writeGoalValidationMap(map);
    setValidatedGoals({ ...monthState });
  };

  const clearMonthValidations = () => {
    if (!selectedMonth) return;
    const map = readGoalValidationMap();
    map[selectedMonth] = {};
    writeGoalValidationMap(map);
    setValidatedGoals({});
  };

  const bumpTarget = (key: GoalKey, delta: number) => {
    const next = goals[key] + delta;
    updateGoals({ [key]: next });
  };

  if (!loading && overviewError) {
    return (
      <MemberSurface>
        <MemberPageHeader title="Mes objectifs mensuels" description="Impossible de charger tes données pour le moment." badge="Objectifs" />
        <section className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100">
          <p>{overviewError}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-950"
            onClick={() => window.location.reload()}
          >
            Réessayer
          </button>
        </section>
      </MemberSurface>
    );
  }

  if (loading || !data) {
    return (
      <MemberSurface>
        <MemberPageHeader
          title="Mes objectifs mensuels"
          description="Chargement de ton espace objectifs TENF…"
          badge="Objectifs"
        />
        <ObjectifsSkeleton />
      </MemberSurface>
    );
  }

  const monthOptions = months.slice().reverse();

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mes objectifs mensuels"
        description="Fixe des repères réalistes pour le mois : présences, spotlight, raids et formations. C’est un outil personnel pour te guider, pas une note scolaire ni une course contre les autres."
        badge="Personnalisable"
        extras={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/12 px-3 py-1 text-xs font-semibold text-violet-100">
            <Target className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            {formatMonthShort(selectedMonth || data.monthKey)}
          </span>
        }
      />

      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-3"
        aria-label="Raccourcis membre"
      >
        {[
          { href: "/member/evenements", label: "Événements" },
          { href: "/member/evenements/presences", label: "Présences" },
          { href: "/member/engagement/score", label: "Score engagement" },
          { href: "/member/formations", label: "Formations" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10"
          >
            {l.label}
            <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
        ))}
      </nav>

      <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-[#14101c] via-[#1a1530] to-[#0e0a12] p-5 shadow-xl md:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <GlobalScoreRing score={globalScore} gradientId={ringGid} />
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80">Synthèse du mois choisi</p>
              <p className="text-lg font-bold text-white">Progression globale · {globalScore}%</p>
              <p className="max-w-md text-sm leading-relaxed text-violet-100/85">{globalMessage}</p>
              <Link
                href="/member/engagement/score"
                className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-200 underline decoration-fuchsia-500/40 underline-offset-4 hover:text-white"
              >
                Croiser avec mon score de follows Twitch
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-semibold text-violet-200/90">Rythmes suggérés (tu peux tout modifier après)</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["douceur", "Tranquille", PRESETS.douceur],
                  ["equilibre", "Équilibré", PRESETS.equilibre],
                  ["ambitieux", "Plus présent·e", PRESETS.ambitieux],
                ] as const
              ).map(([id, label, preset]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => updateGoals({ ...preset })}
                  className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={resetGoals}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/5"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Valeurs TENF par défaut pour ce mois
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-slate-950/50 p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <label htmlFor="objectifs-month" className="text-sm font-medium text-slate-400">
              Mois édité
            </label>
            <select
              id="objectifs-month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white md:w-72"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatMonthLabel(month)}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">Les données affichées suivent le mois sélectionné.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {monthOptions.map((month) => (
            <button
              key={month}
              type="button"
              onClick={() => setSelectedMonth(month)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                selectedMonth === month
                  ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg"
                  : "border border-white/12 bg-white/5 text-slate-300 hover:bg-white/10"
              }`}
            >
              {formatMonthShort(month)}
            </button>
          ))}
        </div>

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-4 md:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Flag className="h-4 w-4 text-violet-400" aria-hidden />
              Avancement calculé
            </p>
            <p className="mt-1 text-xs text-slate-400">Selon tes présences, raids et formations du mois.</p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-500"
                style={{ width: `${globalScore}%` }}
              />
            </div>
          </div>
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden />
              Validations personnelles
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Coches quand tu considères un axe « validé » pour toi ({validatedCount}/{objectives.length}).
            </p>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${validationProgress}%` }}
              />
            </div>
            <button
              type="button"
              onClick={clearMonthValidations}
              className="mt-3 text-xs font-semibold text-violet-300 underline underline-offset-2 hover:text-white"
            >
              Effacer mes validations pour ce mois
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {objectives.map((objective) => {
            const isCompleted = objective.current >= objective.target;
            const validatedAt = validatedGoals[objective.key];
            const Icon = objective.icon;
            const expanded = expandedGoal === objective.key;

            return (
              <article
                key={objective.key}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${objective.accent} p-5 shadow-lg transition hover:border-white/20 ${objective.border}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl border border-white/15 bg-black/25 p-2.5 text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-bold text-white">{objective.label}</h3>
                      <p className="mt-0.5 text-xs text-slate-300/90">{objective.sub}</p>
                    </div>
                  </div>
                  {validatedAt ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold text-emerald-100">
                      <ShieldCheck className="h-3 w-3" aria-hidden />
                      Coché
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-2xl font-black tabular-nums text-white">
                    {objective.current}
                    <span className="text-base font-semibold text-violet-200/80"> / {objective.target}</span>
                  </span>
                  <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-semibold text-violet-100">
                    {objective.progress}%
                  </span>
                </div>

                <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-black/35">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isCompleted ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                    }`}
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-300">{objectiveMessage(objective.current, objective.target)}</p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium text-slate-400">Cible du mois</span>
                  <div className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/30">
                    <button
                      type="button"
                      aria-label="Diminuer"
                      className="p-2 text-white hover:bg-white/10 disabled:opacity-40"
                      disabled={goals[objective.key] <= (objective.key === "spotlight" ? 0 : 1)}
                      onClick={() => bumpTarget(objective.key, -1)}
                    >
                      <Minus className="h-4 w-4" aria-hidden />
                    </button>
                    <input
                      type="number"
                      min={objective.key === "spotlight" ? 0 : 1}
                      max={goalMaxByKey[objective.key]}
                      value={goals[objective.key]}
                      onChange={(event) => updateGoals({ [objective.key]: Number(event.target.value) })}
                      className="w-14 border-0 bg-transparent py-2 text-center text-sm font-bold text-white outline-none"
                    />
                    <button
                      type="button"
                      aria-label="Augmenter"
                      className="p-2 text-white hover:bg-white/10 disabled:opacity-40"
                      disabled={goals[objective.key] >= goalMaxByKey[objective.key]}
                      onClick={() => bumpTarget(objective.key, 1)}
                    >
                      <Plus className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedGoal(expanded ? null : objective.key)}
                  className="mt-4 flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs font-semibold text-violet-100 hover:bg-black/30"
                  aria-expanded={expanded}
                >
                  Idées pour avancer
                  <ChevronDown className={`h-4 w-4 shrink-0 transition ${expanded ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {expanded ? (
                  <div className="mt-2 space-y-2 rounded-xl border border-white/10 bg-black/25 p-3 text-xs text-slate-300">
                    <Link href={objective.hintHref} className="inline-flex items-center gap-2 font-semibold text-fuchsia-200 hover:text-white">
                      {objective.hintLabel}
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                    <p className="leading-relaxed">
                      Rappel : tes objectifs sont stockés sur ton appareil pour ce mois ; tu peux les ajuster quand tu veux,
                      sans justification.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
                  <span className="text-[11px] text-slate-500">
                    {validatedAt ? `Coché le ${new Date(validatedAt).toLocaleDateString("fr-FR")}` : "Pas encore coché"}
                  </span>
                  <button
                    type="button"
                    disabled={!isCompleted || Boolean(validatedAt)}
                    onClick={() => handleValidateObjective(objective.key)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Je valide pour moi
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </MemberSurface>
  );
}

function GlobalScoreRing({ score, gradientId }: { score: number; gradientId: string }) {
  const size = 120;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative flex h-[128px] w-[128px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`${gradientId}-obj`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId}-obj)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{score}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-200/75">global</span>
      </div>
    </div>
  );
}

function ObjectifsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-40 rounded-3xl bg-white/5" />
      <div className="h-24 rounded-2xl bg-white/5" />
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
