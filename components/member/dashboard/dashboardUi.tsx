"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import type { WelcomeInsight } from "@/components/member/dashboard/memberDashboardModel";

/** Tokens visuels partagés — dashboard, profil, compléter. */
export const MEMBER_PANEL_RADIUS = "rounded-[1.35rem]";
export const MEMBER_SCROLL_MT = "scroll-mt-[clamp(4rem,9vw,7.5rem)]";
export const MEMBER_HERO_TITLE =
  "text-[1.65rem] font-bold leading-[1.15] tracking-tight text-white md:text-[1.85rem]";
export const MEMBER_MESSAGE_BOX =
  "max-w-2xl rounded-xl border border-white/[0.08] bg-black/25 px-3.5 py-3 backdrop-blur-sm";
export const MEMBER_FOOTER_DIVIDER = "mt-auto flex flex-wrap gap-2 border-t border-white/[0.08] pt-3";

const INSIGHT_TONES: Record<WelcomeInsight["tone"], { border: string; bg: string; text: string }> = {
  accent: { border: "rgba(167,139,250,0.4)", bg: "rgba(167,139,250,0.12)", text: "#ede9fe" },
  success: { border: "rgba(34,197,94,0.4)", bg: "rgba(34,197,94,0.12)", text: "#bbf7d0" },
  warning: { border: "rgba(245,158,11,0.42)", bg: "rgba(245,158,11,0.12)", text: "#fde68a" },
  info: { border: "rgba(56,189,248,0.38)", bg: "rgba(56,189,248,0.1)", text: "#bae6fd" },
  muted: { border: "rgba(255,255,255,0.14)", bg: "rgba(255,255,255,0.05)", text: "rgba(236,236,239,0.78)" },
};

export type DashboardTone =
  | "accent"
  | "violet"
  | "cyan"
  | "amber"
  | "emerald"
  | "gold"
  | "rose"
  | "neutral";

const PRESET_TONES: Record<
  Exclude<DashboardTone, "accent">,
  { hex: string; label: string }
> = {
  violet: { hex: "#9146ff", label: "violet" },
  cyan: { hex: "#38bdf8", label: "cyan" },
  amber: { hex: "#f59e0b", label: "amber" },
  emerald: { hex: "#22c55e", label: "emerald" },
  gold: { hex: "#facc15", label: "gold" },
  rose: { hex: "#f472b6", label: "rose" },
  neutral: { hex: "#a1a1aa", label: "neutral" },
};

export function resolveToneColor(tone: DashboardTone, accentHex: string): string {
  if (tone === "accent") return accentHex;
  return PRESET_TONES[tone].hex;
}

export function panelSurfaceStyle(
  tone: DashboardTone,
  accentHex: string,
  intensity: "soft" | "medium" | "bold" = "medium",
): CSSProperties {
  const color = resolveToneColor(tone, accentHex);
  const alpha = intensity === "soft" ? 0.07 : intensity === "bold" ? 0.16 : 0.11;
  return {
    borderColor: hexToRgba(color, intensity === "bold" ? 0.34 : 0.2),
    background: `linear-gradient(160deg, ${hexToRgba(color, alpha)} 0%, rgba(12,12,16,0.96) 38%, rgba(8,8,12,0.99) 100%)`,
    boxShadow: `0 1px 0 rgba(255,255,255,0.07) inset, 0 20px 44px rgba(0,0,0,0.32), 0 0 0 1px rgba(0,0,0,0.4)`,
  };
}

type DashboardPanelProps = {
  children: ReactNode;
  className?: string;
  tone?: DashboardTone;
  accentHex?: string;
  intensity?: "soft" | "medium" | "bold";
  id?: string;
  ariaLabelledBy?: string;
};

