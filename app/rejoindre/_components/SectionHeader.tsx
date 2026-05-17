import type { ReactNode } from "react";

type SectionHeaderProps = {
  kicker: string;
  title: string;
  lead?: ReactNode;
};

/**
 * En-tête de section homogène (kicker · h2 · lead).
 * Utilise les classes globales home-* du design system.
 */
export default function SectionHeader({ kicker, title, lead }: SectionHeaderProps) {
  return (
    <div className="max-w-3xl space-y-3">
      <p className="home-kicker text-xs font-bold uppercase tracking-[0.16em] sm:text-sm">
        {kicker}
      </p>
      <h2 className="home-section-title text-xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {lead ? (
        <p className="home-muted text-sm leading-relaxed sm:text-base">{lead}</p>
      ) : null}
    </div>
  );
}
