"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, History, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { ACTIVITY_NEXT_STEPS } from "@/components/member/activity/activityContent";
import { ACTIVITY_ACCENT, formatIsoShort } from "@/components/member/activity/activityUtils";

type UpcomingEvent = {
  id: string;
  title: string;
  date: string;
  category: string;
};

type ActivityUpcomingPanelProps = {
  upcoming: UpcomingEvent[];
};

export default function ActivityUpcomingPanel({ upcoming }: ActivityUpcomingPanelProps) {
  return (
    <DashboardPanel
      id="activity-upcoming"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-upcoming-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Suite"
        title="Prochains rendez-vous"
        icon={CalendarDays}
        tone="cyan"
        accentHex={ACTIVITY_ACCENT}
        titleId="activity-upcoming-title"
        badge={
          <Link href="/member/evenements" className="text-[11px] font-semibold text-cyan-300 hover:text-white">
            Planning complet
          </Link>
        }
      />

      {upcoming.length === 0 ? (
        <p className="text-sm text-white/45">Rien à l&apos;agenda pour l&apos;instant.</p>
      ) : (
        <ul className="space-y-2">
          {upcoming.slice(0, 5).map((ev) => (
            <li key={ev.id} className="rounded-xl border border-white/10 bg-black/25 px-3 py-2">
              <p className="text-sm font-semibold text-white">{ev.title}</p>
              <p className="text-xs text-slate-400">
                {formatIsoShort(ev.date)} · {ev.category}
              </p>
            </li>
          ))}
        </ul>
      )}

      <DashboardInnerCard hover={false} className="mt-4 !p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexToRgba(ACTIVITY_ACCENT, 0.15), color: "#fdba74" }}
          >
            <History className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold text-white">Historique complet</p>
            <p className="mt-1 text-xs leading-relaxed text-white/62">
              Pour une liste chronologique de toutes tes présences enregistrées, ouvre la page dédiée.
            </p>
            <Link
              href="/member/activite/historique"
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Ouvrir l&apos;historique
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      </DashboardInnerCard>

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-white/45">Aller plus loin</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {ACTIVITY_NEXT_STEPS.map((step) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <Sparkles className="h-3 w-3 text-orange-300/80" aria-hidden />
                {step.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </DashboardPanel>
  );
}
