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
import type { GestionCopyModel } from "@/lib/admin/members-gestion/gestionCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { cockpitBtnClass, hubFocusRingClass, hubSubCardClass } from "@/components/admin/members-hub/membersHubStyles";

type Props = {
  copy: GestionCopyModel;
  newCount?: number;
  incompleteCount?: number;
  inactiveCount?: number;
};

export default function GestionPageAside({
  copy,
  newCount = 0,
  incompleteCount = 0,
  inactiveCount = 0,
}: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Navigation"
        title={copy.aside.backLabel}
        intro={copy.aside.backIntro}
        accentHex={copy.accent}
      />
      <Link
        href="/admin/membres"
        className={`${cockpitBtnClass} ${hubFocusRingClass} mb-3 w-full justify-center`}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {copy.aside.backLabel}
      </Link>

      <div className={`${hubSubCardClass} p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{copy.aside.filtersTitle}</h3>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <Link
            href="/admin/membres/gestion?tab=nouveaux"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-violet-400/30 bg-violet-950/25 px-2 py-2 text-xs text-violet-100`}
          >
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Nouveaux
            {newCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">{newCount}</span>
            ) : null}
          </Link>
          <Link
            href="/admin/membres/gestion?tab=suivi_pause"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-rose-400/25 bg-rose-950/20 px-2 py-2 text-xs text-rose-100`}
          >
            Suivi
            {inactiveCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">{inactiveCount}</span>
            ) : null}
          </Link>
          <Link
            href="/admin/membres/incomplets"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-amber-400/25 bg-amber-950/20 px-2 py-2 text-xs text-amber-100`}
          >
            À compléter
            {incompleteCount > 0 ? (
              <span className="rounded-md bg-black/25 px-1.5 py-0.5 text-[10px] font-bold tabular-nums">{incompleteCount}</span>
            ) : null}
          </Link>
        </div>
      </div>

      <div className={`${hubSubCardClass} mt-2 p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{copy.aside.toolsTitle}</h3>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Link
            href="/admin/membres/actions"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}
          >
            <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Actions
          </Link>
          <Link
            href="/admin/membres/validation-profil"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-white/10 bg-white/[0.04] px-2 py-2 text-xs text-zinc-300`}
          >
            <UserCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Validations
          </Link>
          <Link
            href="/admin/search"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}
          >
            <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Recherche
          </Link>
          <Link
            href="/admin/onboarding"
            className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center border-indigo-400/25 bg-indigo-950/25 px-2 py-2 text-xs text-indigo-100`}
          >
            <GraduationCap className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Intégration
          </Link>
        </div>
      </div>
    </MembersHubPanel>
  );
}
