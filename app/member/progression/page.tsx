"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarDays,
  ChevronDown,
  Compass,
  ExternalLink,
  GraduationCap,
  LayoutGrid,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  UserCircle2,
  Zap,
} from "lucide-react";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import MemberSurface from "@/components/member/ui/MemberSurface";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";

function isSpotlightCategory(category?: string): boolean {
  return String(category || "").toLowerCase().includes("spotlight");
}

function formatMonthShort(key: string): string {
  if (!key) return "";
  const [, month] = key.split("-");
  const monthIndex = Number(month) - 1;
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const [year] = key.split("-");
  return `${short[monthIndex] || "?"} ${year}`;
}

function formatMonthLabel(key: string): string {
  if (!key) return "";
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

function progressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

function globalObjectiveMessage(score: number): string {
  if (score >= 100) return "Sur tes objectifs du mois, tout est au vert — profite du moment sans t’en faire une contrainte.";
  if (score >= 80) return "Tu es tout près du tableau idéal : quelques présences ou raids quand tu veux, et c’est bouclé.";
  if (score >= 50) return "Mi-parcours tout à fait honorable — chaque petit geste compte dans la communauté.";
  return "Le mois est encore ouvert : cette vue sert à te repérer, pas à te noter.";
}

function getEngagementTier(score: number): { label: string; sub: string } {
  if (score >= 95) return { label: "Rayonnement TENF", sub: "Une présence qui se voit — merci pour l’élan collectif." };
  if (score >= 75) return { label: "Très engagé·e", sub: "Tu nourris la communauté avec régularité." };
  if (score >= 50) return { label: "En belle dynamique", sub: "Tu trouves ton équilibre entre vie perso et TENF." };
  if (score >= 25) return { label: "En découverte", sub: "Les premiers pas comptent autant que les grands rushs." };
  return { label: "À ton rythme", sub: "Il n’y a pas de minimum pour appartenir au collectif." };
}

function formatIsoDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

const EMPTY_STATS = {
  raidsThisMonth: 0,
  raidsTotal: 0,
  eventPresencesThisMonth: 0,
  participationThisMonth: 0,
  formationsValidated: 0,
  formationsValidatedThisMonth: 0,
};

type TabId = "overview" | "trend" | "activity";

type MomentItem = {
  id: string;
  kind: "formation" | "presence";
  title: string;
  date: string;
  category?: string;
};

export default function MemberProgressionPage() {
  const { data, loading, error: overviewError } = useMemberOverview();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<string | null>(null);
  const [expandedMomentId, setExpandedMomentId] = useState<string | null>(null);
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const ringGid = useId();

  const monthKey = data?.monthKey ?? "";
  const { goals } = useMemberMonthlyGoals(monthKey);

  useEffect(() => {
    if (!monthKey || !data?.member?.twitchLogin) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/discord/raids/data-v2?month=${monthKey}`, { cache: "no-store" });
        const body = await response.json();
        const mine = (body.raidsFaits || []).filter(
          (raid: { raiderTwitchLogin?: string }) =>
            String(raid.raiderTwitchLogin || "").toLowerCase() === data.member!.twitchLogin.toLowerCase()
        );
        const total = mine.reduce((sum: number, raid: { count?: number }) => sum + (raid.count || 1), 0);
        if (!cancelled) setRaidsForMonth(total);
      } catch {
        if (!cancelled) setRaidsForMonth(0);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [monthKey, data?.member?.twitchLogin]);

  const stats = data?.stats ?? EMPTY_STATS;
  const profile = data?.profile ?? { completed: false, percent: 0 };

  const selectedAttendance = data?.attendance?.monthlyHistory.find((entry) => entry.monthKey === monthKey) || null;
  const eventsCurrent = selectedAttendance?.attendedEvents ?? stats.eventPresencesThisMonth ?? 0;

  const selectedMonthEvents =
    data?.attendance?.monthEventsByMonth.find((entry) => entry.monthKey === monthKey)?.events ?? [];
  const spotlightCurrent = selectedMonthEvents.filter((event) => isSpotlightCategory(event.category) && event.attended).length;

  const formationsFromAttendance = selectedMonthEvents.filter(
    (event) => event.attended && String(event.category || "").toLowerCase().includes("formation")
  ).length;
  const formationsFallback =
    stats.formationsValidatedThisMonth ??
    (data?.formationHistory ?? []).filter((item) => (item.date ?? "").slice(0, 7) === monthKey).length;
  const formationsCurrent = formationsFromAttendance > 0 ? formationsFromAttendance : formationsFallback;

  const raidsCurrent = raidsForMonth > 0 ? raidsForMonth : stats.raidsThisMonth ?? 0;

  const eventsProgress = progressPercent(eventsCurrent, goals.events);
  const spotlightProgress = progressPercent(spotlightCurrent, goals.spotlight);
  const raidsProgress = progressPercent(raidsCurrent, goals.raids);
  const formationsProgress = progressPercent(formationsCurrent, goals.formations);
  const globalScore = Math.round((eventsProgress + spotlightProgress + raidsProgress + formationsProgress) / 4);
  const globalMessage = globalObjectiveMessage(globalScore);
  const tier = getEngagementTier(globalScore);

  const monthlyHistory = data?.attendance?.monthlyHistory ?? [];

  const moments = useMemo((): MomentItem[] => {
    const formations: MomentItem[] = (data?.formationHistory ?? []).map((item) => ({
      id: `f-${item.id}`,
      kind: "formation" as const,
      title: item.title,
      date: item.date,
    }));
    const presences: MomentItem[] = (data?.eventPresenceHistory ?? []).map((item) => ({
      id: `p-${item.id}`,
      kind: "presence" as const,
      title: item.title,
      date: item.date,
      category: item.category,
    }));
    return [...formations, ...presences].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 14);
  }, [data?.formationHistory, data?.eventPresenceHistory]);

  const upcoming = data?.upcomingEvents ?? [];

  const trendHighlight = selectedTrendMonth
    ? monthlyHistory.find((m) => m.monthKey === selectedTrendMonth)
    : monthlyHistory[monthlyHistory.length - 1];

  const goalTiles = [
    {
      key: "events",
      label: "Événements",
      sub: "Présences comptées ce mois",
      current: eventsCurrent,
      target: goals.events,
      pct: eventsProgress,
      icon: CalendarDays,
      href: "/member/evenements",
      accent: "from-sky-500/20 to-indigo-900/20",
      border: "border-sky-400/30",
    },
    {
      key: "spotlight",
      label: "Spotlight",
      sub: "Lives mis en avant suivis",
      current: spotlightCurrent,
      target: goals.spotlight,
      pct: spotlightProgress,
      icon: Sparkles,
      href: "/member/evenements/presences",
      accent: "from-fuchsia-500/20 to-violet-900/20",
      border: "border-fuchsia-400/30",
    },
    {
      key: "raids",
      label: "Raids",
      sub: "Discord (mois en cours)",
      current: raidsCurrent,
      target: goals.raids,
      pct: raidsProgress,
      icon: Zap,
      href: "/member/raids/declarer",
      accent: "from-amber-500/20 to-orange-950/30",
      border: "border-amber-400/30",
    },
    {
      key: "formations",
      label: "Formations",
      sub: "Validées sur la période",
      current: formationsCurrent,
      target: goals.formations,
      pct: formationsProgress,
      icon: GraduationCap,
      href: "/member/formations",
      accent: "from-emerald-500/20 to-teal-950/25",
      border: "border-emerald-400/30",
    },
  ];

  if (!loading && overviewError) {
    return (
      <MemberSurface>
        <MemberPageHeader title="Ma progression" description="Impossible de charger tes données pour le moment." badge="Progression" />
        <section className="rounded-2xl border border-red-500/35 bg-red-950/30 p-6 text-center text-sm text-red-100">
          <p>{overviewError}</p>
          <button
            type="button"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-red-950"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
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
          title="Ma progression"
          description="Chargement de ton parcours TENF…"
          badge="Progression"
        />
        <ProgressionSkeleton />
      </MemberSurface>
    );
  }

  const displayName = data.member.displayName || data.member.twitchLogin || "Membre TENF";

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Ma progression"
        description="Une vue vivante de ton mois : présences, raids, formations et tendances. Les chiffres t’aident à te situer ; ils ne définissent pas ta place dans la communauté."
        badge="Espace membre"
        extras={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/12 px-3 py-1 text-xs font-semibold text-cyan-100">
            <Compass className="h-3.5 w-3.5 text-amber-300" aria-hidden />
            {formatMonthShort(monthKey)}
          </span>
        }
      />

      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-3"
        aria-label="Raccourcis progression"
      >
        {[
          { href: "/member/objectifs", label: "Ajuster mes objectifs" },
          { href: "/member/formations", label: "Formations" },
          { href: "/member/evenements", label: "Planning événements" },
          { href: "/member/evenements/presences", label: "Mes présences" },
          { href: "/member/academy", label: "Academy" },
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

      <section className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-[#120c18] via-[#1a1428] to-[#0a0810] p-5 shadow-2xl md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ProgressionScoreRing score={globalScore} gradientId={ringGid} />
            <div className="max-w-xl space-y-3 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/75">Synthèse du mois</p>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                Salut {displayName.split(" ")[0]} — {tier.label}
              </h2>
              <p className="text-sm leading-relaxed text-violet-100/85">{tier.sub}</p>
              <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200/95">{globalMessage}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                  <Award className="h-3.5 w-3.5" aria-hidden />
                  {stats.raidsTotal ?? 0} raids cumulés
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold text-sky-100">
                  <Rocket className="h-3.5 w-3.5" aria-hidden />
                  {stats.formationsValidated ?? 0} formations au total
                </span>
                <Link
                  href="/member/profil"
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/20"
                >
                  <UserCircle2 className="h-3.5 w-3.5" aria-hidden />
                  Profil {profile.completed ? `${profile.percent}%` : "à compléter"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2"
          role="tablist"
          aria-label="Sections progression"
        >
          {(
            [
              { id: "overview" as const, label: "Vue globale", Icon: LayoutGrid },
              { id: "trend" as const, label: "Tendance présences", Icon: TrendingUp },
              { id: "activity" as const, label: "Fil & agenda", Icon: CalendarDays },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition sm:flex-none sm:px-5 ${
                activeTab === id
                  ? "bg-gradient-to-r from-violet-600/90 to-fuchsia-600/80 text-white shadow-lg shadow-violet-900/40"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="mt-6 space-y-6">
            <p className="text-center text-xs text-slate-400 sm:text-left">
              Les objectifs affichés sont ceux que tu as réglés dans{" "}
              <Link href="/member/objectifs" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
                Mes objectifs
              </Link>
              .
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {goalTiles.map((tile) => {
                const Icon = tile.icon;
                return (
                  <Link
                    key={tile.key}
                    href={tile.href}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${tile.accent} ${tile.border} p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">{tile.label}</p>
                        <p className="mt-1 text-lg font-bold text-white">
                          {tile.current}
                          <span className="text-sm font-medium text-white/50"> / {tile.target}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-white/60">{tile.sub}</p>
                      </div>
                      <Icon className="h-8 w-8 shrink-0 text-white/40 transition group-hover:text-white/70" aria-hidden />
                    </div>
                    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-full rounded-full bg-white/90 transition-all duration-500"
                        style={{ width: `${tile.pct}%` }}
                      />
                    </div>
                    <p className="mt-2 flex items-center justify-between text-[11px] font-medium text-white/65">
                      <span>{tile.pct}%</span>
                      <span className="inline-flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                        Ouvrir <ExternalLink className="h-3 w-3" aria-hidden />
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "trend" && (
          <div className="mt-6 space-y-6">
            <p className="text-sm text-slate-300">
              Clique un mois pour voir le détail du taux de présence aux événements suivis (barres proportionnelles au dernier mois affiché).
            </p>
            {monthlyHistory.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-8 text-center text-sm text-slate-400">
                Pas encore assez d’historique pour dessiner une tendance. Les barres apparaîtront au fil des mois suivis sur{" "}
                <Link href="/member/evenements/presences" className="font-semibold text-violet-300 hover:underline">
                  tes présences
                </Link>
                .
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-end gap-2 md:gap-3">
                  {monthlyHistory.map((entry) => {
                    const maxAttended = Math.max(...monthlyHistory.map((m) => m.attendedEvents), 1);
                    const h = Math.max(12, Math.round((entry.attendedEvents / maxAttended) * 112));
                    const active = (selectedTrendMonth ?? monthlyHistory[monthlyHistory.length - 1]?.monthKey) === entry.monthKey;
                    return (
                      <button
                        key={entry.monthKey}
                        type="button"
                        className={`flex flex-col items-center gap-2 rounded-xl border px-2 pb-2 pt-3 transition ${
                          active ? "border-violet-400/60 bg-violet-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedTrendMonth(entry.monthKey)}
                      >
                        <div
                          className="w-8 rounded-t-md bg-gradient-to-t from-violet-600/90 to-fuchsia-500/70 md:w-10"
                          style={{ height: `${h}px` }}
                          title={`${entry.attendedEvents} présences`}
                        />
                        <span className="max-w-[4.5rem] text-center text-[10px] font-semibold text-slate-300">
                          {formatMonthShort(entry.monthKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {trendHighlight && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/80">
                      {formatMonthLabel(trendHighlight.monthKey)}
                    </p>
                    <div className="mt-3 grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-2xl font-black text-white">{trendHighlight.attendanceRate}%</p>
                        <p className="text-xs text-slate-400">Taux de présence</p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-white">
                          {trendHighlight.attendedEvents}/{trendHighlight.totalEvents}
                        </p>
                        <p className="text-xs text-slate-400">Événements suivis / auxquels tu as participé</p>
                      </div>
                      <div className="flex items-end">
                        <Link
                          href="/member/evenements/presences"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-violet-300 hover:text-white"
                        >
                          Détail des présences
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/40 to-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">Prochains événements</h3>
                <Link href="/member/evenements" className="text-xs font-semibold text-cyan-300 hover:text-white">
                  Tout voir
                </Link>
              </div>
              {upcoming.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Rien d’annoncé pour l’instant — jette un œil au planning plus tard.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {upcoming.slice(0, 6).map((ev) => (
                    <li key={ev.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                      <p className="text-sm font-semibold text-white">{ev.title}</p>
                      <p className="text-xs text-slate-400">
                        {formatIsoDate(ev.date)} · {ev.category}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-950/30 to-slate-950/80 p-5">
              <h3 className="text-sm font-bold text-white">Moments récents</h3>
              <p className="mt-1 text-xs text-slate-400">Formations et présences enregistrées — ouvre une ligne pour le détail.</p>
              {moments.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">Aucun passage récent en base : ça se remplira au fil de tes activités.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {moments.map((m) => {
                    const open = expandedMomentId === m.id;
                    return (
                      <li key={m.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-white transition hover:bg-white/5"
                          onClick={() => setExpandedMomentId(open ? null : m.id)}
                          aria-expanded={open}
                        >
                          <span className="font-medium line-clamp-1">{m.title}</span>
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        {open && (
                          <div className="border-t border-white/10 px-3 py-2 text-xs text-slate-300">
                            <p>{formatIsoDate(m.date)}</p>
                            <p className="mt-1 capitalize">
                              {m.kind === "formation" ? "Formation validée" : `Présence — ${m.category || "événement"}`}
                            </p>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-400">
        <Target className="mx-auto mb-2 h-6 w-6 text-violet-400/80" aria-hidden />
        <p>
          Les objectifs mensuels se règlent sur{" "}
          <Link href="/member/objectifs" className="font-semibold text-violet-300 hover:underline">
            Mes objectifs
          </Link>
          . Cette page les lit pour une lecture graphique instantanée.
        </p>
      </section>
    </MemberSurface>
  );
}

function ProgressionScoreRing({ score, gradientId }: { score: number; gradientId: string }) {
  const size = 128;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, score)) / 100) * c;

  return (
    <div className="relative flex h-[136px] w-[136px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg" aria-hidden>
        <defs>
          <linearGradient id={`${gradientId}-prog`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#f472b6" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId}-prog)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{score}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/80">mois</span>
      </div>
    </div>
  );
}

function ProgressionSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-44 rounded-3xl bg-white/5" />
      <div className="h-14 rounded-2xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
