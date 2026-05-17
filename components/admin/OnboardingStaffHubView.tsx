"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ListOrdered,
  RefreshCw,
  Smartphone,
  Users,
} from "lucide-react";

export const MIN_STAFF_MODERATORS = 2;

export type StaffSessionRiskRow = {
  id: string;
  title: string;
  date: string;
  adminCount: number;
  totalModerators: number;
  registrationsCount: number;
  isPublished?: boolean;
};

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type StaffingStats = {
  sessionCount: number;
  covered: number;
  atRisk: number;
  totalAdmins: number;
  avgAdminsPerSession: number;
};

type Props = {
  loading: boolean;
  onRefresh: () => void;
  staffingStats: StaffingStats;
  sessionsAtRisk: StaffSessionRiskRow[];
  priorityListRef: RefObject<HTMLDivElement>;
  calendarRef: RefObject<HTMLDivElement>;
  onScrollToPriority: () => void;
  onScrollToCalendar: () => void;
  onOpenSession: (id: string) => void;
  formatDateShort: (iso: string) => string;
  children: ReactNode;
};

function riskLabel(adminCount: number): { text: string; tone: string } {
  if (adminCount === 0) {
    return { text: "Critique — 0 modérateur admin", tone: "text-rose-200" };
  }
  if (adminCount < MIN_STAFF_MODERATORS) {
    return { text: `Partiel — ${adminCount}/${MIN_STAFF_MODERATORS} modérateurs admin`, tone: "text-amber-200" };
  }
  return { text: "Conforme", tone: "text-emerald-200" };
}

