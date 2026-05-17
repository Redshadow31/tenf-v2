"use client";

import Link from "next/link";
import { ArrowRight, History, TrendingUp } from "lucide-react";
import {
  hubCardClass,
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type Props = {
  pendingTotal: number;
  qualityScore: number;
  validatedThisMonthHref?: string;
};

/**
 * Sobre par design : pas de série temporelle inventée.
 * On affiche l'état actuel + un pont vers l'historique pour comparer dans le temps.
 */
export default function MembersTrendCard({ pendingTotal, qualityScore }: Props) {
  return (
    <section
      className={hubCardClass}
      style={{ padding: "clamp(1rem, 0.85rem + 0.6vw, 1.5rem)" }}
      aria-labelledby="members-hub-trend"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className={hubSectionLabelClass}>Évolution dans le temps</p>
          <h2
            id="members-hub-trend"
            className={`mt-1.5 ${hubSectionTitleClass}`}
            style={{ fontSize: "clamp(1.05rem, 0.9rem + 0.45vw, 1.25rem)" }}
          >
            Comment la communauté évolue
          </h2>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-200"
          aria-hidden
        >
          <TrendingUp className="h-4 w-4" />
        </span>
      </header>

      <p
        className="mt-2 text-slate-400"
        style={{ fontSize: "clamp(0.74rem, 0.72rem + 0.1vw, 0.82rem)", lineHeight: 1.55, maxWidth: "62ch" }}
      >
        Snapshot à comparer semaine après semaine. Pour les courbes réelles (validations, files,
        score qualité), passe par l'historique des événements créateurs.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            File ouverte
          </p>
          <p
            className="mt-1 font-bold text-white"
            style={{ fontSize: "clamp(1.2rem, 1rem + 0.7vw, 1.7rem)" }}
          >
            {pendingTotal}
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-500">Actions à traiter à date</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-slate-400">
            Score qualité
          </p>
          <p
            className="mt-1 font-bold text-white"
            style={{ fontSize: "clamp(1.2rem, 1rem + 0.7vw, 1.7rem)" }}
          >
            {qualityScore}/100
          </p>
          <p className="mt-0.5 text-[0.68rem] text-slate-500">À comparer semaine après semaine</p>
        </div>
      </div>

      <Link
        href="/admin/membres/historique"
        className={`mt-4 inline-flex items-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-500/[0.10] px-3 py-2 text-[0.75rem] font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
      >
        <History className="h-3.5 w-3.5" aria-hidden />
        Ouvrir l'historique membres
        <ArrowRight className="h-3 w-3" aria-hidden />
      </Link>
    </section>
  );
}
