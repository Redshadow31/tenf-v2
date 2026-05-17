"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ClipboardList, ListChecks, Shield } from "lucide-react";
import { cockpitBtnClass, cockpitPanelClass, hubFocusRingClass } from "./membersHubStyles";

type ReminderItem = {
  tone: string;
  dot: string;
  content: ReactNode;
};

const PIPELINE_STEPS = ["Réception", "Contact", "Entretien", "Décision"] as const;

const STAFF_REMINDERS: ReminderItem[] = [
  {
    tone: "text-sky-200",
    dot: "bg-sky-300",
    content: (
      <>
        <strong className="text-zinc-100">Nouveau</strong> = dossier reçu, pas encore traité.{" "}
        <strong className="text-zinc-100">À contacter</strong> = premier échange à faire (Discord, mail).
      </>
    ),
  },
  {
    tone: "text-violet-200",
    dot: "bg-violet-300",
    content: (
      <>
        <strong className="text-zinc-100">Entretien prévu</strong> = créneau fixé ou en cours de planification. Passe en{" "}
        <strong className="text-zinc-100">Accepté / Refusé</strong> seulement après relecture équipe complète.
      </>
    ),
  },
  {
    tone: "text-rose-200",
    dot: "bg-rose-300",
    content: (
      <>
        Les <strong className="text-zinc-100">signalements sensibles</strong> (red flag) demandent une lecture attentive
        avant tout contact — ne pas les noyer dans la file « nouveaux ».
      </>
    ),
  },
  {
    tone: "text-amber-200",
    dot: "bg-amber-300",
    content: (
      <>
        Dans la fiche : onglet <strong className="text-zinc-100">Candidat</strong> = réponses du questionnaire ; onglet{" "}
        <strong className="text-zinc-100">Équipe</strong> = avis croisés, notes et décision fondateur.
      </>
    ),
  },
  {
    tone: "text-emerald-200",
    dot: "bg-emerald-300",
    content: (
      <>
        Ce n&apos;est <strong className="text-zinc-100">pas</strong> la validation profil créateur ni l&apos;intégration
        onboarding — ici on recrute du <strong className="text-zinc-100">staff</strong> (modération / soutien).
      </>
    ),
  },
];

const RECOMMENDED_PATH = [
  "Filtrer « Dossiers ouverts » ou « Boîte nouveaux » pour la file du jour.",
  "Ouvrir une ligne → lire le questionnaire et les scénarios.",
  "Mettre à jour le statut, assigner un référent, noter l'équipe.",
  "Décision fondateur + message membre si le dossier est mûr.",
];

type Props = {
  openCount: number;
  toContactCount: number;
  flaggedCount: number;
};

export default function MembersPostulationsCockpitAside({
  openCount,
  toContactCount,
  flaggedCount,
}: Props) {
  return (
    <>
      <div className={`${cockpitPanelClass} p-4`}>
        <Link
          href="/admin/membres"
          className={`inline-flex items-center gap-1 text-sm text-zinc-400 transition hover:text-white ${hubFocusRingClass} rounded-lg`}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          Hub membres
        </Link>
        <p className="mt-3 text-xs leading-relaxed text-zinc-500">
          Candidatures modération & soutien — pipeline staff dédié au recrutement interne.
        </p>
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Pipeline</h2>
        <ol className="mt-3 flex flex-wrap gap-2">
          {PIPELINE_STEPS.map((step, i) => (
            <li
              key={step}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
            >
              {i + 1}. {step}
            </li>
          ))}
        </ol>
        {openCount > 0 ? (
          <p className="mt-3 rounded-lg border border-violet-400/25 bg-violet-950/20 px-3 py-2 text-xs text-violet-100">
            {openCount} dossier{openCount > 1 ? "s" : ""} ouvert{openCount > 1 ? "s" : ""}
            {toContactCount > 0 ? ` · ${toContactCount} à contacter` : ""}
          </p>
        ) : (
          <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-100">
            Aucun dossier ouvert dans le pipeline.
          </p>
        )}
        {flaggedCount > 0 ? (
          <p className="mt-2 rounded-lg border border-rose-400/25 bg-rose-950/20 px-3 py-2 text-xs text-rose-100">
            {flaggedCount} signalement{flaggedCount > 1 ? "s" : ""} sensible{flaggedCount > 1 ? "s" : ""} à examiner.
          </p>
        ) : null}
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels staff</h2>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          {STAFF_REMINDERS.map((item, i) => (
            <li key={i} className={`flex gap-2.5 ${item.tone}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Parcours conseillé</h2>
        <ol className="mt-3 space-y-2.5 text-sm text-zinc-400">
          {RECOMMENDED_PATH.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold tabular-nums text-violet-300">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Raccourcis</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/admin/membres/actions"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            File actions membres
          </Link>
          <Link href="/admin/membres/gestion" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <Shield className="h-4 w-4 shrink-0" aria-hidden />
            Liste & gestion
          </Link>
          <Link
            href="/admin/membres"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
          >
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            Retour hub
          </Link>
        </div>
      </div>
    </>
  );
}
