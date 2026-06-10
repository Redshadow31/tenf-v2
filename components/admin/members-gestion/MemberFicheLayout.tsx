"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  ficheFieldAccentClass,
  ficheHeroClass,
  ficheIntroClass,
  fichePanelClass,
  ficheScoreBarClass,
  ficheStatCardClass,
  ficheStatCardInteractiveClass,
  ficheStatLabelClass,
  ficheStatToneClass,
  ficheSubPanelClass,
  ficheTableHeadClass,
  ficheTableShellClass,
  ficheTitleClass,
  ficheToneAccentBarClass,
  ficheToneKickerClass,
  ficheTonePanelClass,
  type FicheTone,
} from "@/lib/admin/members-fiche/memberFicheStyles";

type FichePanelProps = {
  children: ReactNode;
  kicker?: string;
  title: string;
  intro?: string;
  tone?: FicheTone;
  className?: string;
  headerRight?: ReactNode;
};

export function MemberFichePanel({
  children,
  kicker,
  title,
  intro,
  tone = "neutral",
  className = "",
  headerRight,
}: FichePanelProps) {
  return (
    <section className={`${ficheTonePanelClass(tone)} ${className}`}>
      <div className={ficheToneAccentBarClass(tone)} aria-hidden />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {kicker ? (
            <p className={ficheToneKickerClass(tone)}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80 shadow-[0_0_6px_currentColor]"
                aria-hidden
              />
              {kicker}
            </p>
          ) : null}
          <h3 className={`${ficheTitleClass} ${kicker ? "mt-1" : ""}`}>{title}</h3>
          {intro ? <p className={`mt-1 max-w-2xl ${ficheIntroClass}`}>{intro}</p> : null}
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  className?: string;
  icon?: LucideIcon;
  onClick?: () => void;
  scoreMax?: number;
  numericValue?: number;
  active?: boolean;
  tone?: FicheTone;
};

export function MemberFicheStatCard({
  label,
  value,
  hint,
  className = "",
  icon: Icon,
  onClick,
  scoreMax,
  numericValue,
  active = false,
  tone = "violet",
}: StatCardProps) {
  const interactive = Boolean(onClick);
  const progressPct =
    scoreMax && numericValue !== undefined && Number.isFinite(numericValue)
      ? Math.min(100, Math.max(0, (numericValue / scoreMax) * 100))
      : null;

  const Wrapper = interactive ? "button" : "div";

  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      onClick={onClick}
      className={`${ficheStatCardClass} text-left ${ficheStatToneClass(tone, active)} ${
        interactive ? ficheStatCardInteractiveClass : ""
      } ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-current to-transparent opacity-25`}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2">
        <p className={ficheStatLabelClass}>{label}</p>
        {Icon ? (
          <Icon
            className={`h-3.5 w-3.5 shrink-0 opacity-70 ${
              tone === "emerald"
                ? "text-emerald-400"
                : tone === "sky"
                  ? "text-sky-400"
                  : tone === "amber"
                    ? "text-amber-400"
                    : tone === "rose"
                      ? "text-rose-400"
                      : tone === "cyan"
                        ? "text-cyan-400"
                        : tone === "indigo"
                          ? "text-indigo-400"
                          : "text-violet-400"
            }`}
            aria-hidden
          />
        ) : null}
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      {progressPct !== null ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${ficheScoreBarClass(numericValue!)}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      ) : null}
      {hint ? <p className="mt-0.5 text-[11px] text-white/40">{hint}</p> : null}
    </Wrapper>
  );
}

export function MemberFicheHeroStat({
  label,
  value,
  onClick,
  active,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
  active?: boolean;
  tone?: FicheTone;
}) {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`${ficheStatCardClass} text-left ${ficheStatToneClass(tone, active)} ${
        onClick ? ficheStatCardInteractiveClass : ""
      }`}
    >
      <p className={ficheStatLabelClass}>{label}</p>
      <p className="mt-1 text-sm font-semibold tracking-tight text-white">{value}</p>
    </Wrapper>
  );
}

export function MemberFicheFieldGrid({
  children,
  cols = 2,
  className = "",
}: {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 1
      ? "grid-cols-1"
      : cols === 3
        ? "grid-cols-1 md:grid-cols-3"
        : cols === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 md:grid-cols-2";
  return <div className={`grid gap-3 ${colClass} ${className}`}>{children}</div>;
}

export function MemberFicheField({
  label,
  value,
  span = 1,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  span?: 1 | 2;
  tone?: FicheTone;
}) {
  return (
    <div
      className={`${ficheSubPanelClass} ${ficheFieldAccentClass(tone)} p-3 pl-3.5 text-sm transition-all duration-200 hover:border-white/[0.12] hover:bg-zinc-900/55 ${
        span === 2 ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 font-semibold leading-snug text-zinc-100">{value}</p>
    </div>
  );
}

export function MemberFicheTableShell({ children, minWidth = "760px" }: { children: ReactNode; minWidth?: string }) {
  return (
    <div className={ficheTableShellClass}>
      <div className="max-h-[min(70vh,520px)] overflow-auto overscroll-contain [scrollbar-gutter:stable] [scrollbar-width:thin]">
        <table className="w-full text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function MemberFicheTableHead({ children }: { children: ReactNode }) {
  return <thead className={`${ficheTableHeadClass} sticky top-0 z-10 backdrop-blur-md`}>{children}</thead>;
}

export function MemberFicheTableRow({
  children,
  selected,
  onClick,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  const className = `border-b border-white/[0.05] transition-colors duration-150 ${
    selected
      ? "bg-violet-500/10 hover:bg-violet-500/14"
      : "hover:bg-white/[0.025]"
  } ${onClick ? "cursor-pointer" : ""}`;

  if (onClick) {
    return (
      <tr
        onClick={onClick}
        className={className}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onClick()}
      >
        {children}
      </tr>
    );
  }
  return <tr className={className}>{children}</tr>;
}

export function MemberFicheHero({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`${ficheHeroClass} p-5 md:p-6 ${className}`}>
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_0%,#000_55%,transparent_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-600/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-cyan-600/8 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-emerald-600/8 blur-3xl" aria-hidden />
      <div className="relative">{children}</div>
    </section>
  );
}

export function MemberFichePageBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(145,70,255,0.08),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_100%_50%,rgba(34,211,238,0.04),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,rgba(52,211,153,0.05),transparent_45%)]" />
    </div>
  );
}

export function MemberFicheContentGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  const colClass =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "grid-cols-1 xl:grid-cols-3" : "grid-cols-1 xl:grid-cols-2";
  return <div className={`grid gap-4 ${colClass}`}>{children}</div>;
}

export function MemberFicheAsidePanel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <aside className={`${fichePanelClass} p-5 ${className}`}>{children}</aside>;
}

export function MemberFicheSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl border border-white/[0.04] bg-gradient-to-br from-white/[0.04] to-white/[0.01]"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-lg border border-white/[0.03] bg-gradient-to-r from-white/[0.03] via-white/[0.05] to-white/[0.02]"
        />
      ))}
    </div>
  );
}
