"use client";

import Link from "next/link";
import { BookOpen, Compass, HelpCircle, ListChecks, Search, UserCheck } from "lucide-react";
import { cockpitPanelClass, hubFocusRingClass, hubSectionLabelClass } from "./membersHubStyles";

type Props = {
  pendingTotal: number;
  profileValidationPending: number;
};

/**
 * Orientation staff en langage simple — visible dans le main du hub (pas seulement l'aside).
 */
export default function MembersHubStaffGuide({ pendingTotal, profileValidationPending }: Props) {
  return (
    <section
      className={`${cockpitPanelClass} p-[clamp(1rem,1.5vw,1.35rem)]`}
      aria-labelledby="members-staff-guide-heading"
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
          <h2
            id="members-staff-guide-heading"
            className="mt-1 text-lg font-semibold text-zinc-100"
          >
            Comment utiliser cette page (sans être expert TENF)
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
            Ce hub te dit <strong className="font-medium text-zinc-200">quoi faire en premier</strong> pour les
            créateurs. Tu n&apos;as pas besoin de connaître tout l&apos;admin : suis la file du jour, puis ouvre la
            page indiquée en cliquant sur chaque ligne.
          </p>
        </div>
      </div>

      <ol className="mt-5 grid min-w-0 gap-3 sm:grid-cols-3">
        <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-rose-200/90">
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            1 · À traiter aujourd&apos;hui
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            <span className="text-rose-200">Urgent</span> = créateur bloqué.{" "}
            <span className="text-amber-200">Important</span> = cette semaine. Clique une ligne pour aller à la bonne
            page — pas besoin de chercher dans le menu.
          </p>
          {pendingTotal > 0 ? (
            <p className="mt-2 text-xs text-zinc-500">
              {pendingTotal} action{pendingTotal > 1 ? "s" : ""} ouverte au total (file complète dans Actions).
            </p>
          ) : null}
        </li>
        <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-200/90">
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            2 · Trouver un créateur
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Pseudo Twitch ou Discord inconnu ? Utilise{" "}
            <Link
              href="/admin/membres/gestion"
              className={`text-violet-200 underline-offset-2 hover:underline ${hubFocusRingClass} rounded`}
            >
              Liste & gestion
            </Link>{" "}
            (barre de recherche en haut). Tu peux changer le rôle, activer, ou ouvrir la fiche.
          </p>
        </li>
        <li className="rounded-xl border border-white/[0.08] bg-zinc-900/40 p-4">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-200/90">
            <Compass className="h-4 w-4 shrink-0" aria-hidden />
            3 · Nouveau après intégration
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Membre fraîchement accueilli en session ? Passe d&apos;abord par{" "}
            <Link
              href="/admin/onboarding"
              className={`text-violet-200 underline-offset-2 hover:underline ${hubFocusRingClass} rounded`}
            >
              Intégration
            </Link>{" "}
            (présences → activation), puis reviens ici pour le statut Affilié.
          </p>
          {profileValidationPending > 0 ? (
            <Link
              href="/admin/membres/validation-profil"
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-200 hover:underline ${hubFocusRingClass} rounded`}
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden />
              {profileValidationPending} validation{profileValidationPending > 1 ? "s" : ""} profil en attente
            </Link>
          ) : null}
        </li>
      </ol>

      <p className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5 text-xs text-zinc-500">
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
        Les compteurs viennent de la base membres réelle. Un « 0 » ou « tout est calme » signifie qu&apos;il n&apos;y a
        rien de bloquant — ce n&apos;est pas une erreur d&apos;affichage.
      </p>
    </section>
  );
}
