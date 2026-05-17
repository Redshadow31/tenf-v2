import type { ReactNode } from "react";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  lead?: ReactNode;
  className?: string;
}

/**
 * En-tête de section partagée par /partenariats.
 * Reprend les classes globales `home-*` pour rester cohérent avec /rejoindre & /charte.
 */
export default function SectionHeader({ kicker, title, lead, className }: SectionHeaderProps) {
  return (
    <header
      className={`space-y-2 ${className ?? ""}`}
      style={{ maxWidth: "min(60rem, 100%)" }}
    >
      <p
        className="home-kicker font-bold uppercase tracking-[0.16em]"
        style={{ fontSize: "clamp(0.6875rem, 0.62rem + 0.2vw, 0.875rem)" }}
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
          style={{ fontSize: "clamp(0.875rem, 0.8rem + 0.3vw, 1.125rem)" }}
        >
          {lead}
        </p>
      ) : null}
    </header>
  );
}
