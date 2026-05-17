"use client";

import Link from "next/link";
import { ArrowRight, Eye } from "lucide-react";
import type { MembersWeakSignal } from "@/lib/admin/members/membersHubModel";
import {
  hubCardClass,
  hubFocusRingClass,
  hubSectionLabelClass,
  hubSectionTitleClass,
} from "./membersHubStyles";

type Props = {
  signals: MembersWeakSignal[];
};

/**
 * Bloc "À surveiller" — signaux faibles, non bloquants.
 *
 * N'invente rien : si aucun signal disponible, on affiche un état rassurant.
 * Données utilisées : revueDue7d, warnings techniques, pseudos Discord
 * manquants, profils incomplets en faible volume, écarts sync fragiles.
 */
export default function MembersWeakSignals({ signals }: Props) {
  const hasSignals = signals.length > 0;

  return (
    <section
      className={hubCardClass}
      style={{ padding: "clamp(1rem, 0.85rem + 0.5vw, 1.5rem)" }}
      aria-labelledby="members-hub-weak-signals"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={hubSectionLabelClass}>À surveiller</p>
          <h2
            id="members-hub-weak-signals"
            className={`mt-1.5 ${hubSectionTitleClass}`}
            style={{ fontSize: "clamp(1.02rem, 0.9rem + 0.35vw, 1.2rem)" }}
          >
            Signaux faibles
          </h2>
          <p
            className="mt-1 text-slate-400"
            style={{ fontSize: "clamp(0.72rem, 0.7rem + 0.08vw, 0.8rem)", maxWidth: "58ch" }}
          >
            Pas urgent, mais à garder dans le viseur cette semaine.
          </p>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-200"
          aria-hidden
        >
          <Eye className="h-4 w-4" />
        </span>
      </header>

      <div className="mt-4">
        {!hasSignals ? (
          <p
            className="rounded-xl border border-emerald-300/25 bg-emerald-500/[0.08] px-3.5 py-3 text-emerald-100"
            style={{ fontSize: "clamp(0.78rem, 0.76rem + 0.1vw, 0.86rem)" }}
          >
            Aucun signal faible détecté. Tu peux te concentrer sur le pilotage long terme.
          </p>
        ) : (
          <ul role="list" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {signals.map((signal) => (
              <li key={signal.id}>
                <Link
                  href={signal.href}
                  className={`group flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 transition hover:-translate-y-0.5 hover:border-indigo-300/35 hover:bg-white/[0.045] ${hubFocusRingClass}`}
                >
                  <span
                    className="flex h-9 min-w-[2.5rem] shrink-0 items-center justify-center rounded-lg border border-indigo-300/25 bg-indigo-500/[0.08] px-2 text-[0.8rem] font-bold text-indigo-100 tabular-nums"
                    aria-hidden
                  >
                    {signal.count}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className="block font-semibold text-slate-100"
                      style={{ fontSize: "clamp(0.8rem, 0.78rem + 0.1vw, 0.88rem)" }}
                    >
                      {signal.label}
                    </span>
                    <span
                      className="mt-0.5 block text-slate-400 group-hover:text-slate-300"
                      style={{ fontSize: "clamp(0.7rem, 0.68rem + 0.08vw, 0.76rem)", lineHeight: 1.45 }}
                    >
                      {signal.hint}
                    </span>
                  </span>
                  <ArrowRight
                    className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
