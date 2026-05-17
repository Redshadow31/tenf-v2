"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ExternalLink,
  LayoutList,
  ListOrdered,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  supportsCount: number;
  criticalCount: number;
  secondaryCount: number;
  checklistDone: number;
  checklistTotal: number;
  checklistHydrated: boolean;
  gridRef: RefObject<HTMLDivElement>;
  prepRef: RefObject<HTMLDivElement>;
  onScrollToGrid: () => void;
  onScrollToPrep: () => void;
  onFilterCritical: () => void;
  prepContent: ReactNode;
  children: ReactNode;
};

export function OnboardingContenusHubView({
  supportsCount,
  criticalCount,
  secondaryCount,
  checklistDone,
  checklistTotal,
  checklistHydrated,
  gridRef,
  prepRef,
  onScrollToGrid,
  onScrollToPrep,
  onFilterCritical,
  prepContent,
  children,
}: Props) {
  const checklistPercent =
    checklistTotal > 0 ? Math.min(100, Math.round((checklistDone / checklistTotal) * 100)) : 0;
  const checklistComplete = checklistTotal > 0 && checklistDone >= checklistTotal;

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--cnt-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--cnt-gap)]">
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
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 2 du tunnel · message TENF</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Contenus & trame
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Hub staff pour préparer la session vocale : slides, discours et version canonique. Les{" "}
                  <strong className="font-medium text-zinc-200">nouveaux membres</strong> entendent le même récit que
                  celui affiché ici — plus c&apos;est préparé, plus le live reste humain.
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onScrollToPrep}
                    className={`${hubBtnClass} ${hubFocusClass} border-emerald-500/25 bg-emerald-950/25 text-emerald-100`}
                  >
                    <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                    Checklist pré-session
                  </button>
                  <button
                    type="button"
                    onClick={onScrollToGrid}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                  >
                    <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
                    Voir les supports
                  </button>
                  <button
                    type="button"
                    onClick={onFilterCritical}
                    className={`${hubBtnClass} ${hubFocusClass} border-rose-400/30 bg-rose-950/25 text-rose-100`}
                  >
                    Critiques ({criticalCount})
                  </button>
                  <Link
                    href="/integration"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${hubBtnClass} ${hubFocusClass} border-sky-400/25 bg-sky-950/25 text-sky-100`}
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                    Parcours public
                  </Link>
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Repères contenus</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Supports</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-100">{supportsCount}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Critiques</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-rose-200">{criticalCount}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Secondaires</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-zinc-300">{secondaryCount}</dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Checklist</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">
                      {checklistHydrated ? `${checklistDone}/${checklistTotal}` : "—"}
                    </dd>
                  </div>
                </dl>
                {checklistHydrated && checklistComplete ? (
                  <p className="mt-3 text-[11px] text-emerald-300/90">
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5 align-text-bottom" aria-hidden />
                    Checklist complète sur ce navigateur.
                  </p>
                ) : (
                  <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                    Checklist locale ({checklistPercent}% si {checklistTotal} points) — pas de score serveur.
                  </p>
                )}
              </div>
            </header>

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement du tunnel">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">1.</span> Inscriptions
                </li>
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">2.</span> Contenus & trame (ici)
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">3.</span> Staff & session
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">4+</span> Présences → activation
                </li>
              </ol>
            </nav>

            <section ref={prepRef} className="scroll-mt-24 min-w-0" aria-labelledby="contenus-prep-heading">
              <h2 id="contenus-prep-heading" className="sr-only">
                Préparation et checklist
              </h2>
              {prepContent}
            </section>

            <section aria-labelledby="contenus-grid-heading" className="min-w-0">
              <div className="mb-4">
                <h2 id="contenus-grid-heading" className="text-lg font-semibold text-zinc-100">
                  Supports éditoriaux
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Filtre par priorité, ouvre chaque ressource ou déplie les conseils staff.
                </p>
              </div>
              <div ref={gridRef} className="scroll-mt-24 min-w-0 space-y-4">
                {children}
              </div>
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels contenus"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Avant le live</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                  Choisir une trame « canon » et l&apos;annoncer en ouverture.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  Relire les {criticalCount} supports critiques avant chaque session.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden />
                  Legacy réservé au staff — ne pas l&apos;utiliser comme fil conducteur live.
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Suite du tunnel</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/admin/onboarding/sessions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  Créneaux
                </Link>
                <Link href="/admin/onboarding/staff" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <Users className="h-4 w-4 shrink-0" aria-hidden />
                  Équipe session
                </Link>
                <Link href="/admin/onboarding/inscriptions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  Inscriptions
                </Link>
                <Link href="/admin/onboarding/presences" className={`${hubBtnClass} ${hubFocusClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}>
                  <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Présences
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
