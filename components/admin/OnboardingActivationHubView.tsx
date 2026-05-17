"use client";

import Link from "next/link";
import { useState, type ReactNode, type RefObject } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ClipboardCheck,
  ListOrdered,
  RefreshCw,
  ShieldCheck,
  UserCog,
  UserPlus,
  Zap,
} from "lucide-react";
import { LinkAttendanceToMemberModal } from "@/components/admin/onboarding/LinkAttendanceToMemberModal";

export type ActivationCandidateRow = {
  twitchLogin: string;
  displayName: string;
  attendanceCount: number;
  discordUsername?: string;
  inMembersList: boolean;
  consideredActivated: boolean;
  memberRole?: string;
  memberStatus?: "actif" | "inactif";
};

export type ActivationSummary = {
  inMembersListCount: number;
  consideredActivatedCount: number;
  toActivateCount: number;
  missingInMembersListCount: number;
};

const hubPanelClass =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/55 shadow-sm shadow-black/20 ring-1 ring-inset ring-white/[0.03]";
const hubHeroClass =
  "relative isolate overflow-hidden rounded-2xl border border-violet-500/20 bg-zinc-950/70 ring-1 ring-inset ring-violet-500/10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]";
const hubBtnClass =
  "inline-flex min-h-[2.5rem] items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-950/25 px-3 py-2 text-sm font-medium text-violet-100 transition hover:border-violet-400/40 hover:bg-violet-900/30";
const hubFocusClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";

type Props = {
  loading: boolean;
  running: boolean;
  error: string | null;
  onRefresh: () => void;
  onReassign: () => void;
  onSyncActivation: () => void;
  sessionsPastCount: number;
  totalAttendances: number;
  integratedMembersCount: number;
  reassignableCount: number;
  activationSummary: ActivationSummary;
  activationProgress: number;
  targetIntegration: { id: string; title: string; date: string } | null;
  needsActivation: ActivationCandidateRow[];
  missingFromAnnuaire: ActivationCandidateRow[];
  priorityRef: RefObject<HTMLDivElement>;
  tableRef: RefObject<HTMLDivElement>;
  onScrollToPriority: () => void;
  onScrollToTable: () => void;
  formatDateShort: (iso: string) => string;
  onMemberLinked?: () => void;
  children: ReactNode;
};