export function DashboardPanel({
  children,
  className = "",
  tone = "neutral",
  accentHex = "#9146ff",
  intensity = "medium",
  id,
  ariaLabelledBy,
}: DashboardPanelProps) {
  return (
    <section
      id={id}
      aria-labelledby={ariaLabelledBy}
      className={`dashboard-panel group/panel relative flex h-full w-full min-w-0 flex-col overflow-hidden ${MEMBER_PANEL_RADIUS} border p-4 backdrop-blur-sm transition-[box-shadow,border-color] duration-300 hover:border-white/[0.16] md:p-5 ${className}`}
      style={panelSurfaceStyle(tone, accentHex, intensity)}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-14 h-36 w-36 rounded-full opacity-60 blur-3xl transition-opacity duration-500 group-hover/panel:opacity-90"
        style={{ background: hexToRgba(resolveToneColor(tone, accentHex), 0.14) }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent"
        aria-hidden
      />
      <div className="relative flex min-h-0 flex-1 flex-col">{children}</div>
    </section>
  );
}

type DashboardPanelHeaderProps = {
  kicker: string;
  title: string;
  icon?: LucideIcon;
  tone?: DashboardTone;
  accentHex?: string;
  badge?: ReactNode;
  titleId?: string;
};

export function DashboardPanelHeader({
  kicker,
  title,
  icon: Icon,
  tone = "neutral",
  accentHex = "#9146ff",
  badge,
  titleId,
}: DashboardPanelHeaderProps) {
  const color = resolveToneColor(tone, accentHex);
  return (
    <div className="mb-3 flex flex-wrap items-start justify-between gap-2 md:mb-4">
      <div className="min-w-0">
        <p
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em]"
          style={{ color: hexToRgba(color, 0.88) }}
        >
          {Icon ? <Icon className="h-3 w-3 shrink-0" aria-hidden /> : null}
          {kicker}
        </p>
        <h2
          id={titleId}
          className="mt-1 text-lg font-bold tracking-tight text-white md:text-xl"
        >
          {title}
        </h2>
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}

export function DashboardBadge({
  children,
  tone = "neutral",
  accentHex = "#9146ff",
}: {
  children: ReactNode;
  tone?: DashboardTone;
  accentHex?: string;
}) {
  const color = resolveToneColor(tone, accentHex);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
      style={{
        borderColor: hexToRgba(color, 0.35),
        backgroundColor: hexToRgba(color, 0.1),
        color: hexToRgba(color, 0.95),
      }}
    >
      {children}
    </span>
  );
}

