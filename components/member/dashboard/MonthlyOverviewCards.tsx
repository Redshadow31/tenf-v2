"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Flag, Info, Rocket, UserCircle2 } from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
  type MonthIndicator,
} from "@/components/member/dashboard/memberDashboardModel";
import DashboardScoreRing from "@/components/member/dashboard/DashboardScoreRing";

const INDICATOR_ICONS = {
  raids: Rocket,
  presences: Calendar,
  profile: UserCircle2,
  network: Flag,
} as const;

function getProgressPercent(current: number, target: number): number {
  if (target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)));
}

type MonthlyOverviewCardsProps = {
  model: MemberDashboardModel;
};

export default function MonthlyOverviewCards({ model }: MonthlyOverviewCardsProps) {
  const { accent, monthIndicators, globalProgress, progressBreakdown, monthLabel } = model;

  return (
    <section
      aria-labelledby="dashboard-month-title"
      className="rounded-3xl border p-5 md:p-7"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "rgba(20,20,26,0.85)",
      }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ color: hexToRgba(accent, 0.92) }}
          >
            Ce mois en un coup d&apos;œil · {monthLabel}
          </p>
          <h2
            id="dashboard-month-title"
            className="mt-1 text-xl font-bold md:text-2xl"
            style={{ color: "var(--color-text)" }}
          >
            Tes repères du mois
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/65">
            Ce sont des repères personnels, pas une note. Tu peux les ajuster sur ta page Objectifs.
          </p>
        </div>
        <DashboardScoreRing percent={globalProgress} accentHex={accent} size={108} caption="" />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {monthIndicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} accent={accent} />
        ))}
      </div>

      <p
        className="mt-4 inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.04)",
          color: "rgba(236,236,239,0.7)",
        }}
        role="note"
      >
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>{progressBreakdown}</span>
      </p>
    </section>
  );
}

function IndicatorCard({ indicator, accent }: { indicator: MonthIndicator; accent: string }) {
  const Icon = INDICATOR_ICONS[indicator.id];
  const progress = getProgressPercent(indicator.current, indicator.target);

  return (
    <Link
      href={indicator.href}
      className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        background: "linear-gradient(155deg, rgba(34,34,40,0.96), rgba(20,20,24,0.98))",
        boxShadow: "0 10px 22px rgba(0, 0, 0, 0.25)",
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-white/55">
          {indicator.label}
        </p>
        <Icon size={18} style={{ color: hexToRgba(accent, 0.92) }} aria-hidden />
      </div>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/40">{indicator.hint}</p>
      <p
        className="mt-2 text-3xl font-bold tabular-nums"
        style={{ color: "var(--color-text)" }}
      >
        {indicator.current}
        <span className="text-base font-semibold text-white/45">/{indicator.target}</span>
      </p>
      <div className="mt-3 h-2 rounded-full bg-white/10" aria-hidden>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${hexToRgba(accent, 0.95)}, ${hexToRgba(accent, 0.55)})`,
          }}
        />
      </div>
      <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-white/60">
        {indicator.microHint}
      </p>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-0 transition group-hover:opacity-100"
        style={{ color: hexToRgba(accent, 0.95) }}
      >
        Ouvrir
        <ArrowUpRight size={12} aria-hidden />
      </span>
    </Link>
  );
}
