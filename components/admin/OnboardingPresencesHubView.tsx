"use client";

import Link from "next/link";
import type { RefObject, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ListOrdered,
  RefreshCw,
  Search,
  UserCog,
  Zap,
} from "lucide-react";

export type PresentGestionRow = {
  twitchLogin: string;
  displayName: string;
  status: "missing" | "nouveau" | "inactif" | "ok";
};

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export type PresencesHubSessionRow = {
  integrationId: string;
  title: string;
  date: string;
  attendedCount: number;
  registrationsCount: number;
};

type PresencesHubStats = {
  totalSessions: number;
  totalPresent: number;
};

type Props = {
  loading: boolean;
  onRefresh: () => void;
  sessionsNeedingPresences: PresencesHubSessionRow[];
  stats: PresencesHubStats;
  toActivateCount: number;
  presentNeedingGestion: PresentGestionRow[];
  presentNeedingGestionNouveauCount: number;
  readySessionsCount: number;
  gestionPriorityRef: RefObject<HTMLDivElement>;
  onScrollToGestionPriority: () => void;
  sessionSearch: string;
  onSessionSearchChange: (value: string) => void;
  priorityListRef: RefObject<HTMLDivElement>;
  sessionsListRef: RefObject<HTMLDivElement>;
  onScrollToPriority: () => void;
  formatDateShort: (iso: string) => string;
  readySessionsContent: ReactNode;
};