export function DashboardInnerCard({
  children,
  className = "",
  accentHex,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  accentHex?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-white/[0.1] bg-black/28 px-3 py-2.5 backdrop-blur-sm ${
        hover ? "transition hover:border-white/16 hover:bg-white/[0.04]" : ""
      } ${className}`}
      style={
        accentHex
          ? { boxShadow: `inset 0 1px 0 ${hexToRgba(accentHex, 0.08)}` }
          : undefined
      }
    >
      {children}
    </div>
  );
}

export function DashboardInteractiveLink({
  children,
  className = "",
  accentHex = "#9146ff",
  featured = false,
}: {
  children: ReactNode;
  className?: string;
  accentHex?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`group/link relative overflow-hidden rounded-xl border transition duration-300 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white/80 ${
        featured
          ? "hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.38)]"
          : "hover:-translate-y-px hover:border-white/16"
      } ${className}`}
      style={
        featured
          ? {
              borderColor: hexToRgba(accentHex, 0.42),
              background: `linear-gradient(155deg, ${hexToRgba(accentHex, 0.16)}, rgba(10,10,14,0.96))`,
            }
          : {
              borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }
      }
    >
      {featured ? (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-50 transition group-hover/link:opacity-80"
          style={{ background: hexToRgba(accentHex, 0.45) }}
          aria-hidden
        />
      ) : null}
      <div className="relative">{children}</div>
    </div>
  );
}

export function DashboardAmbientBackground({ accentHex }: { accentHex: string }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute -left-32 top-20 h-[28rem] w-[28rem] rounded-full blur-[100px]"
        style={{ background: hexToRgba(accentHex, 0.08) }}
      />
      <div
        className="absolute -right-24 top-1/3 h-[22rem] w-[22rem] rounded-full blur-[90px]"
        style={{ background: hexToRgba(accentHex, 0.04) }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[18rem] w-[18rem] rounded-full blur-[80px]"
        style={{ background: "rgba(56, 189, 248, 0.045)" }}
      />
    </div>
  );
}

export function MemberWelcomeParagraph({ text }: { text: string }) {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    return <p className="text-sm leading-[1.65] text-white/80">{text}</p>;
  }

  return (
    <div className="space-y-2">
      {sentences.map((sentence, index) => (
        <p
          key={index}
          className={`text-sm leading-[1.65] ${index === 0 ? "font-medium text-white/92" : "text-white/68"}`}
        >
          {sentence}
        </p>
      ))}
    </div>
  );
}

export function MemberInsightChip({ insight }: { insight: WelcomeInsight }) {
  const tone = INSIGHT_TONES[insight.tone];
  return (
    <li>
      <span
        className="inline-flex max-w-full flex-col rounded-xl border px-3 py-2 transition hover:-translate-y-px"
        style={{ borderColor: tone.border, backgroundColor: tone.bg, color: tone.text }}
        title={insight.detail}
      >
        <span className="text-[11px] font-semibold leading-snug">{insight.label}</span>
        {insight.detail ? (
          <span className="mt-0.5 text-[10px] opacity-75">{insight.detail}</span>
        ) : null}
      </span>
    </li>
  );
}

export function MemberHeroStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-xl border border-white/[0.1] bg-black/30 px-3 py-2.5 backdrop-blur-sm transition hover:border-white/18"
      style={{ boxShadow: `inset 0 1px 0 ${hexToRgba(accent, 0.14)}` }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10"
          style={{ backgroundColor: hexToRgba(accent, 0.2), color: hexToRgba(accent, 0.98) }}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">{label}</p>
          <p className="truncate text-sm font-bold tabular-nums text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

export function MemberProgressBar({
  percent,
  accentHex,
  label = "Progression",
}: {
  percent: number;
  accentHex: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-white/45">
        <span>{label}</span>
        <span className="tabular-nums" style={{ color: hexToRgba(accentHex, 0.95) }}>
          {clamped}%
        </span>
      </div>
      <div aria-hidden className="h-2 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{
            width: `${clamped}%`,
            background: `linear-gradient(90deg, ${accentHex}, ${hexToRgba(accentHex, 0.42)})`,
          }}
        />
      </div>
    </div>
  );
}

type MemberCtaProps = {
  children: ReactNode;
  className?: string;
};

export function MemberPrimaryLink({
  href,
  accentHex,
  children,
  className = "",
}: MemberCtaProps & { href: string; accentHex: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5 ${className}`}
      style={{
        backgroundColor: hexToRgba(accentHex, 0.95),
        boxShadow: `0 6px 18px ${hexToRgba(accentHex, 0.32)}`,
      }}
    >
      {children}
    </Link>
  );
}

export function MemberSecondaryLink({
  href,
  children,
  className = "",
}: MemberCtaProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/88 transition hover:border-white/25 hover:bg-white/[0.07] ${className}`}
    >
      {children}
    </Link>
  );
}

export function MemberDashedFooterLink({
  href,
  children,
  className = "",
}: MemberCtaProps & { href: string }) {
  return (
    <Link
      href={href}
      className={`block rounded-xl border border-dashed border-white/12 py-2.5 text-center text-[11px] font-semibold text-white/50 transition hover:border-white/22 hover:text-white/78 ${className}`}
    >
      {children}
    </Link>
  );
}

export function MemberAlert({
  variant,
  children,
}: {
  variant: "success" | "error" | "info";
  children: ReactNode;
}) {
  const styles = {
    success: "border-emerald-500/35 bg-emerald-500/10 text-emerald-100",
    error: "border-red-500/35 bg-red-500/10 text-red-100",
    info: "border-sky-500/35 bg-sky-500/10 text-sky-100",
  } as const;

  return (
    <p className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </p>
  );
}
