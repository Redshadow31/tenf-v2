"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ChevronLeft,
  Heart,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
import type { FollowLayoutVariant } from "./types";

const hubHeroClass =
  "relative overflow-hidden rounded-3xl border border-pink-400/20 bg-[linear-gradient(155deg,rgba(236,72,153,0.12),rgba(14,15,23,0.92)_38%,rgba(11,13,20,0.97))] shadow-[0_24px_70px_rgba(2,6,23,0.55)] backdrop-blur-xl";
const subtleLinkClass =
  "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-pink-400/35 hover:bg-white/[0.1]";

export type FollowHubHeaderProps = {
  variant: FollowLayoutVariant;
  /** True tant que le snapshot tourne (polling actif). */
  runningSnapshot: boolean;
  /** True pendant l'appel POST /snapshots/run pour éviter les doubles clics. */
  snapshotRequestInflight: boolean;
  /** Demande l'ouverture de la modale de confirmation (la modale gère le reste). */
  onRequestSnapshot: () => void;
};

/**
 * Header de la page Follow.
 * - variant="hub" : hero pleine largeur avec dégradés (utilisé sous /admin/communaute).
 * - variant="default" : header sobre legacy (mode redirigé en permanence par next.config.js).
 *
 * Aucun changement visuel par rapport à la page d'origine — extraction pure.
 */
export default function FollowHubHeader({
  variant,
  runningSnapshot,
  snapshotRequestInflight,
  onRequestSnapshot,
}: FollowHubHeaderProps) {
  const disabled = runningSnapshot || snapshotRequestInflight;

  if (variant === "hub") {
    return (
      <section className={`${hubHeroClass} mb-8 p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-violet-600/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <Link
              href="/admin/communaute/engagement"
              className="inline-flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-pink-100/90 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/45"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Hub engagement
            </Link>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-pink-400/35 bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-100">
                <Heart className="h-3.5 w-3.5" aria-hidden />
                Entraide chaînes TENF
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-100">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Pilotage staff
              </span>
            </div>
            <h1 className="mt-4 flex flex-wrap items-center gap-3 text-3xl font-bold tracking-tight md:text-4xl">
              <Users className="h-9 w-9 shrink-0 text-pink-300 md:h-10 md:w-10" aria-hidden />
              Follows mutuels
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Vue live du <strong className="text-white">taux de follow</strong> des membres vers les chaînes TENF
              actives : repère qui soutient l&apos;écosystème, détecte les comptes non reliés, et ouvre le détail pour
              accompagner un membre sans le mettre sur la défensive.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/admin/communaute/engagement/feuilles-follow" className={subtleLinkClass}>
                Feuilles de suivi
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/admin/communaute/engagement/config-follow" className={subtleLinkClass}>
                Paramètres follow
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/admin/communaute/engagement/points-discord" className={subtleLinkClass}>
                Points Discord
                <BarChart3 className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              onClick={onRequestSnapshot}
              disabled={disabled}
              aria-label="Lancer un nouveau snapshot follow (confirmation requise)"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-pink-400/40 bg-gradient-to-r from-pink-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pink-900/30 transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${runningSnapshot ? "animate-spin" : ""}`} aria-hidden />
              {runningSnapshot ? "Snapshot en cours…" : "Nouveau snapshot"}
            </button>
            <p className="max-w-xs text-right text-[11px] text-slate-500">
              Recalcule les follows pour toute la base suivie. Peut prendre quelques minutes.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Follow</h1>
        <p className="text-sm text-gray-400">
          Suivi global du niveau de follow Twitch des membres actifs TENF.
        </p>
      </div>
      <button
        type="button"
        onClick={onRequestSnapshot}
        disabled={disabled}
        aria-label="Lancer un nouveau snapshot follow (confirmation requise)"
        className="rounded-lg border px-4 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
      >
        {runningSnapshot ? "Snapshot en cours…" : "Générer un nouveau snapshot"}
      </button>
    </div>
  );
}