export function OnboardingStaffHubView({
  loading,
  onRefresh,
  staffingStats,
  sessionsAtRisk,
  priorityListRef,
  calendarRef,
  onScrollToPriority,
  onScrollToCalendar,
  onOpenSession,
  formatDateShort,
  children,
}: Props) {
  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--staff-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--staff-gap)]">
            <header
              className={`grid min-w-0 gap-6 p-[clamp(1rem,2vw,1.5rem)] lg:grid-cols-[minmax(0,1.35fr)_minmax(240px,0.9fr)] ${hubPanelClass}`}
            >
              <div className="min-w-0 space-y-4">
                <Link
                  href="/admin/onboarding"
                  className={`inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white ${hubFocusClass} rounded-lg`}
                >
                  <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
                  Accueil & intégration
                </Link>
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 2 du tunnel</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Équipe session & modérateurs
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Composer l&apos;équipe d&apos;animation pour chaque créneau publié. Règle TENF : au moins{" "}
                  <strong className="font-medium text-zinc-200">{MIN_STAFF_MODERATORS} modérateurs admin</strong>{" "}
                  inscrits sur la session (indicateur « Staff x/2 » sur le calendrier). Clique un jour pour inscrire un
                  modérateur.
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onScrollToCalendar}
                    className={`${hubBtnClass} ${hubFocusClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}
                  >
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                    Voir le calendrier
                  </button>
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                    aria-label="Actualiser le staffing"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  {sessionsAtRisk.length > 0 ? (
                    <button
                      type="button"
                      onClick={onScrollToPriority}
                      className={`${hubBtnClass} ${hubFocusClass} border-amber-400/30 bg-amber-950/25 text-amber-100`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      {sessionsAtRisk.length} session{sessionsAtRisk.length > 1 ? "s" : ""} à compléter
                    </button>
                  ) : null}
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Repères staffing</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Sessions</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{staffingStats.sessionCount}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Conformes (≥2)</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">{staffingStats.covered}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">À compléter</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-amber-200">{staffingStats.atRisk}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Moy. admin / session</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-sky-200">
                      {staffingStats.avgAdminsPerSession}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  « Admin » = inscription staff avec un rôle contenant « admin » (animateur / lead), comme sur le
                  calendrier existant.
                </p>
              </div>
            </header>

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement du tunnel">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">1.</span> Créneaux publiés
                </li>
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">2.</span> Staff session (ici)
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">3.</span> Inscriptions membres
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">4.</span> Session & présences
                </li>
              </ol>
            </nav>

            <section
              ref={priorityListRef}
              className={`${hubPanelClass} scroll-mt-24 p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="staff-risk-heading"
            >
              <h2
                id="staff-risk-heading"
                className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                Sessions à compléter (&lt; {MIN_STAFF_MODERATORS} modérateurs admin)
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Priorise les créneaux avec le plus d&apos;inscrits membres. Ouvre une ligne pour inscrire des
                modérateurs sur le calendrier.
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status" aria-live="polite">
                  Chargement…
                </p>
              ) : sessionsAtRisk.length === 0 ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95"
                  role="status"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Toutes les sessions chargées ont au moins {MIN_STAFF_MODERATORS} modérateurs admin inscrits.
                </p>
              ) : (
                <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                  {sessionsAtRisk.map((row) => {
                    const risk = riskLabel(row.adminCount);
                    return (
                      <li key={row.id}>
                        <article className="rounded-xl border border-amber-400/25 bg-amber-950/15 p-4">
                          <p className="line-clamp-2 font-semibold text-white">{row.title}</p>
                          <p className="mt-1 text-xs capitalize text-zinc-400">{formatDateShort(row.date)}</p>
                          <p className={`mt-2 text-sm font-medium ${risk.tone}`}>{risk.text}</p>
                          <p className="mt-1 text-xs text-zinc-500">
                            {row.registrationsCount} inscription{row.registrationsCount !== 1 ? "s" : ""} membre
                            {row.registrationsCount !== 1 ? "s" : ""}
                            {row.totalModerators > 0 ? (
                              <>
                                {" "}
                                · {row.totalModerators} staff au total
                              </>
                            ) : null}
                          </p>
                          <button
                            type="button"
                            onClick={() => onOpenSession(row.id)}
                            className={`mt-3 inline-flex items-center gap-2 text-sm font-medium text-amber-100 underline-offset-2 hover:underline ${hubFocusClass} rounded`}
                          >
                            Inscrire sur cette session
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          </button>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section aria-labelledby="staff-calendar-heading" className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="staff-calendar-heading" className="text-lg font-semibold text-zinc-100">
                    Calendrier staffing
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Vert = conforme · Jaune = 1 admin · Rouge = 0 — clique un jour pour ouvrir l&apos;inscription staff.
                  </p>
                </div>
              </div>
              <div ref={calendarRef} className="scroll-mt-24 min-w-0">
                {children}
              </div>
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels équipe session"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Règle TENF</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  Minimum {MIN_STAFF_MODERATORS} modérateurs admin par session avant le live.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-300" aria-hidden />
                  Prévoir un lead / admin sur les sessions chargées en inscrits.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden />
                  Publier le créneau sur{" "}
                  <Link href="/admin/onboarding/sessions" className="text-violet-200 underline">
                    Créneaux
                  </Link>{" "}
                  avant d&apos;ouvrir les inscriptions membres.
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Suite du tunnel</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/admin/onboarding/sessions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                  Créneaux
                </Link>
                <Link
                  href="/admin/onboarding/inscriptions"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center`}
                >
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  Inscriptions
                </Link>
                <Link
                  href="/admin/onboarding/contenus"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
                >
                  <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Contenus & trame
                </Link>
                <Link
                  href="/admin/onboarding/staff-mobile"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-sky-400/25 bg-sky-950/25 text-sky-100`}
                >
                  <Smartphone className="h-4 w-4 shrink-0" aria-hidden />
                  Vue mobile staff
                </Link>
                <Link href="/admin/onboarding" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
                  Hub intégration
                </Link>
              </div>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Légende</h2>
              <ul className="mt-3 space-y-2 text-xs text-zinc-400">
                <li className="rounded-lg border border-emerald-400/25 bg-emerald-950/20 px-2 py-1.5 text-emerald-100">
                  Vert — ≥ 2 modérateurs admin
                </li>
                <li className="rounded-lg border border-amber-400/25 bg-amber-950/20 px-2 py-1.5 text-amber-100">
                  Jaune — 1 modérateur admin
                </li>
                <li className="rounded-lg border border-rose-400/25 bg-rose-950/20 px-2 py-1.5 text-rose-100">
                  Rouge — aucun modérateur admin
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
