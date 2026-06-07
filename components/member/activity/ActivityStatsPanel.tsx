"use client";

import Link from "next/link";
import { ArrowRight, Flame, GraduationCap, LayoutGrid, Users, Zap } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { ACTIVITY_ACCENT } from "@/components/member/activity/activityUtils";

type ActivityStatsPanelProps = {
  raidsLive: number;
  eventPresences: number;
  participation: number;
  formationsThisMonth: number;
  formationsTotal: number;
};

function StatCard(props: {
  title: string;
  value: number;
  sub: string;
  icon: typeof Zap;
  gradient: string;
  border: string;
  href: string;
}) {
  const Icon = props.icon;
  return (
    <Link
      href={props.href}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${props.gradient} ${props.border} p-4 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/35`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/65">{props.title}</p>
          <p className="mt-1 text-3xl font-black text-white tabular-nums">{props.value}</p>
          <p className="mt-2 text-[11px] leading-snug text-white/55">{props.sub}</p>
        </div>
        <Icon className="h-9 w-9 shrink-0 text-white/35 transition group-hover:text-white/55" aria-hidden />
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white/50 opacity-0 transition group-hover:opacity-100">
        Explorer <ArrowRight className="h-3 w-3" aria-hidden />
      </span>
    </Link>
  );
}

export default function ActivityStatsPanel({
  raidsLive,
  eventPresences,
  participation,
  formationsThisMonth,
  formationsTotal,
}: ActivityStatsPanelProps) {
  return (
    <DashboardPanel
      id="activity-stats"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-stats-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Synthèse"
        title="Ton mois en chiffres"
        icon={LayoutGrid}
        tone="accent"
        accentHex={ACTIVITY_ACCENT}
        titleId="activity-stats-title"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Raids Twitch"
          value={raidsLive}
          sub="Comptés via hub TENF — indicateur, pas une course."
          icon={Zap}
          gradient="from-amber-500/25 to-orange-950/40"
          border="border-amber-400/35"
          href="/member/raids/historique"
        />
        <StatCard
          title="Présences événements"
          value={eventPresences}
          sub="Validées sur la période affichée."
          icon={Users}
          gradient="from-sky-500/25 to-slate-950/50"
          border="border-sky-400/35"
          href="/member/evenements/presences"
        />
        <StatCard
          title="Actions du mois"
          value={participation}
          sub="Vue agrégée côté TENF."
          icon={Flame}
          gradient="from-rose-500/25 to-purple-950/40"
          border="border-rose-400/35"
          href="/member/progression"
        />
        <StatCard
          title="Formations (mois)"
          value={formationsThisMonth}
          sub={`${formationsTotal} validées au total`}
          icon={GraduationCap}
          gradient="from-emerald-500/25 to-teal-950/40"
          border="border-emerald-400/35"
          href="/member/formations"
        />
      </div>
    </DashboardPanel>
  );
}
