"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import {
  BookOpen,
  ChevronLeft,
  ClipboardCheck,
  Gauge,
  ListOrdered,
  RefreshCw,
  UserCog,
  Zap,
} from "lucide-react";

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export type OnboardingKpiHeroStats = {
  sessionsTotal: number;
  sessionsPast: number;
  totalAttendances: number;
  integratedMembers: number;
};

type Props = {
  loading: boolean;
  onRefresh: () => void;
  heroStats: OnboardingKpiHeroStats;
  publicationRate: number;
  futureSessions: number;
  sessionsMissingPresences: number;
  toActivateCount: number;
  profileValidationPending: number;
  metricsRef: RefObject<HTMLDivElement>;
  onScrollToMetrics: () => void;
  children: ReactNode;
};

export function OnboardingKpiHubView({
  loading,
  onRefresh,
  heroStats,
  publicationRate,
  futureSessions,
  sessionsMissingPresences,
  toActivateCount,
  profileValidationPending,
  metricsRef,
  onScrollToMetrics,
  children,
}: Props) {
  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--kpi-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--kpi-gap)]">
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
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 6 du tunnel · impact</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Indicateurs d&apos;intégration
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Synthèse pour la modération : volumes de sessions d&apos;accueil, présences cumulées, intégrations
                  reconnues et relances.{" "}
                  <strong className="font-medium text-zinc-200">
                    Uniquement les données d&apos;intégration
                  </strong>{" "}
                  — pas les événements communautaires.
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                    aria-label="Actualiser les indicateurs"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={onScrollToMetrics}
                    className={`${hubBtnClass} ${hubFocusClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}
                  >
                    <Gauge className="h-4 w-4 shrink-0" aria-hidden />
                    Voir le détail
                  </button>
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Vue d&apos;ensemble</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Sessions</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{heroStats.sessionsTotal}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Passées</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-sky-200">{heroStats.sessionsPast}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Présences</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-fuchsia-200">{heroStats.totalAttendances}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Intégrés</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-violet-200">{heroStats.integratedMembers}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  Publication {publicationRate}% · {futureSessions} à venir
                  {sessionsMissingPresences > 0
                    ? ` · ${sessionsMissingPresences} session${sessionsMissingPresences > 1 ? "s" : ""} sans saisie présences`
                    : ""}
                </p>
              </div>
            </header>

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement du tunnel">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">1–5.</span> Parcours nouveau membre
                </li>
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">6.</span> Indicateurs (ici)
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  Relances : activation {toActivateCount} · profils {profileValidationPending}
                </li>
              </ol>
            </nav>

            <section ref={metricsRef} className="scroll-mt-24 min-w-0" aria-labelledby="kpi-metrics-heading">
              <div className="mb-4">
                <h2 id="kpi-metrics-heading" className="text-lg font-semibold text-zinc-100">
                  Grille détaillée
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Chaque tuile correspond à une source API réelle (intégrations, corrélation présences, dashboard ops).
                </p>
              </div>
              {loading ? (
                <p className="text-sm text-zinc-500" role="status" aria-live="polite">
                  Chargement des indicateurs…
                </p>
              ) : null}
              {children}
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels indicateurs"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Lecture des chiffres</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-300" aria-hidden />
                  Sessions = créneaux d&apos;accueil (`/api/integrations`).
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fuchsia-300" aria-hidden />
                  Présences & intégrés = corrélation post-session.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  « Sans saisie présences » = inscrits mais `attendedCount` à 0.
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Actions liées</h2>
              <div className="mt-3 flex flex-col gap-2">
                {sessionsMissingPresences > 0 ? (
                  <Link
                    href="/admin/onboarding/presences"
                    className={`${hubBtnClass} ${hubFocusClass} justify-center border-rose-400/30 bg-rose-950/25 text-rose-100`}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Saisir présences ({sessionsMissingPresences})
                  </Link>
                ) : null}
                {toActivateCount > 0 ? (
                  <Link
                    href="/admin/onboarding/activation"
                    className={`${hubBtnClass} ${hubFocusClass} justify-center border-amber-400/30 bg-amber-950/25 text-amber-100`}
                  >
                    <Zap className="h-4 w-4 shrink-0" aria-hidden />
                    Activation ({toActivateCount})
                  </Link>
                ) : null}
                {profileValidationPending > 0 ? (
                  <Link
                    href="/admin/membres/validation-profil"
                    className={`${hubBtnClass} ${hubFocusClass} justify-center`}
                  >
                    <UserCog className="h-4 w-4 shrink-0" aria-hidden />
                    Validation profil ({profileValidationPending})
                  </Link>
                ) : null}
                <Link href="/admin/onboarding/sessions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  Créneaux
                </Link>
                <Link href="/admin/onboarding" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
                  Hub intégration
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
