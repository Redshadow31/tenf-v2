"use client";

import Link from "next/link";
import { Filter, HelpCircle, TableProperties } from "lucide-react";
import { cockpitPanelClass, hubFocusRingClass, hubSectionLabelClass } from "./membersHubStyles";
import { PRIORITY_LABELS } from "@/lib/admin/members/membersOpsQueue";

type Props = {
  activeFiles: number;
  totalVolume: number;
  p1Files: number;
};

export default function MembersActionsStaffGuide({ activeFiles, totalVolume, p1Files }: Props) {
  return (
    <section
      className={`${cockpitPanelClass} p-[clamp(1rem,1.5vw,1.35rem)]`}
      aria-labelledby="actions-staff-guide-heading"
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
          <h2 id="actions-staff-guide-heading" className="mt-1 text-lg font-semibold text-zinc-100">
            Comment lire cette file d&apos;actions
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Chaque <strong className="font-medium text-zinc-200">ligne</strong> regroupe des dossiers du même type
            (ex. validations profil, sync). Le chiffre « Volume » = nombre de créateurs concernés. Le score aide à
            choisir par quoi commencer dans un même type.
          </p>
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
            <Filter className="h-4 w-4 shrink-0" aria-hidden />
            Filtres
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Utilise les boutons <strong className="text-zinc-200">Priorité</strong> et <strong className="text-zinc-200">Impact</strong>{" "}
            sous les graphiques pour réduire le tableau. Commence par{" "}
            <strong className="text-rose-200">{PRIORITY_LABELS.P1}</strong>.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200/90">
            <TableProperties className="h-4 w-4 shrink-0" aria-hidden />
            Colonne Ouvrir
          </p>
          <p className="mt-2 text-sm text-zinc-400">
            Un clic ouvre la page de traitement (validation, incomplets, revues…). Tu n&apos;as pas à deviner quelle
            section du site utiliser.
          </p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">Hub vs file complète</p>
          <p className="mt-2 text-sm text-zinc-400">
            <Link href="/admin/membres" className={`text-violet-200 underline-offset-2 hover:underline ${hubFocusRingClass} rounded`}>
              Hub membres
            </Link>{" "}
            = les 5 priorités du jour. Ici : {activeFiles} file{activeFiles > 1 ? "s" : ""} actives
            {totalVolume > 0 ? ` · ${totalVolume} dossier${totalVolume > 1 ? "s" : ""}` : ""}
            {p1Files > 0 ? ` · ${p1Files} en P1` : ""}.
          </p>
        </div>
      </div>
    </section>
  );
}
