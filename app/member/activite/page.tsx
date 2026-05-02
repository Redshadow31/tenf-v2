"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Compass,
  Flame,
  GraduationCap,
  History,
  LayoutGrid,
  ListOrdered,
  RefreshCw,
  Rocket,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import MemberSurface from "@/components/member/ui/MemberSurface";
import MemberPageHeader from "@/components/member/ui/MemberPageHeader";
import { useMemberOverview } from "@/components/member/hooks/useMemberOverview";

const EMPTY_STATS = {
  raidsThisMonth: 0,
  raidsTotal: 0,
  eventPresencesThisMonth: 0,
  participationThisMonth: 0,
  formationsValidated: 0,
  formationsValidatedThisMonth: 0,
};

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
  const names = [
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
  return `${names[monthIndex] || "Mois"} ${year}`;
}

function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function categoryAccent(category: string): { bg: string; text: string; border: string } {
  const c = category.toLowerCase();
  if (c.includes("formation")) return { bg: "rgba(56, 189, 248, 0.14)", text: "#7dd3fc", border: "rgba(56, 189, 248, 0.35)" };
  if (c.includes("spotlight")) return { bg: "rgba(167, 139, 250, 0.18)", text: "#e9d5ff", border: "rgba(167, 139, 250, 0.4)" };
  if (c.includes("film")) return { bg: "rgba(244, 114, 182, 0.14)", text: "#f9a8d4", border: "rgba(244, 114, 182, 0.35)" };
  if (c.includes("jeu") || c.includes("gaming")) return { bg: "rgba(167, 139, 250, 0.12)", text: "#c4b5fd", border: "rgba(167, 139, 250, 0.3)" };
  return { bg: "rgba(148, 163, 184, 0.12)", text: "#cbd5e1", border: "rgba(148, 163, 184, 0.3)" };
}

function pulseMessage(participation: number, presences: number): string {
  if (participation >= 12) return "Un mois bien chargé côté communauté — pense à pauser si tu en ressens le besoin.";
  if (participation >= 6) return "Une présence régulière qui fait vivre TENF, merci pour ça.";
  if (presences >= 1) return "Chaque présence compte : tu coconstruis déjà l’ambiance collective.";
  return "Pas de pression : cette page est une boussole, pas une obligation.";
}

type TabId = "overview" | "month" | "flow";