export function OnboardingActivationHubView({
  loading,
  running,
  error,
  onRefresh,
  onReassign,
  onSyncActivation,
  sessionsPastCount,
  totalAttendances,
  integratedMembersCount,
  reassignableCount,
  activationSummary,
  activationProgress,
  targetIntegration,
  needsActivation,
  missingFromAnnuaire,
  priorityRef,
  tableRef,
  onScrollToPriority,
  onScrollToTable,
  formatDateShort,
  onMemberLinked,
  children,
}: Props) {
  const [linkCandidate, setLinkCandidate] = useState<ActivationCandidateRow | null>(null);

  const hasPriorityWork =
    activationSummary.toActivateCount > 0 || activationSummary.missingInMembersListCount > 0;

  return (
    <div className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--act-gap:clamp(1rem,1.55vw,1.85rem)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div className="mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3">
        <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
          <main className="min-w-0 space-y-6 xl:space-y-[var(--act-gap)]">
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
                <p className="text-xs uppercase tracking-[0.12em] text-violet-200/90">Étape 4 du tunnel</p>
                <h1 className="text-[clamp(1.35rem,1rem+0.9vw,2.1rem)] font-semibold tracking-tight text-white">
                  Rôles & activation
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                  Après{" "}
                  <Link href="/admin/onboarding/presences" className="text-violet-200 underline-offset-2 hover:underline">
                    présences
                  </Link>{" "}
                  et intégration des présents, cette vue aligne les profils avec la{" "}
                  <strong className="font-medium text-zinc-200">gestion membres</strong> : réassignation aux sessions
                  passées et synchronisation des statuts actifs.
                </p>
                <div className="flex min-w-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={running}
                    className={`${hubBtnClass} ${hubFocusClass}`}
                    aria-label="Actualiser les données"
                  >
                    <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                    Actualiser
                  </button>
                  <button
                    type="button"
                    onClick={onReassign}
                    disabled={running || reassignableCount === 0}
                    className={`${hubBtnClass} ${hubFocusClass} border-cyan-400/30 bg-cyan-950/25 text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Réassigner ({reassignableCount})
                  </button>
                  <button
                    type="button"
                    onClick={onSyncActivation}
                    disabled={running || activationSummary.toActivateCount === 0}
                    className={`${hubBtnClass} ${hubFocusClass} border-emerald-400/30 bg-emerald-950/25 text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Synchroniser activation ({activationSummary.toActivateCount})
                  </button>
                  {hasPriorityWork ? (
                    <button
                      type="button"
                      onClick={onScrollToPriority}
                      className={`${hubBtnClass} ${hubFocusClass} border-amber-400/30 bg-amber-950/25 text-amber-100`}
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                      Voir les priorités
                    </button>
                  ) : null}
                </div>
              </div>
              <div className={`${hubHeroClass} p-4`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Repères activation</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">À activer</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-amber-200">
                      {activationSummary.toActivateCount}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Hors annuaire</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-rose-200">
                      {activationSummary.missingInMembersListCount}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Déjà actifs</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-emerald-200">
                      {activationSummary.consideredActivatedCount}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-zinc-900/50 p-2">
                    <dt className="text-zinc-500">Présences cumulées</dt>
                    <dd className="mt-1 text-lg font-bold tabular-nums text-sky-200">{totalAttendances}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[11px] leading-snug text-zinc-500">
                  {sessionsPastCount} session{sessionsPastCount !== 1 ? "s" : ""} passée
                  {sessionsPastCount !== 1 ? "s" : ""} · {integratedMembersCount} intégré
                  {integratedMembersCount !== 1 ? "s" : ""} reconnu
                  {integratedMembersCount !== 1 ? "s" : ""}
                </p>
              </div>
            </header>

            {error ? (
              <section
                className="rounded-2xl border border-rose-400/35 bg-rose-950/20 px-4 py-3 text-sm text-rose-100"
                role="alert"
              >
                {error}
              </section>
            ) : null}

            <nav className={`${hubPanelClass} p-4`} aria-label="Enchaînement du tunnel">
              <ol className="grid min-w-0 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">1–3.</span> Inscriptions → présences
                </li>
                <li className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-violet-100">
                  <span className="font-bold text-violet-200">4.</span> Activation (ici)
                </li>
                <li className="rounded-xl border border-white/[0.06] bg-zinc-900/40 px-3 py-2 text-zinc-500">
                  <span className="font-bold text-violet-300">5–6.</span> Profil → membre actif
                </li>
              </ol>
            </nav>

            <section
              ref={priorityRef}
              className={`${hubPanelClass} scroll-mt-24 p-[clamp(1rem,2vw,1.35rem)]`}
              aria-labelledby="activation-priority-heading"
            >
              <h2 id="activation-priority-heading" className="text-lg font-semibold text-zinc-100">
                À traiter en priorité
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Profils détectés via les sessions passées et la corrélation avec la gestion membres.
              </p>
              {loading ? (
                <p className="mt-4 text-sm text-zinc-500" role="status" aria-live="polite">
                  Chargement…
                </p>
              ) : !hasPriorityWork ? (
                <p
                  className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-100/95"
                  role="status"
                >
                  <CheckCircle2 className="mr-2 inline h-4 w-4 align-text-bottom" aria-hidden />
                  Aucun profil en attente d&apos;activation ni hors annuaire sur les données actuelles.
                </p>
              ) : (
                <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-2">
                  {activationSummary.toActivateCount > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-amber-200">
                        À activer dans gestion membres ({activationSummary.toActivateCount})
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {needsActivation.length === 0 ? (
                          <li className="text-sm text-zinc-500">Aucun candidat listé.</li>
                        ) : (
                          needsActivation.map((c) => (
                            <li
                              key={c.twitchLogin}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-400/20 bg-amber-950/15 px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate font-medium text-zinc-100">
                                {c.displayName || c.discordUsername || c.twitchLogin}
                              </span>
                              <span className="shrink-0 text-xs text-zinc-400">
                                {c.attendanceCount} présence{c.attendanceCount > 1 ? "s" : ""}
                              </span>
                              <Link
                                href={`/admin/membres/gestion?search=${encodeURIComponent(c.twitchLogin)}`}
                                className={`inline-flex items-center gap-1 text-xs text-violet-200 hover:underline ${hubFocusClass} rounded`}
                              >
                                Gestion
                                <ArrowRight className="h-3 w-3" aria-hidden />
                              </Link>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : null}
                  {activationSummary.missingInMembersListCount > 0 ? (
                    <div>
                      <h3 className="text-sm font-semibold text-rose-200">
                        Présents sans fiche annuaire ({activationSummary.missingInMembersListCount})
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Vérifier d&apos;abord sur{" "}
                        <Link href="/admin/onboarding/presences" className="text-violet-200 underline">
                          Présences
                        </Link>{" "}
                        (intégration) avant l&apos;activation.
                      </p>
                      <ul className="mt-2 space-y-2">
                        {missingFromAnnuaire.length === 0 ? (
                          <li className="text-sm text-zinc-500">Aucun candidat listé.</li>
                        ) : (
                          missingFromAnnuaire.map((c) => (
                            <li
                              key={c.twitchLogin}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-400/20 bg-rose-950/15 px-3 py-2 text-sm"
                            >
                              <span className="min-w-0 truncate font-medium text-zinc-100">
                                {c.displayName || c.discordUsername || `@${c.twitchLogin}`}
                              </span>
                              <span className="shrink-0 text-xs text-zinc-400">
                                {c.attendanceCount} présence{c.attendanceCount > 1 ? "s" : ""}
                              </span>
                              <button
                                type="button"
                                onClick={() => setLinkCandidate(c)}
                                className={`inline-flex items-center gap-1 text-xs text-violet-200 hover:underline ${hubFocusClass} rounded`}
                              >
                                Rattacher
                                <ArrowRight className="h-3 w-3" aria-hidden />
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}
            </section>

            {targetIntegration ? (
              <section className={`${hubPanelClass} p-4`}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Cible de réassignation</h2>
                <p className="mt-2 text-sm text-zinc-200">
                  {targetIntegration.title}{" "}
                  <span className="text-zinc-500">· {formatDateShort(targetIntegration.date)}</span>
                </p>
              </section>
            ) : (
              <section className={`${hubPanelClass} border-amber-400/20 p-4`}>
                <p className="text-sm text-amber-200">Aucune session future publiée pour la réassignation automatique.</p>
              </section>
            )}

            <section aria-labelledby="activation-table-heading" className="min-w-0">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="activation-table-heading" className="text-lg font-semibold text-zinc-100">
                    Candidats réassignables
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Échantillon des profils éligibles à la réassignation (données API).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onScrollToTable}
                  className={`text-sm text-violet-200 hover:underline ${hubFocusClass} rounded`}
                >
                  Aller au tableau
                </button>
              </div>
              <div ref={tableRef} className="scroll-mt-24 min-w-0">
                {children}
              </div>
            </section>
          </main>

          <aside
            className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
            aria-label="Rappels activation"
          >
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Qualité d&apos;activation</h2>
              <p className="mt-2 text-xs text-zinc-500">
                Part des profils déjà dans gestion membres considérés actifs.
              </p>
              <div className="mt-3 h-2 rounded-full bg-zinc-800/80">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500/90 to-sky-400/90"
                  style={{ width: `${activationProgress}%` }}
                />
              </div>
              <p className="mt-2 text-sm tabular-nums text-emerald-200">{activationProgress}% couverture active</p>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Règles appliquées</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-zinc-400">
                <li className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                  Synchronisation avec la liste gestion membres.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-300" aria-hidden />
                  Actif si statut membre = actif, ou rôle Actif / Affilié / Développement.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-300" aria-hidden />
                  Les présents non activés peuvent être synchronisés en un clic.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-zinc-400" aria-hidden />
                  Profils Communauté avec date d&apos;intégration : exclus de la file « À activer ».
                </li>
              </ul>
            </div>
            <div className={`${hubPanelClass} p-4`}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Suite du tunnel</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/admin/onboarding/presences" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden />
                  Présences
                </Link>
                <Link
                  href="/admin/membres/validation-profil"
                  className={`${hubBtnClass} ${hubFocusClass} justify-center`}
                >
                  <UserCog className="h-4 w-4 shrink-0" aria-hidden />
                  Validation profil
                </Link>
                <Link href="/admin/onboarding/inscriptions" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
                  Inscriptions
                </Link>
                <Link href="/admin/onboarding/contenus" className={`${hubBtnClass} ${hubFocusClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}>
                  <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                  Contenus & trame
                </Link>
                <Link href="/admin/onboarding/kpi" className={`${hubBtnClass} ${hubFocusClass} justify-center`}>
                  <Zap className="h-4 w-4 shrink-0" aria-hidden />
                  Indicateurs
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

      <LinkAttendanceToMemberModal
        candidate={linkCandidate}
        open={linkCandidate !== null}
        onClose={() => setLinkCandidate(null)}
        onLinked={() => onMemberLinked?.()}
      />
    </div>
  );
}
