"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarRange, Sparkles, Target } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type AdminAgendaCardProps = {
  model: AdminDashboardModel;
};

export default function AdminAgendaCard({ model }: AdminAgendaCardProps) {
  return (
    <DashboardPanel tone="emerald" accentHex={model.accent} intensity="soft" ariaLabelledBy="admin-agenda-title">
      <DashboardPanelHeader
        kicker={model.agendaKicker}
        title={model.agendaTitle}
        icon={CalendarRange}
        tone="emerald"
        accentHex={model.accent}
        titleId="admin-agenda-title"
      />

      <p className="mb-4 text-xs leading-relaxed text-white/60">{model.agendaIntro}</p>

      <ul className="space-y-2">
        <AgendaRow
          label="Réunion staff"
          value={model.meetingRegistrations}
          hint={`${model.meetingLabel} · ${model.meetingDateLabel}`}
          href="/admin/onboarding/inscriptions"
        />
        <AgendaRow
          label="Prochain événement"
          value={model.nextEventRegistrations}
          hint={model.nextEventLabel}
          href="/admin/events/presence"
        />
        <AgendaRow
          label="Spotlights à venir"
          value={model.upcomingSpotlights}
          hint="Événements spotlight planifiés"
          href="/admin/events/planification"
          icon={Sparkles}
        />
      </ul>
    </DashboardPanel>
  );
}

function AgendaRow({
  label,
  value,
  hint,
  href,
  icon: Icon = CalendarRange,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
  icon?: typeof CalendarRange;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/16"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-lg font-black tabular-nums text-emerald-200 ring-1 ring-white/10">
          {value}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-white">{label}</p>
          <p className="mt-0.5 line-clamp-2 text-[11px] text-white/55">{hint}</p>
        </div>
        <Icon className="h-4 w-4 shrink-0 text-emerald-300/50 group-hover:text-emerald-200/80" aria-hidden />
        <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/70" aria-hidden />
      </Link>
    </li>
  );
}
