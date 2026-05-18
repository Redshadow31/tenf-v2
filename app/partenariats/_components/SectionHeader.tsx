import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { PARTENARIATS_ACCENT } from "../_data";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  lead?: ReactNode;
  className?: string;
  accent?: string;
  icon?: LucideIcon;
  /** Panneau avec halo et ligne d'accent (sections clés) */
  panel?: boolean;
}

/**
 * En-tête de section partagée par /partenariats.
 */
export default function SectionHeader({
  kicker,
  title,
  lead,
  className,
  accent = PARTENARIATS_ACCENT,
  icon: Icon,
  panel = false,
}: SectionHeaderProps) {
  const inner = (
    <header className={`relative space-y-2 ${className ?? ""}`} style={{ maxWidth: panel ? "100%" : "min(60rem, 100%)" }}>
      <div className="flex flex-wrap items-start gap-3">
        {Icon ? (
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/[0.06]"
            style={{ backgroundColor: `${accent}22`, color: accent }}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-2">
          <p
            className="font-bold uppercase tracking-[0.16em]"
            style={{ fontSize: "clamp(0.6875rem, 0.62rem + 0.2vw, 0.875rem)", color: accent }}
          >
            {kicker}
          </p>
          <h2
            className="home-section-title font-extrabold tracking-tight"
            style={{ fontSize: "clamp(1.25rem, 1rem + 1.2vw, 2.25rem)" }}
          >
            {title}
          </h2>
          {lead ? (
            <p
              className="home-muted leading-relaxed"
              style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)", maxWidth: "min(52rem, 100%)" }}
            >
              {lead}
            </p>
          ) : null}
        </div>
      </div>
    </header>
  );

  if (!panel) return inner;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/[0.06] px-4 py-4 sm:px-5 sm:py-5"
      style={{
        background: `linear-gradient(135deg, ${accent}12 0%, color-mix(in srgb, var(--color-card) 92%, transparent) 55%)`,
        borderColor: `${accent}28`,
      }}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}88, transparent)` }}
        aria-hidden
      />
      {inner}
    </div>
  );
}
