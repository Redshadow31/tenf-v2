"use client";

import type { ReactNode } from "react";
import {
  evalDIntroClass,
  evalDKickerClass,
  evalDPanelClass,
  evalDTitleClass,
} from "@/lib/admin/evaluation-d/evaluationDStyles";

type Props = {
  kicker?: string;
  title: string;
  intro?: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
  tone?: "neutral" | "accent" | "success" | "warning";
};

const toneStyles: Record<NonNullable<Props["tone"]>, { border: string; glow: string }> = {
  neutral: { border: "border-white/[0.08]", glow: "" },
  accent: {
    border: "border-violet-500/25",
    glow: "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-violet-400/50 before:to-transparent",
  },
  success: {
    border: "border-emerald-500/25",
    glow: "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-emerald-400/50 before:to-transparent",
  },
  warning: {
    border: "border-amber-500/25",
    glow: "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-amber-400/50 before:to-transparent",
  },
};

export function EvaluationDPanel({
  kicker,
  title,
  intro,
  action,
  children,
  className = "",
  tone = "neutral",
}: Props) {
  const t = toneStyles[tone];
  return (
    <section
      className={`${evalDPanelClass} ${t.border} ${t.glow} min-w-0 p-[clamp(1rem,2vw,1.5rem)] ${className}`}
    >
      <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {kicker ? <p className={evalDKickerClass}>{kicker}</p> : null}
          <h2 className={`${evalDTitleClass} ${kicker ? "mt-1" : ""} text-[clamp(1rem,1.35vw,1.25rem)]`}>
            {title}
          </h2>
          {intro ? <p className={`mt-1 max-w-3xl ${evalDIntroClass}`}>{intro}</p> : null}
        </div>
        {action ? (
          <div className="flex w-full min-w-0 shrink-0 flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div>
        ) : null}
      </div>
      {children ? children : null}
    </section>
  );
}

type StatTileProps = {
  label: string;
  value: string | number;
  hint?: string;
  accent?: string;
  icon?: ReactNode;
  compact?: boolean;
  progress?: { value: number; max: number };
};

export function EvaluationDStatTile({
  label,
  value,
  hint,
  accent = "#a78bfa",
  icon,
  compact = false,
  progress,
}: StatTileProps) {
  const pct =
    progress && progress.max > 0
      ? Math.min(100, Math.round((progress.value / progress.max) * 100))
      : null;

  return (
    <div
      className={`relative flex h-full min-h-[92px] flex-col justify-between overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/70 to-zinc-950/50 p-3 ring-1 ring-inset ring-white/[0.03] transition hover:border-white/[0.14] hover:shadow-md hover:shadow-black/20 ${
        compact ? "min-h-[76px] p-2.5" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-20 blur-2xl"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-2">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.13em] text-zinc-500">{label}</p>
        {icon ? (
          <span className="rounded-lg border border-white/[0.06] bg-black/25 p-1.5" style={{ color: accent }}>
            {icon}
          </span>
        ) : null}
      </div>
      <div className="relative">
        <p
          className="text-[clamp(1.1rem,1.6vw,1.35rem)] font-black tabular-nums tracking-tight"
          style={{ color: accent }}
        >
          {value}
        </p>
        {pct !== null ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: accent }}
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        ) : null}
        {hint ? <p className="mt-1 text-[10px] leading-snug text-zinc-500">{hint}</p> : null}
      </div>
    </div>
  );
}

export function EvaluationDSignalCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber";
  icon: ReactNode;
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 to-emerald-950/20"
      : "border-amber-500/30 bg-gradient-to-br from-amber-500/15 to-amber-950/20";
  const labelClass = tone === "emerald" ? "text-emerald-200/80" : "text-amber-200/80";
  const valueClass = tone === "emerald" ? "text-emerald-100" : "text-amber-100";
  const iconClass = tone === "emerald" ? "text-emerald-300" : "text-amber-300";

  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${styles}`}>
      <span className={`shrink-0 ${iconClass}`}>{icon}</span>
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-wide ${labelClass}`}>{label}</p>
        <p className={`text-2xl font-black tabular-nums ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
