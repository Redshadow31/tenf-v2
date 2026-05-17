"use client";

import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

/** Layout fluide */
export const GUIDE_FLUID = {
  shell: "w-full min-w-0",
  px: "px-[clamp(1rem,2.5vw,3rem)]",
  sectionGap: "gap-[clamp(1rem,2vw,2.5rem)]",
  grid3:
    "grid w-full min-w-0 grid-cols-1 gap-[clamp(1rem,2vw,2.5rem)] xl:grid-cols-[minmax(12.5rem,14vw)_minmax(0,1fr)_minmax(13rem,16vw)] 2xl:grid-cols-[minmax(14rem,13vw)_minmax(0,1fr)_minmax(15rem,14vw)]",
  cardGrid: "grid gap-[clamp(0.75rem,1.5vw,1.25rem)] grid-cols-[repeat(auto-fill,minmax(min(100%,17.5rem),1fr))]",
  pageCardGrid: "grid gap-[clamp(0.75rem,1.5vw,1.25rem)] grid-cols-[repeat(auto-fill,minmax(min(100%,19rem),1fr))]",
} as const;

const GLASS_BLUR = "backdrop-blur-xl backdrop-saturate-[1.35]";

/** Accent par défaut (violet TENF) */
export const GUIDE_DEFAULT_ACCENT = "#a78bfa";

export function guideGlassSurface(accent = GUIDE_DEFAULT_ACCENT, strength: "soft" | "base" | "lifted" = "base"): CSSProperties {
  const bgAlpha = strength === "soft" ? 0.42 : strength === "lifted" ? 0.62 : 0.52;
  const accentAlpha = strength === "soft" ? 0.06 : strength === "lifted" ? 0.14 : 0.09;
  return {
    backgroundColor: `color-mix(in srgb, var(--color-card) ${Math.round(bgAlpha * 100)}%, transparent)`,
    backgroundImage: `linear-gradient(145deg, color-mix(in srgb, ${accent} ${Math.round(accentAlpha * 100)}%, transparent) 0%, transparent 55%)`,
    borderColor: `color-mix(in srgb, ${accent} 22%, color-mix(in srgb, white 8%, var(--color-border)))`,
    boxShadow:
      strength === "lifted"
        ? `0 1px 0 color-mix(in srgb, white 10%, transparent) inset, 0 20px 48px -20px color-mix(in srgb, ${accent} 18%, transparent), 0 8px 24px -12px rgba(0,0,0,0.35)`
        : `0 1px 0 color-mix(in srgb, white 8%, transparent) inset, 0 12px 32px -16px rgba(0,0,0,0.28)`,
  };
}

export const guideGlassClass = `${GLASS_BLUR} border transition-[border-color,box-shadow,transform] duration-300 ease-out`;

/** Fond ambiant de la page guide */
export function GuideAmbientBackground() {
  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-70 motion-safe:animate-mesh"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 8% 0%, color-mix(in srgb, #8b5cf6 22%, transparent), transparent 55%), radial-gradient(ellipse 60% 45% at 92% 8%, color-mix(in srgb, #22d3ee 16%, transparent), transparent 50%), radial-gradient(ellipse 50% 40% at 50% 100%, color-mix(in srgb, #f472b6 10%, transparent), transparent 45%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, color-mix(in srgb, var(--color-bg) 0%, transparent) 0%, var(--color-bg) 85%)",
        }}
        aria-hidden
      />
    </>
  );
}

export function GuideAccentOrb({ accent, className = "" }: { accent: string; className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{
        background: `radial-gradient(circle, color-mix(in srgb, ${accent} 35%, transparent) 0%, transparent 70%)`,
      }}
      aria-hidden
    />
  );
}

