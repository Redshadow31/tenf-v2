"use client";

import Link from "next/link";
import {
  ChevronLeft,
  GraduationCap,
  ListChecks,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { cockpitBtnClass, cockpitPanelClass, hubFocusRingClass } from "./membersHubStyles";

type Props = {
  newCount?: number;
  incompleteCount?: number;
  inactiveCount?: number;
};

export default function MembersGestionCockpitAside({
  newCount = 0,
  incompleteCount = 0,
  inactiveCount = 0,
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
          Annuaire central : recherche, filtres KPI, actions de masse et fiches individuelles.
        </p>
      </div>
      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Rappels staff</h2>
        <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-zinc-400">
          <li className="flex gap-2 text-amber-200/95">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" aria-hidden />
            Les pastilles en haut filtrent la liste — clique pour voir Nouveaux, Inactifs, etc.
          </li>
          <li className="flex gap-2 text-violet-200/95">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300" aria-hidden />
            La barre de recherche accepte pseudo Twitch, Discord ou nom affiché.
          </li>
          <li className="flex gap-2 text-emerald-200/95">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" aria-hidden />
            Pour la file des tâches du jour, retourne au hub Membres (pas cette page).
          </li>
        </ul>
      </div>
      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Raccourcis filtres</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/admin/membres/gestion?tab=nouveaux"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-violet-400/30 bg-violet-950/25 text-violet-100`}
          >
            <Users className="h-4 w-4 shrink-0" aria-hidden />
            Nouveaux
            {newCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">{newCount}</span>
            ) : null}
          </Link>
          <Link
            href="/admin/membres/gestion?tab=inactifs"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-rose-400/25 bg-rose-950/20 text-rose-100`}
          >
            Suivi communauté
            {inactiveCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">{inactiveCount}</span>
            ) : null}
          </Link>
          <Link
            href="/admin/membres/incomplets"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-amber-400/25 bg-amber-950/20 text-amber-100`}
          >
            À compléter
            {incompleteCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-xs font-bold tabular-nums">{incompleteCount}</span>
            ) : null}
          </Link>
        </div>
      </div>
      <div className={`${cockpitPanelClass} p-4`}>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Autres outils</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Link href="/admin/membres/actions" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
            File d&apos;actions
          </Link>
          <Link
            href="/admin/membres/validation-profil"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-white/10 bg-white/[0.04] text-zinc-300`}
          >
            <UserCheck className="h-4 w-4 shrink-0" aria-hidden />
            Validation profil
          </Link>
          <Link href="/admin/search" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center`}>
            <Search className="h-4 w-4 shrink-0" aria-hidden />
            Recherche globale
          </Link>
          <Link
            href="/admin/onboarding"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-indigo-400/25 bg-indigo-950/25 text-indigo-100`}
          >
            <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
            Intégration
          </Link>
        </div>
      </div>
    </>
  );
}
