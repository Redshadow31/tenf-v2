"use client";

import { CalendarClock, Hash, Info, Megaphone, Shield, Zap } from "lucide-react";

export type PointsDiscordSidePanelProps = {
  /** Run EventSub actif (raids). Null si la source n'est pas raids. */
  runId: string | null;
  /** Mois actif affiché (yyyy-MM). */
  month: string;
  /** Date de dernier rafraîchissement, formatée localement. */
  lastRefreshAt: Date | null;
  /** Source courante : raids ou events. */
  source: "raids" | "events";
  /** Statut du polling : actif / pause. */
  pollingActive: boolean;
};

/**
 * Panneau latéral fixe : rappel des règles, état du run / mois et indicateurs
 * d'audit. Utilisé sur desktop large pour exploiter l'espace côté droit.
 *
 * Le composant est purement informationnel : aucun fetch, aucune mutation.
 */
export default function PointsDiscordSidePanel({
  runId,
  month,
  lastRefreshAt,
  source,
  pollingActive,
}: PointsDiscordSidePanelProps) {
  return (
    <aside
      aria-label="Informations et règles des points Discord"
      className="space-y-4 lg:sticky lg:top-4"
    >
      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Info className="h-4 w-4 text-violet-300" aria-hidden />
          Règles points TENF
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-500/[0.07] px-3 py-2">
            <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            <div>
              <p className="font-medium text-amber-100">Raid EventSub validé</p>
              <p className="text-xs text-amber-200/80">
                <strong className="text-amber-100">+500 points</strong> par raid. Commande Discord{" "}
                <code className="rounded bg-black/30 px-1 font-mono text-[11px]">/raid @pseudo</code>.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-2 rounded-xl border border-sky-400/25 bg-sky-500/[0.07] px-3 py-2">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
            <div>
              <p className="font-medium text-sky-100">Présence évènement</p>
              <p className="text-xs text-sky-200/80">
                <strong className="text-sky-100">+300 points</strong> par présence validée. Commande{" "}
                <code className="rounded bg-black/30 px-1 font-mono text-[11px]">/event @pseudo</code>.
              </p>
            </div>
          </li>
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
          Les valeurs sont forcées côté serveur : impossible d&apos;attribuer un autre montant
          depuis le client.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-zinc-950/60 p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
          <Shield className="h-4 w-4 text-violet-300" aria-hidden />
          État des données
        </h2>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
          <dt className="font-semibold uppercase tracking-wide text-zinc-500">Source</dt>
          <dd className="text-zinc-200">{source === "raids" ? "Raids EventSub" : "Évènements"}</dd>
          <dt className="font-semibold uppercase tracking-wide text-zinc-500">Mois affiché</dt>
          <dd className="text-zinc-200">{month}</dd>
          {source === "raids" ? (
            <>
              <dt className="flex items-center gap-1 font-semibold uppercase tracking-wide text-zinc-500">
                <Hash className="h-3 w-3" aria-hidden /> Run EventSub
              </dt>
              <dd className="font-mono text-zinc-200">
                {runId ? `${runId.slice(0, 12)}…` : <span className="text-zinc-500">aucun run actif</span>}
              </dd>
            </>
          ) : null}
          <dt className="flex items-center gap-1 font-semibold uppercase tracking-wide text-zinc-500">
            <CalendarClock className="h-3 w-3" aria-hidden /> Dernière maj
          </dt>
          <dd className="text-zinc-200">
            {lastRefreshAt ? lastRefreshAt.toLocaleTimeString("fr-FR") : "—"}
          </dd>
          <dt className="font-semibold uppercase tracking-wide text-zinc-500">Auto-actualisation</dt>
          <dd className={pollingActive ? "text-emerald-300" : "text-amber-200"}>
            {pollingActive ? "active (30 s)" : "en pause (onglet inactif)"}
          </dd>
        </dl>
      </section>
    </aside>
  );
}
