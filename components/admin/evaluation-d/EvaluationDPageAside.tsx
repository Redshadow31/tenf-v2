"use client";

import Link from "next/link";
import {
  BarChart3,
  ChevronLeft,
  Database,
  FileCheck,
  LayoutDashboard,
  Mic2,
  Star,
  Users,
} from "lucide-react";
import type { EvaluationDCopyModel } from "@/lib/admin/evaluation-d/evaluationDCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { cockpitBtnClass, hubFocusRingClass, hubSubCardClass } from "@/components/admin/members-hub/membersHubStyles";

type Props = {
  copy: EvaluationDCopyModel;
  pendingEdits: number;
  historyCount: number;
};

export default function EvaluationDPageAside({ copy, pendingEdits, historyCount }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Navigation"
        title={copy.aside.backLabel}
        intro={copy.aside.backIntro}
        accentHex={copy.accent}
      />
      <Link
        href="/admin/evaluation"
        className={`${cockpitBtnClass} ${hubFocusRingClass} mb-3 w-full justify-center`}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
        {copy.aside.backLabel}
      </Link>

      <div className={`${hubSubCardClass} p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {copy.aside.sourcesTitle}
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-3 lg:grid-cols-1">
          <Link href="/admin/evaluation/a" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Star className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
            Section A
          </Link>
          <Link href="/admin/evaluation/b/discord" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Mic2 className="h-3.5 w-3.5 shrink-0 text-indigo-300" aria-hidden />
            Section B
          </Link>
          <Link href="/admin/evaluation/c" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Users className="h-3.5 w-3.5 shrink-0 text-pink-300" aria-hidden />
            Section C
          </Link>
        </div>
      </div>

      <div className={`${hubSubCardClass} mt-2 p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          {copy.aside.workflowTitle}
        </h3>
        <div className="mt-2 grid grid-cols-1 gap-1.5">
          <Link href="/admin/pilotage" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Cockpit pilotage
          </Link>
          <Link href="/admin/evaluation/result" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <FileCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Résultats validés
          </Link>
          {pendingEdits > 0 ? (
            <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-center text-[10px] font-semibold text-amber-200">
              {pendingEdits} modif(s) non enregistrée(s)
            </span>
          ) : null}
          {historyCount > 0 ? (
            <span className="rounded-lg border border-violet-500/25 bg-violet-500/10 px-2 py-1.5 text-center text-[10px] font-semibold text-violet-200">
              {historyCount} trace(s) override ce mois
            </span>
          ) : null}
        </div>
      </div>

      <div className={`${hubSubCardClass} mt-2 p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{copy.aside.toolsTitle}</h3>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Link href="/admin/evaluation/progression" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Progression
          </Link>
          <Link href="/admin/migration/evaluations" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Database className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Migration
          </Link>
        </div>
      </div>
    </MembersHubPanel>
  );
}
