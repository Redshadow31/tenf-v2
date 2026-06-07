"use client";

import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CalendarRange,
  ChevronLeft,
  LayoutDashboard,
  ListChecks,
  Radio,
  Shield,
} from "lucide-react";
import type { PilotageCopyModel } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { cockpitBtnClass, hubFocusRingClass, hubSubCardClass } from "@/components/admin/members-hub/membersHubStyles";

type MeetingInfo = {
  label: string;
  dateLabel: string;
  registrations: number;
};

type Props = {
  copy: PilotageCopyModel;
  meeting?: MeetingInfo;
};

export default function PilotagePageAside({ copy, meeting }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" intensity="medium" className="h-full">
      <MembersHubPanelHeader
        kicker="Navigation"
        title="Raccourcis cockpit"
        intro={copy.aside.dashboardIntro}
        accentHex={copy.accent}
      />

      {meeting ? (
        <div className={`${hubSubCardClass} mb-3 p-3`}>
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/80">Prochaine réunion</p>
          <p className="mt-1 text-sm font-bold text-white">{meeting.label}</p>
          <p className="text-xs text-zinc-400">{meeting.dateLabel}</p>
          <p className="mt-1 text-lg font-bold tabular-nums text-white">{meeting.registrations}</p>
          <p className="text-[11px] text-zinc-500">inscrit(s)</p>
          <p className="mt-2 text-[11px] leading-relaxed italic text-violet-200/70">{copy.aside.meetingHint}</p>
        </div>
      ) : null}

      <Link
        href="/admin/dashboard"
        className={`${cockpitBtnClass} ${hubFocusRingClass} mb-2 w-full justify-center`}
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
        {copy.aside.dashboardLabel}
      </Link>

      <div className={`${hubSubCardClass} p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{copy.aside.opsTitle}</h3>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          <Link href="/admin/control-center" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Radio className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Control center
          </Link>
          <Link href="/admin/pilotage/backlog" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <ListChecks className="h-3.5 w-3.5 shrink-0" aria-hidden />
            File d&apos;actions
          </Link>
          <Link href="/admin/pilotage/ops-live" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Activity className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Ops live
          </Link>
          <Link href="/admin/pilotage/data-health" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center px-2 py-2 text-xs`}>
            <Shield className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Data health
          </Link>
        </div>
      </div>

      <div className={`${hubSubCardClass} mt-2 p-3`}>
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{copy.aside.toolsTitle}</h3>
        <div className="mt-2 flex flex-col gap-1.5">
          <Link href="/admin/events/planification" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center text-xs`}>
            <CalendarRange className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Planification événements
          </Link>
          <Link href="/admin/membres" className={`${cockpitBtnClass} ${hubFocusRingClass} justify-center text-xs`}>
            <ChevronLeft className="h-3.5 w-3.5 shrink-0 rotate-180" aria-hidden />
            Hub membres
          </Link>
          <Link
            href="/admin/control-center"
            className={`inline-flex items-center justify-center gap-1 rounded-xl border border-violet-400/35 bg-violet-600/20 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/30 ${hubFocusRingClass}`}
          >
            Ouvrir le control center
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </MembersHubPanel>
  );
}