export default function MemberMonthlyActivityPage() {
  const { data, loading, error: overviewError } = useMemberOverview();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<string | null>(null);
  const [raidsForMonth, setRaidsForMonth] = useState(0);
  const ringId = useId();

  const monthKey = data?.monthKey ?? "";

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
  const monthlyHistory = data?.attendance?.monthlyHistory ?? [];
  const monthEvents = data?.attendance?.monthEvents ?? [];
  const categoryBreakdown = data?.attendance?.categoryBreakdown ?? [];
  const discordPointsAvailable = Boolean(data?.attendance?.discordPointsTrackingAvailable);

  const raidsLive = raidsForMonth > 0 ? raidsForMonth : stats.raidsThisMonth ?? 0;

  const formationsThisMonth =
    stats.formationsValidatedThisMonth ??
    (data?.formationHistory ?? []).filter((item) => (item.date ?? "").slice(0, 7) === monthKey).length;

  const attendedThisMonth = monthEvents.filter((e) => e.attended).length;
  const trackedThisMonth = monthEvents.length;

  const intensityScore = useMemo(() => {
    const clampPct = (n: number, max: number) => (max <= 0 ? 0 : Math.min(100, Math.round((n / max) * 100)));
    const presences = stats.eventPresencesThisMonth ?? 0;
    const participation = stats.participationThisMonth ?? 0;
    return Math.round(
      (clampPct(presences, 8) + clampPct(raidsLive, 12) + clampPct(participation, 12) + clampPct(formationsThisMonth, 4)) / 4
    );
  }, [stats.eventPresencesThisMonth, stats.participationThisMonth, raidsLive, formationsThisMonth]);

  const trendHighlight = selectedTrendMonth
    ? monthlyHistory.find((m) => m.monthKey === selectedTrendMonth)
    : monthlyHistory[monthlyHistory.length - 1];

  const sortedMonthEvents = useMemo(() => [...monthEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()), [monthEvents]);

  const upcoming = data?.upcomingEvents ?? [];

  if (!loading && overviewError) {
    return (
      <MemberSurface>
        <MemberPageHeader title="Mon activité" description="Impossible de charger tes données pour le moment." badge="Activité" />
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
        <MemberPageHeader title="Mon activité" description="Chargement de ton mois TENF…" badge="Activité" />
        <ActiviteSkeleton />
      </MemberSurface>
    );
  }

  const displayName = data.member.displayName || data.member.twitchLogin || "Membre";
  const vibe = pulseMessage(stats.participationThisMonth ?? 0, stats.eventPresencesThisMonth ?? 0);

  return (
    <MemberSurface>
      <MemberPageHeader
        title="Mon activité"
        description="Une lecture ludique de ton mois : raids Discord, présences aux événements TENF et formations. Les chiffres racontent une histoire — ils ne la décident pas."
        badge="Espace membre"
        extras={
          <span className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/35 bg-orange-500/12 px-3 py-1 text-xs font-semibold text-orange-100">
              <Compass className="h-3.5 w-3.5 text-amber-300" aria-hidden />
              {formatMonthShort(monthKey)}
            </span>
            {data.vip?.activeThisMonth ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-100">
                <Sparkles className="h-3 w-3" aria-hidden />
                VIP ce mois
              </span>
            ) : null}
          </span>
        }
      />

      <nav
        className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-3"
        aria-label="Raccourcis activité"
      >
        {[
          { href: "/member/progression", label: "Ma progression" },
          { href: "/member/objectifs", label: "Mes objectifs" },
          { href: "/member/evenements", label: "Planning" },
          { href: "/member/evenements/presences", label: "Présences" },
          { href: "/member/activite/historique", label: "Historique détaillé" },
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

      <section className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-[#140f0c] via-[#1a1518] to-[#0c0a10] p-5 shadow-2xl md:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <ActivityPulseRing value={intensityScore} gradientId={ringId} />
            <div className="max-w-xl space-y-3 text-center sm:text-left">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-orange-200/75">Rythme du mois</p>
              <h2 className="text-2xl font-bold text-white md:text-3xl">
                {displayName.split(" ")[0]}, voici ton radar communautaire
              </h2>
              <p className="text-sm leading-relaxed text-orange-50/85">{vibe}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
                  <Users className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                  {attendedThisMonth}/{trackedThisMonth || "—"} événements suivis ce mois
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-slate-200">
                  <Rocket className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  {stats.raidsTotal ?? 0} raids au total
                </span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-black/25 p-2"
          role="tablist"
          aria-label="Sections activité"
        >
          {(
            [
              { id: "overview" as const, label: "Synthèse", Icon: LayoutGrid },
              { id: "month" as const, label: "Ce mois-ci", Icon: ListOrdered },
              { id: "flow" as const, label: "Tendance & suite", Icon: TrendingUp },
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
                  ? "bg-gradient-to-r from-orange-600/95 to-rose-600/85 text-white shadow-lg shadow-orange-950/40"
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
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatHero
                title="Raids (Discord)"
                value={raidsLive}
                sub="Compteur mois — indicateur, pas une course."
                icon={Zap}
                gradient="from-amber-500/25 to-orange-950/40"
                border="border-amber-400/35"
                href="/member/raids/declarer"
              />
              <StatHero
                title="Présences événements"
                value={stats.eventPresencesThisMonth ?? 0}
                sub="Validées sur la période affichée."
                icon={Users}
                gradient="from-sky-500/25 to-slate-950/50"
                border="border-sky-400/35"
                href="/member/evenements/presences"
              />
              <StatHero
                title="Actions du mois"
                value={stats.participationThisMonth ?? 0}
                sub="Vue agrégée côté TENF."
                icon={Flame}
                gradient="from-rose-500/25 to-purple-950/40"
                border="border-rose-400/35"
                href="/member/progression"
              />
              <StatHero
                title="Formations (mois)"
                value={formationsThisMonth}
                sub={`${stats.formationsValidated ?? 0} validées au total`}
                icon={GraduationCap}
                gradient="from-emerald-500/25 to-teal-950/40"
                border="border-emerald-400/35"
                href="/member/formations"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">Répartition par type d’événement</h3>
                <Link href="/member/evenements" className="text-xs font-semibold text-orange-300 hover:text-white">
                  Voir le planning
                </Link>
              </div>
              {categoryBreakdown.length === 0 ? (
                <p className="mt-4 text-sm text-slate-400">
                  Pas encore de répartition pour ce mois — les catégories apparaîtront quand des événements seront suivis.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {categoryBreakdown.map((row) => {
                    const pct = row.totalEvents > 0 ? Math.round((row.attendedEvents / row.totalEvents) * 100) : 0;
                    const styles = categoryAccent(row.category);
                    return (
                      <li key={row.category}>
                        <button
                          type="button"
                          className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-left transition hover:bg-white/5"
                          onClick={() => setActiveTab("month")}
                          title="Voir la liste du mois"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className="rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                              style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                            >
                              {row.category}
                            </span>
                            <span className="text-xs font-semibold text-white">
                              {row.attendedEvents}/{row.totalEvents} · {pct}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeTab === "month" && (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-slate-300">
              Événements suivis ce mois — ouvre une ligne pour le détail (points Discord si disponibles).
            </p>
            {sortedMonthEvents.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-400">
                Aucun événement suivi pour {formatMonthLabel(monthKey)} pour l’instant.{" "}
                <Link href="/member/evenements" className="font-semibold text-orange-300 hover:underline">
                  Consulter le planning
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {sortedMonthEvents.map((ev) => {
                  const open = expandedEventId === ev.id;
                  const styles = categoryAccent(ev.category);
                  return (
                    <li key={ev.id} className="overflow-hidden rounded-xl border border-white/10 bg-black/25">
                      <button
                        type="button"
                        className="flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-white/5"
                        onClick={() => setExpandedEventId(open ? null : ev.id)}
                        aria-expanded={open}
                      >
                        <span className="mt-0.5 shrink-0">
                          {ev.attended ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
                          ) : (
                            <CircleDot className="h-5 w-5 text-slate-500" aria-hidden />
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-white">{ev.title}</span>
                          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            {formatIsoShort(ev.date)}
                            <span
                              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                              style={{ backgroundColor: styles.bg, color: styles.text, borderColor: styles.border }}
                            >
                              {ev.category}
                            </span>
                            {ev.isKeyEvent ? (
                              <span className="rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                                Moment fort
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <ChevronDown
                          className={`mt-1 h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`}
                          aria-hidden
                        />
                      </button>
                      {open && (
                        <div className="border-t border-white/10 px-3 py-3 text-xs text-slate-300">
                          <p>
                            Statut présence :{" "}
                            <strong className="text-white">{ev.attended ? "Présence enregistrée" : "Non marqué·e présent·e"}</strong>
                          </p>
                          {discordPointsAvailable && ev.attended ? (
                            <p className="mt-2">
                              Points événement Discord :{" "}
                              <strong className="text-white">
                                {ev.discordPointsStatus === "awarded"
                                  ? "Attribués"
                                  : ev.discordPointsStatus === "pending"
                                    ? "En attente de synchro"
                                    : "Non suivis pour cet événement"}
                              </strong>
                            </p>
                          ) : null}
                          <Link
                            href="/member/evenements/presences"
                            className="mt-3 inline-flex items-center gap-1 font-semibold text-orange-300 hover:text-white"
                          >
                            Page présences
                            <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === "flow" && (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/35 to-slate-950/90 p-5">
              <h3 className="text-sm font-bold text-white">Présences mois par mois</h3>
              <p className="mt-1 text-xs text-slate-400">Clique une barre pour isoler un mois.</p>
              {monthlyHistory.length === 0 ? (
                <p className="mt-6 text-sm text-slate-400">Historique pas encore disponible.</p>
              ) : (
                <>
                  <div className="mt-6 flex flex-wrap items-end gap-2 md:gap-3">
                    {monthlyHistory.map((entry) => {
                      const max = Math.max(...monthlyHistory.map((m) => m.attendedEvents), 1);
                      const h = Math.max(14, Math.round((entry.attendedEvents / max) * 100));
                      const active =
                        (selectedTrendMonth ?? monthlyHistory[monthlyHistory.length - 1]?.monthKey) === entry.monthKey;
                      return (
                        <button
                          key={entry.monthKey}
                          type="button"
                          className={`flex flex-col items-center gap-2 rounded-xl border px-2 pb-2 pt-3 transition ${
                            active ? "border-orange-400/55 bg-orange-500/15" : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                          onClick={() => setSelectedTrendMonth(entry.monthKey)}
                        >
                          <div
                            className="w-7 rounded-t-md bg-gradient-to-t from-orange-600/95 to-rose-500/75 md:w-9"
                            style={{ height: `${h}px` }}
                          />
                          <span className="max-w-[4rem] text-center text-[10px] font-semibold text-slate-300">
                            {formatMonthShort(entry.monthKey)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {trendHighlight ? (
                    <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
                        {formatMonthLabel(trendHighlight.monthKey)}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-2xl font-black text-white">{trendHighlight.attendanceRate}%</p>
                          <p className="text-[11px] text-slate-400">Taux</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white">
                            {trendHighlight.attendedEvents}/{trendHighlight.totalEvents}
                          </p>
                          <p className="text-[11px] text-slate-400">Présences / suivis</p>
                        </div>
                        <div className="flex items-end">
                          <Link
                            href="/member/evenements/presences"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-violet-200 hover:text-white"
                          >
                            Détail <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-950/30 to-slate-950/90 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">Prochains rendez-vous</h3>
                  <Link href="/member/evenements" className="text-xs font-semibold text-cyan-300 hover:text-white">
                    Planning complet
                  </Link>
                </div>
                {upcoming.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-400">Rien à l’agenda pour l’instant.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {upcoming.slice(0, 5).map((ev) => (
                      <li key={ev.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
                        <p className="text-sm font-semibold text-white">{ev.title}</p>
                        <p className="text-xs text-slate-400">
                          {formatIsoShort(ev.date)} · {ev.category}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <History className="h-4 w-4 text-orange-300" aria-hidden />
                  Historique complet
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Pour une liste chronologique de toutes tes présences enregistrées, ouvre la page dédiée.
                </p>
                <Link
                  href="/member/activite/historique"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Ouvrir l’historique
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </MemberSurface>
  );
}

function StatHero(props: {
  title: string;
  value: number;
  sub: string;
  icon: typeof Zap;
  gradient: string;
  border: string;
  href: string;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${props.gradient} ${props.border} p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/35`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">{props.title}</p>
          <p className="mt-1 text-3xl font-black text-white tabular-nums">{props.value}</p>
          <p className="mt-2 text-[11px] leading-snug text-white/55">{props.sub}</p>
        </div>
        <Icon className="h-9 w-9 shrink-0 text-white/35 transition group-hover:text-white/55" aria-hidden />
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 opacity-0 transition group-hover:opacity-100">
        Explorer <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}

function ActivityPulseRing({ value, gradientId }: { value: number; gradientId: string }) {
  const size = 124;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;

  return (
    <div className="relative flex h-[132px] w-[132px] shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 drop-shadow-lg" aria-hidden>
        <defs>
          <linearGradient id={`${gradientId}-act`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" />
            <stop offset="50%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradientId}-act)`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{value}%</span>
        <span className="text-[9px] font-semibold uppercase tracking-wide text-orange-200/80">intensité</span>
      </div>
    </div>
  );
}

function ActiviteSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-44 rounded-3xl bg-white/5" />
      <div className="h-14 rounded-2xl bg-white/5" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-2xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}
