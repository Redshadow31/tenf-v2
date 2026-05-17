"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, LayoutList, ListChecks, UserCheck } from "lucide-react";
import { cockpitBtnClass, cockpitPanelClass, hubFocusRingClass } from "./membersHubStyles";
import { IMPACT_LABELS, PRIORITY_LABELS } from "@/lib/admin/members/membersOpsQueue";

type ReminderItem = {
  tone: string;
  dot: string;
  content: ReactNode;
};

const STAFF_REMINDERS: ReminderItem[] = [
  {
    tone: "text-rose-200",
    dot: "bg-rose-300",
    content: (
      <>
        <strong className="text-zinc-100">{PRIORITY_LABELS.P1}</strong> = créateurs bloqués ou risque fort. Traite
        ces lignes en premier, dans l&apos;ordre du score (plus haut = plus urgent).
      </>
    ),
  },
  {
    tone: "text-amber-200",
    dot: "bg-amber-300",
    content: (
      <>
        <strong className="text-zinc-100">{PRIORITY_LABELS.P2}</strong> = important cette semaine, sans blocage
        immédiat. Planifie après les P1.
      </>
    ),
  },
  {
    tone: "text-sky-200",
    dot: "bg-sky-300",
    content: (
      <>
        <strong className="text-zinc-100">{PRIORITY_LABELS.P3}</strong> = suivi ou prévention. Tu peux les laisser
        pour plus tard si la file P1 est vide.
      </>
    ),
  },
  {
    tone: "text-violet-200",
    dot: "bg-violet-300",
    content: (
      <>
        Chaque ligne a un bouton <strong className="text-zinc-100">Ouvrir</strong> : il mène à la page qui règle le
        problème (validation, sync, revues…). Pas besoin de chercher dans le menu.
      </>
    ),
  },
  {
    tone: "text-emerald-200",
    dot: "bg-emerald-300",
    content: (
      <>
        Le <strong className="text-zinc-100">hub Membres</strong> ne montre que le top 5 du jour. Ici tu vois{" "}
        <strong className="text-zinc-100">toute la file</strong> avec filtres et volumes réels.
      </>
    ),
  },
];

const RECOMMENDED_PATH = [
  "Filtrer sur P1 pour ne voir que l'urgent.",
  "Ouvrir la première ligne (score le plus élevé) et traiter sur la page cible.",
  "Actualiser la file quand tu as fini un lot de dossiers.",
  "Revenir au hub Membres pour la vue « à traiter aujourd'hui » et les rappels généraux.",
];

type Props = {
  totalVolume: number;
  p1Files: number;
};

export default function MembersActionsCockpitAside({ totalVolume, p1Files }: Props) {
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
          File complète des actions — complète le résumé du hub, sans doublon de logique métier.
        </p>
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels staff</h2>
        <p className="mt-1 text-xs text-zinc-500">Priorités, impacts et bouton Ouvrir — en langage simple.</p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          {STAFF_REMINDERS.map((item, i) => (
            <li key={i} className={`flex gap-2.5 ${item.tone}`}>
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.dot}`} aria-hidden />
              <span>{item.content}</span>
            </li>
          ))}
        </ul>
        {p1Files > 0 ? (
          <p className="mt-3 rounded-lg border border-rose-400/25 bg-rose-950/20 px-3 py-2 text-xs text-rose-100">
            {p1Files} type{p1Files > 1 ? "s" : ""} de file en P1 · {totalVolume} dossier{totalVolume > 1 ? "s" : ""} au
            total sur ce filtre.
          </p>
        ) : totalVolume === 0 ? (
          <p className="mt-3 rounded-lg border border-emerald-400/25 bg-emerald-950/20 px-3 py-2 text-xs text-emerald-100">
            Aucun volume en attente : la file est vide pour l&apos;instant.
          </p>
        ) : null}
      </div>

      <div className={`${cockpitPanelClass} p-4 sm:p-5`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Légende impacts</h2>
        <ul className="mt-3 space-y-2 text-xs text-zinc-400">
          <li>
            <span className="text-fuchsia-200">{IMPACT_LABELS.onboarding}</span> — arrivée / intégration créateur
          </li>
          <li>
            <span className="text-orange-200">{IMPACT_LABELS.moderation}</span> — staff, charte, postulations
          </li>
          <li>
            <span className="text-cyan-200">{IMPACT_LABELS.qualite_data}</span> — sync, IDs, cohérence fiches
          </li>
          <li>
            <span className="text-zinc-300">{IMPACT_LABELS.processus_interne}</span> — revues, process internes
          </li>
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
          <Link href="/admin/membres/gestion" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <LayoutList className="h-4 w-4 shrink-0" aria-hidden />
            Liste & gestion
          </Link>
          <Link
            href="/admin/membres/validation-profil"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
          >
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
            Validation profil
          </Link>
          <Link href="/admin/membres" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            Retour hub (top 5)
          </Link>
        </div>
      </div>
    </>
  );
}
