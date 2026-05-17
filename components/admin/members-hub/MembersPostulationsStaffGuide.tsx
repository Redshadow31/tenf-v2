"use client";

import Link from "next/link";
import { FileSearch, HelpCircle, MessageSquare } from "lucide-react";
import { cockpitPanelClass, hubFocusRingClass, hubSectionLabelClass } from "./membersHubStyles";

type Props = {
  totalDossiers: number;
  openCount: number;
  toContactCount: number;
};

export default function MembersPostulationsStaffGuide({ totalDossiers, openCount, toContactCount }: Props) {
  return (
    <section
      className={`${cockpitPanelClass} p-[clamp(1rem,1.5vw,1.35rem)]`}
      aria-labelledby="postulations-staff-guide-heading"
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/15 text-violet-200"
          aria-hidden
        >
          <HelpCircle className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className={hubSectionLabelClass}>Guide staff</p>
          <h2 id="postulations-staff-guide-heading" className="mt-1 text-lg font-semibold text-zinc-100">
            Comment traiter une candidature staff
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Chaque ligne du tableau est un <strong className="font-medium text-zinc-200">dossier complet</strong>{" "}
            (questionnaire + scénarios). Les cartes du haut servent de filtres rapides ; la fiche détaillée s&apos;ouvre
            au clic sur une ligne.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
            <FileSearch className="h-4 w-4 shrink-0" aria-hidden />
            Lecture candidat
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Vérifie motivation, disponibilités, réponses aux scénarios (modération, vocal, stress). Le score auto est une
            aide, pas une décision.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200/90">
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
            Relecture équipe
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Commentaires et avis structurés dans l&apos;onglet Équipe. La{" "}
            <strong className="text-zinc-200">décision finale</strong> (message membre) est réservée aux fondateurs.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">File du jour</p>
          <p className="mt-2 text-sm text-zinc-400">
            {totalDossiers} dossier{totalDossiers > 1 ? "s" : ""} au total
            {openCount > 0 ? ` · ${openCount} ouvert${openCount > 1 ? "s" : ""}` : ""}
            {toContactCount > 0 ? ` · ${toContactCount} à contacter` : ""}. Voir aussi la{" "}
            <Link
              href="/admin/membres/actions"
              className={`text-violet-200 underline-offset-2 hover:underline ${hubFocusRingClass} rounded`}
            >
              file actions
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
