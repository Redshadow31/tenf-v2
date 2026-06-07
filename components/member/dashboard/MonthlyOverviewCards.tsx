"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Flag, Rocket, UserCircle2 } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
  type MonthIndicator,
} from "@/components/member/dashboard/memberDashboardModel";
import DashboardProgressRing from "@/components/member/dashboard/DashboardProgressRing";
import {
  DashboardBadge,
  DashboardPanel,
  DashboardPanelHeader,
  MemberDashedFooterLink,
} from "@/components/member/dashboard/dashboardUi";

const INDICATOR_ICONS = {
  raids: Rocket,
  presences: Calendar,
  profile: UserCircle2,
} as const;

const INDICATOR_TONES: Record<string, string> = {
  raids: "#f59e0b",
  presences: "#38bdf8",
  profile: "#a78bfa",
};

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

type MonthlyOverviewCardsProps = {
  model: MemberDashboardModel;
  variant?: "full" | "sidebar";
};

export default function MonthlyOverviewCards({ model, variant = "full" }: MonthlyOverviewCardsProps) {
  const { accent, monthIndicators, monthProgressLabel, monthLabel } = model;

  if (variant === "sidebar") {
    return (
      <DashboardPanel tone="accent" accentHex={accent} intensity="soft" ariaLabelledBy="dashboard-month-title">
        <DashboardPanelHeader
          kicker={monthLabel}
          title="Tes repères"
          icon={Flag}
          tone="accent"
          accentHex={accent}
          titleId="dashboard-month-title"
          badge={
            <DashboardBadge tone="accent" accentHex={accent}>
              {monthProgressLabel}
            </DashboardBadge>
          }
        />

        <ul className="flex flex-1 flex-col gap-2">
          {monthIndicators.map((indicator) => (
            <SidebarIndicator key={indicator.id} indicator={indicator} accent={accent} />
          ))}
        </ul>

        <MemberDashedFooterLink href="/member/objectifs" className="mt-4">
          Ajuster mes objectifs →
        </MemberDashedFooterLink>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel tone="accent" accentHex={accent} ariaLabelledBy="dashboard-month-title-full">
      <DashboardPanelHeader
        kicker={`Ce mois · ${monthLabel}`}
        title="Tes repères du mois"
        icon={Flag}
        tone="accent"
        accentHex={accent}
        titleId="dashboard-month-title-full"
        badge={
          <DashboardBadge tone="accent" accentHex={accent}>
            {monthProgressLabel}
          </DashboardBadge>
        }
      />

      <div
        className={`grid gap-3 ${
          monthIndicators.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {monthIndicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} accent={accent} />
        ))}
      </div>
    </DashboardPanel>
  );
}

function SidebarIndicator({ indicator, accent }: { indicator: MonthIndicator; accent: string }) {
  const Icon = INDICATOR_ICONS[indicator.id as keyof typeof INDICATOR_ICONS] ?? Rocket;
  const tone = INDICATOR_TONES[indicator.id] ?? accent;
  const progress = getProgressPercent(indicator.current, indicator.target);

  return (
    <li>
      <Link
        href={indicator.href}
        className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/14 hover:bg-white/[0.03]"
        style={{ boxShadow: `inset 0 1px 0 ${hexToRgba(tone, 0.08)}` }}
      >
        <DashboardProgressRing percent={progress} accentHex={tone} size={46} stroke={4} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: tone }} aria-hidden />
            <p className="truncate text-xs font-bold text-white">{indicator.label}</p>
          </div>
          <p className="mt-0.5 text-xl font-black tabular-nums text-white">
            {indicator.current}
            <span className="text-xs font-semibold text-white/40">/{indicator.target}</span>
          </p>
        </div>
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/70"
          aria-hidden
        />
      </Link>
    </li>
  );
}

function IndicatorCard({ indicator, accent }: { indicator: MonthIndicator; accent: string }) {
  const Icon = INDICATOR_ICONS[indicator.id as keyof typeof INDICATOR_ICONS] ?? Rocket;
  const tone = INDICATOR_TONES[indicator.id] ?? accent;
  const progress = getProgressPercent(indicator.current, indicator.target);

  return (
    <Link
      href={indicator.href}
      className="group rounded-xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-white/16"
      style={{ boxShadow: `inset 0 1px 0 ${hexToRgba(tone, 0.1)}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Icon size={16} style={{ color: tone }} aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/50">{indicator.label}</p>
          </div>
          <p className="mt-1.5 text-2xl font-black tabular-nums text-white">
            {indicator.current}
            <span className="text-sm font-semibold text-white/40">/{indicator.target}</span>
          </p>
        </div>
        <DashboardProgressRing percent={progress} accentHex={tone} size={50} />
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${tone}, ${hexToRgba(tone, 0.45)})`,
          }}
        />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] text-white/55">{indicator.microHint}</p>
    </Link>
  );
}