export function OnboardingPresencesHubView({
  loading,
  onRefresh,
  sessionsNeedingPresences,
  stats,
  toActivateCount,
  presentNeedingGestion,
  presentNeedingGestionNouveauCount,
  readySessionsCount,
  gestionPriorityRef,
  onScrollToGestionPriority,
  sessionSearch,
  onSessionSearchChange,
  priorityListRef,
  sessionsListRef,
  onScrollToPriority,
  formatDateShort,
  readySessionsContent,
}: Props) {
  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--pres-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--pres-gap)]">
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
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 3 du tunnel</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Présences → intégration des présents
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  La <strong className="font-medium text-zinc-200">saisie présent / absent</strong> se fait sur{" "}
                  <Link
                    href="/admin/onboarding/inscriptions"
                    className="text-violet-200 underline-offset-2 hover:underline"
                  >
                    Inscriptions
                  </Link>
                  . Le bouton <strong className="font-medium text-zinc-200">Intégrer</strong> sur une session
                  crée ou passe le profil en <strong className="font-medium text-zinc-200">Affilié actif</strong> — ce
                  qui évite souvent un passage manuel dans{" "}
                  <Link href="/admin/membres/gestion?tab=nouveaux" className="text-violet-200 underline-offset-2 hover:underline">
                    Gestion membres
                  </Link>
                  .
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <Link
                    href="/admin/onboarding/inscriptions"
                    className={`${hubBtnClass} ${hubFocusClass} border-rose-400/30 bg-rose-950/30 text-rose-100`}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Saisir les présences
                  </Link>
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                    aria-label="Actualiser les données"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  {sessionsNeedingPresences.length > 0 ? (
                    <button
                      type="button"
                      onClick={onScrollToPriority}
                      className={`${hubBtnClass} ${hubFocusClass} border-amber-400/30 bg-amber-950/25 text-amber-100`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      {sessionsNeedingPresences.length} sans saisie
                    </button>
                  ) : null}
                  {presentNeedingGestion.length > 0 ? (
                    <button
                      type="button"
                      onClick={onScrollToGestionPriority}
                      className={`${hubBtnClass} ${hubFocusClass} border-sky-400/30 bg-sky-950/25 text-sky-100`}
                    >
                      <UserCog className="h-4 w-4 shrink-0" aria-hidden />
                      {presentNeedingGestion.length} profil{presentNeedingGestion.length > 1 ? "s" : ""} à finaliser
                    </button>
                  ) : null}
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Repères intégration</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Sans saisie</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-rose-200">{sessionsNeedingPresences.length}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Prêtes intégration</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">{readySessionsCount}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Présents (cumul)</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{stats.totalPresent}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Présents → Gestion</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-sky-200">{presentNeedingGestion.length}</dd>
                  </div>
                </dl>
                {presentNeedingGestionNouveauCount > 0 ? (
                  <p className="mt-3 text-[11px] leading-snug text-sky-200/80">
                    Dont {presentNeedingGestionNouveauCount} encore au rôle{" "}
                    <span className="font-medium text-sky-100">Nouveau</span> dans l&apos;annuaire.
                  </p>
                ) : null}
              </div>
            </header>

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement du tunnel d'intégration">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-3">
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">1.</span> Inscriptions — présent / absent
                </li>
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">2.</span> Cette page — intégrer les présents
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">3.</span> Activation — rôles & statut actif
                </li>
              </ol>
            </nav>

            <section
              ref={priorityListRef}
              className={`${hubPanelClass} scroll-mt-24 p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="pres-missing-heading"
            >
              <h2
                id="pres-missing-heading"
                className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-300" aria-hidden />
                Sessions passées — présences non saisies
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Créneaux avec inscrits mais aucune présence enregistrée (source : corrélation intégration).
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status" aria-live="polite">
                  Chargement…
                </p>
              ) : sessionsNeedingPresences.length === 0 ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95"
                  role="status"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Aucune session passée en attente de saisie détectée.
                </p>
              ) : (
                <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                  {sessionsNeedingPresences.map((row) => (
                    <li key={row.integrationId}>
                      <article className="rounded-xl border border-rose-400/25 bg-rose-950/15 p-4">
                        <p className="line-clamp-2 font-semibold text-white">{row.title}</p>
                        <p className="mt-1 text-xs capitalize text-zinc-400">{formatDateShort(row.date)}</p>
                        <p className="mt-2 text-sm text-rose-100/90">
                          <strong className="tabular-nums">{row.registrationsCount}</strong> inscrit
                          {row.registrationsCount > 1 ? "s" : ""} · présences non saisies
                        </p>
                        <Link
                          href="/admin/onboarding/inscriptions"
                          className={`mt-3 inline-flex items-center gap-2 text-sm font-medium text-rose-100 underline-offset-2 hover:underline ${hubFocusClass} rounded`}
                        >
                          Ouvrir Inscriptions
                          <ArrowRight className="h-4 w-4" aria-hidden />
                        </Link>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section
              ref={gestionPriorityRef}
              className={`${hubPanelClass} scroll-mt-24 p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="pres-gestion-heading"
            >
              <h2
                id="pres-gestion-heading"
                className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100"
              >
                <UserCog className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />
                Présents pas encore finalisés dans l&apos;annuaire
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Personnes marquées <strong className="font-medium text-zinc-300">présentes</strong> sur une session mais
                encore absentes de l&apos;annuaire, au rôle <strong className="font-medium text-zinc-300">Nouveau</strong>,
                ou inactives. Préfère <strong className="font-medium text-zinc-300">Intégrer</strong> sur la session
                (→ Affilié actif) ; sinon ouvre Gestion.
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status">
                  Chargement…
                </p>
              ) : presentNeedingGestion.length === 0 ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95"
                  role="status"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Tous les présents connus sont déjà Affiliés / actifs dans l&apos;annuaire.
                </p>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href="/admin/membres/gestion?tab=nouveaux"
                      className={`${hubBtnClass} ${hubFocusClass} border-sky-400/30 bg-sky-950/30 text-sky-100`}
                    >
                      Ouvrir Gestion — onglet Nouveaux
                    </Link>
                    <Link
                      href="/admin/onboarding/activation"
                      className={`${hubBtnClass} ${hubFocusClass}`}
                    >
                      Activation (réassignation)
                    </Link>
                  </div>
                  <ul className="mt-4 max-h-[min(420px,50vh)] space-y-2 overflow-y-auto pr-1">
                    {presentNeedingGestion.slice(0, 40).map((row) => (
                      <li
                        key={row.twitchLogin}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/40 px-3 py-2.5 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-100">{row.displayName}</p>
                          <p className="text-xs text-zinc-500">@{row.twitchLogin}</p>
                          <p
                            className={`mt-1 text-xs font-medium ${
                              row.status === "nouveau"
                                ? "text-amber-200"
                                : row.status === "missing"
                                  ? "text-rose-200"
                                  : "text-zinc-400"
                            }`}
                          >
                            {row.status === "missing"
                              ? "Absent de l'annuaire — Intégrer sur la session"
                              : row.status === "nouveau"
                                ? "Rôle Nouveau — Intégrer ou promouvoir en Gestion"
                                : "Inactif — Intégrer ou activer en Gestion"}
                          </p>
                        </div>
                        <Link
                          href={`/admin/membres/gestion?search=${encodeURIComponent(row.twitchLogin)}`}
                          className={`shrink-0 text-xs font-medium text-violet-200 underline-offset-2 hover:underline ${hubFocusClass} rounded`}
                        >
                          Gestion
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {presentNeedingGestion.length > 40 ? (
                    <p className="mt-2 text-xs text-zinc-600">
                      {presentNeedingGestion.length - 40} autre(s) profil(s) — utilise la recherche dans Gestion.
                    </p>
                  ) : null}
                </>
              )}
            </section>

            <section
              className={`${hubPanelClass} p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="pres-ready-heading"
            >
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="pres-ready-heading" className="text-lg font-semibold text-zinc-100">
                    Sessions prêtes pour l&apos;intégration
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Au moins une présence saisie — ouvre une session pour intégrer les membres présents.
                  </p>
                </div>
                <div className="relative min-w-[min(100%,14rem)] flex-1 sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={sessionSearch}
                    onChange={(e) => onSessionSearchChange(e.target.value)}
                    placeholder="Filtrer…"
                    className={`w-full rounded-xl border border-white/10 bg-zinc-900/80 py-2 pl-10 pr-3 text-sm text-white placeholder:text-zinc-500 ${hubFocusClass}`}
                    aria-label="Filtrer les sessions prêtes"
                  />
                </div>
              </div>
              <div ref={sessionsListRef} className="mt-4 scroll-mt-24">
                {readySessionsContent}
              </div>
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels et suite du tunnel"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-300" aria-hidden />
                  Intégrer uniquement les personnes marquées présentes sur la session.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-300" aria-hidden />
                  Rôle <strong className="text-zinc-300">Nouveau</strong> : préférer Intégrer ici, sinon Gestion.
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Suite du tunnel</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/admin/onboarding/inscriptions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <ListOrdered className="h-4 w-4 shrink-0" aria-hidden />
                  Inscriptions
                </Link>
                <Link
                  href="/admin/membres/gestion?tab=nouveaux"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-sky-400/25 bg-sky-950/25 text-sky-100`}
                >
                  <UserCog className="h-4 w-4 shrink-0" aria-hidden />
                  Gestion — Nouveaux
                </Link>
                <Link
                  href="/admin/onboarding/activation"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-amber-400/25 bg-amber-950/25 text-amber-100`}
                >
                  <Zap className="h-4 w-4 shrink-0" aria-hidden />
                  Activation
                </Link>
                <Link
                  href="/admin/onboarding"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
                >
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
