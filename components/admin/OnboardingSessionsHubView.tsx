"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ExternalLink,
  ListOrdered,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from "lucide-react";

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

export type DraftSessionRow = {
  id: string;
  title: string;
  date: string;
};

type SessionsHubStats = {
  total: number;
  published: number;
  drafts: number;
  upcoming: number;
  withImage: number;
};

type Props = {
  loading: boolean;
  onRefresh: () => void;
  stats: SessionsHubStats;
  draftUpcoming: DraftSessionRow[];
  nextPublished: DraftSessionRow | null;
  priorityListRef: RefObject<HTMLDivElement>;
  onScrollToPriority: () => void;
  onScrollToForm: () => void;
  onScrollToList: () => void;
  onEditDraft: (id: string) => void;
  formatDateShort: (iso: string) => string;
  children: ReactNode;
};

export function OnboardingSessionsHubView({
  loading,
  onRefresh,
  stats,
  draftUpcoming,
  nextPublished,
  priorityListRef,
  onScrollToPriority,
  onScrollToForm,
  onScrollToList,
  onEditDraft,
  formatDateShort,
  children,
}: Props) {
  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--sess-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--sess-gap)]">
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
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 1 du tunnel</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Créneaux d&apos;accueil
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Planifier les sessions visibles sur le{" "}
                  <Link href="/integration" className="text-violet-200 underline-offset-2 hover:underline">
                    parcours public
                  </Link>
                  . Un créneau <strong className="font-medium text-zinc-200">publié</strong> peut recevoir des
                  inscriptions ; un <strong className="font-medium text-zinc-200">brouillon</strong> reste interne au
                  staff.
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onScrollToForm}
                    className={`${hubBtnClass} ${hubFocusClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}
                  >
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                    Créer / modifier un créneau
                  </button>
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                    aria-label="Actualiser les créneaux"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  {draftUpcoming.length > 0 ? (
                    <button
                      type="button"
                      onClick={onScrollToPriority}
                      className={`${hubBtnClass} ${hubFocusClass} border-amber-400/30 bg-amber-950/25 text-amber-100`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      {draftUpcoming.length} brouillon{draftUpcoming.length > 1 ? "s" : ""} à venir
                    </button>
                  ) : null}
                  <Link
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${hubBtnClass} ${hubFocusClass} border-sky-500/25 bg-sky-950/25 text-sky-100`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Aperçu membre
                  </Link>
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Repères calendrier</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Total</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{stats.total}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Publiés</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">{stats.published}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Brouillons</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-amber-200">{stats.drafts}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">À venir</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-sky-200">{stats.upcoming}</dd>
                  </div>
                </dl>
                {nextPublished ? (
                  <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                    Prochain publié :{" "}
                    <span className="font-medium text-zinc-300">{nextPublished.title}</span>
                    <span className="text-zinc-600"> · </span>
                    <span className="capitalize text-violet-200/90">{formatDateShort(nextPublished.date)}</span>
                  </p>
                ) : (
                  <p className="mt-3 text-[11px] text-zinc-600">Aucun créneau publié à venir.</p>
                )}
              </div>
            </header>

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement après la planification">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">1.</span> Créneaux (ici)
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">2.</span> Inscriptions
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">3.</span> Staff session
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">4.</span> Présences & activation
                </li>
              </ol>
            </nav>

            <section
              ref={priorityListRef}
              className={`${hubPanelClass} scroll-mt-24 p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="sess-drafts-heading"
            >
              <h2
                id="sess-drafts-heading"
                className="flex flex-wrap items-center gap-2 text-lg font-semibold text-zinc-100"
              >
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
                Brouillons à publier (créneaux à venir)
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Invisibles sur /integration tant que la case « Publication » n&apos;est pas activée.
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status" aria-live="polite">
                  Chargement…
                </p>
              ) : draftUpcoming.length === 0 ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95"
                  role="status"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Aucun brouillon à venir — les prochains créneaux sont publiés ou la liste est vide.
                </p>
              ) : (
                <ul className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
                  {draftUpcoming.map((row) => (
                    <li key={row.id}>
                      <article className="rounded-xl border border-amber-400/25 bg-amber-950/15 p-4">
                        <p className="line-clamp-2 font-semibold text-white">{row.title || "Session d'accueil"}</p>
                        <p className="mt-1 text-xs capitalize text-zinc-400">{formatDateShort(row.date)}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onEditDraft(row.id)}
                            className={`${hubBtnClass} ${hubFocusClass} border-amber-400/30 bg-amber-950/30 text-amber-100 text-xs`}
                          >
                            Modifier & publier
                          </button>
                          <button
                            type="button"
                            onClick={onScrollToList}
                            className={`text-xs font-medium text-zinc-400 underline-offset-2 hover:text-zinc-200 hover:underline ${hubFocusClass} rounded`}
                          >
                            Voir dans la liste
                          </button>
                        </div>
                      </article>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="sess-editor-heading" className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="sess-editor-heading" className="text-lg font-semibold text-zinc-100">
                    Éditeur & bibliothèque
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Formulaire à gauche, liste des créneaux à droite — même logique qu&apos;avant, présentation cockpit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onScrollToList}
                  className={`text-sm font-medium text-violet-200 hover:text-white ${hubFocusClass} rounded-lg`}
                >
                  Aller à la liste
                  <ArrowRight className="ml-1 inline h-4 w-4" aria-hidden />
                </button>
              </div>
              {children}
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels planification"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Avant de publier</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-300" aria-hidden />
                  Date, visuel 4∶1 et lien vocal accueil renseignés.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  Staff : au moins 2 modérateurs sur{" "}
                  <Link href="/admin/onboarding/staff" className="text-violet-200 underline">
                    Équipe session
                  </Link>
                  .
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden />
                  Trame prête dans{" "}
                  <Link href="/admin/onboarding/contenus" className="text-violet-200 underline">
                    Contenus
                  </Link>
                  .
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Suite du tunnel</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/admin/onboarding/inscriptions"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center`}
                >
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  Inscriptions
                </Link>
                <Link href="/admin/onboarding/staff" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Staff session
                </Link>
                <Link
                  href="/admin/onboarding/presences"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
                >
                  <Calendar className="h-4 w-4 shrink-0" aria-hidden />
                  Après la session
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
