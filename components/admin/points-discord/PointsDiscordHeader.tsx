"use client";

import Link from "next/link";
import { ChevronLeft, RefreshCw, Zap } from "lucide-react";

export type PointsDiscordHeaderProps = {
  /** Mois affiché — sert au sous-titre contextuel. */
  month: string;
  /** Run EventSub courant pour les raids (peut être null). */
  runId: string | null;
  /** Dernier rafraîchissement client (auto-poll ou manuel). */
  lastRefreshAt: Date | null;
  /** Chargement en cours pour l'icône refresh. */
  loading: boolean;
  /** Auto-polling actif (false = onglet en arrière-plan). */
  pollingActive: boolean;
  /** Callback rafraîchir manuel. */
  onRefresh: () => void;
};

/**
 * Header compact pour le hub Points Discord (mode `/admin/communaute`).
 * Pas de hero décoratif : breadcrumb, titre, sous-titre, statut et bouton
 * d'actualisation manuelle.
 */
export default function PointsDiscordHeader({
  month,
  runId,
  lastRefreshAt,
  loading,
  pollingActive,
  onRefresh,
}: PointsDiscordHeaderProps) {
  return (
    <header className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-zinc-950/95 via-zinc-950/90 to-violet-950/15 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
      <Link
        href="/admin/communaute/engagement"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-200/85 transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        Hub engagement
      </Link>

      <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300/90">
            Engagement · Récompenses
          </p>
          <h1 className="mt-1.5 flex flex-wrap items-center gap-3 text-[clamp(1.5rem,1.2rem+1vw,2rem)] font-semibold tracking-tight text-white">
            <Zap className="h-6 w-6 shrink-0 text-amber-300" aria-hidden />
            Points Discord
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Valider les points liés aux raids EventSub (+500) et aux présences évènements (+300).
            Les règles métier sont forcées serveur ; toutes les actions sont auditées.
          </p>
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500"
          >
            <span>
              Mois actif&nbsp;: <strong className="text-zinc-300">{month}</strong>
            </span>
            <span aria-hidden className="text-zinc-700">·</span>
            <span>
              {pollingActive ? "Auto-actualisation 30 s" : "Auto-actualisation en pause"}
              {lastRefreshAt ? ` · maj ${lastRefreshAt.toLocaleTimeString("fr-FR")}` : ""}
            </span>
            {runId ? (
              <>
                <span aria-hidden className="text-zinc-700">·</span>
                <span>
                  Run actif&nbsp;: <code className="font-mono text-zinc-300">{runId.slice(0, 8)}…</code>
                </span>
              </>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-violet-500/35 bg-violet-950/40 px-4 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-900/50 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Actualiser
        </button>
      </div>
    </header>
  );
}