export function GuideGlassCard({
  accent = GUIDE_DEFAULT_ACCENT,
  strength = "base",
  className = "",
  children,
  hover = true,
}: {
  accent?: string;
  strength?: "soft" | "base" | "lifted";
  className?: string;
  children: ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${guideGlassClass} ${hover ? "hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-18px_color-mix(in_srgb,var(--color-text)_25%,transparent)]" : ""} ${className}`}
      style={guideGlassSurface(accent, strength)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, color-mix(in srgb, white 18%, transparent), transparent)" }}
        aria-hidden
      />
      {children}
    </div>
  );
}

export function GuideGlassButton({
  href,
  onClick,
  children,
  variant = "primary",
  accent = GUIDE_DEFAULT_ACCENT,
  className = "",
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  variant?: "primary" | "ghost" | "glass";
  accent?: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition duration-300 ease-out";

  const styles: Record<string, CSSProperties> = {
    primary: {
      background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 85%, #6366f1), color-mix(in srgb, ${accent} 55%, #4f46e5))`,
      color: "#fff",
      boxShadow: `0 1px 0 color-mix(in srgb, white 25%, transparent) inset, 0 8px 24px -6px color-mix(in srgb, ${accent} 45%, transparent)`,
      border: `1px solid color-mix(in srgb, white 15%, transparent)`,
    },
    ghost: {
      ...guideGlassSurface(accent, "soft"),
      color: "var(--color-text)",
    },
    glass: {
      ...guideGlassSurface(accent, "soft"),
      color: "var(--color-text-secondary)",
    },
  };

  const cls = `${base} ${variant !== "primary" ? guideGlassClass : ""} hover:brightness-110 ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} style={styles[variant]}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls} style={styles[variant]}>
      {children}
    </button>
  );
}

export function GuideRichText({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold" style={{ color: "var(--color-text)" }}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

export function GuideSectionHeading({
  title,
  subtitle,
  accent = GUIDE_DEFAULT_ACCENT,
  className = "",
}: {
  title: string;
  subtitle?: string;
  accent?: string;
  className?: string;
}) {
  return (
    <header className={className}>
      <div className="flex items-center gap-3">
        <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }} aria-hidden />
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl" style={{ color: "var(--color-text)" }}>
          {title}
        </h2>
      </div>
      {subtitle ? (
        <p className="mt-2 max-w-[min(65ch,100%)] pl-4 text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}

export function GuideKpiStrip({
  items,
  accent = GUIDE_DEFAULT_ACCENT,
}: {
  items: { label: string; value: string; hint?: string }[];
  accent?: string;
}) {
  return (
    <ul className="mt-6 grid grid-cols-[repeat(auto-fill,minmax(min(100%,8rem),1fr))] gap-3">
      {items.map((item) => (
        <li key={item.label} className={`rounded-2xl border p-3 sm:p-4 ${guideGlassClass}`} style={guideGlassSurface(accent, "soft")}>
          <p className="text-lg font-extrabold tabular-nums sm:text-2xl" style={{ color: "var(--color-text)" }}>
            {item.value}
          </p>
          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wide" style={{ color: accent }}>
            {item.label}
          </p>
          {item.hint ? (
            <p className="mt-1 text-[10px] leading-snug" style={{ color: "var(--color-text-muted)" }}>
              {item.hint}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function GuideCallout({
  variant = "tip",
  title,
  children,
  icon: Icon,
  accent,
  className = "",
}: {
  variant?: "tip" | "info" | "goal";
  title: string;
  children: ReactNode;
  icon?: LucideIcon;
  accent?: string;
  className?: string;
}) {
  const accents = {
    tip: accent ?? GUIDE_DEFAULT_ACCENT,
    info: accent ?? "#38bdf8",
    goal: accent ?? "#34d399",
  };
  const a = accents[variant];

  return (
    <aside className={`rounded-2xl border p-4 sm:p-5 ${guideGlassClass} ${className}`} style={guideGlassSurface(a, "soft")}>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em]" style={{ color: a }}>
        {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {title}
      </p>
      <div className="mt-3 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
        {children}
      </div>
    </aside>
  );
}
