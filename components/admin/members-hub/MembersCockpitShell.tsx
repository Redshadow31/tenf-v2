"use client";

import type { ReactNode } from "react";

type Props = {
  aside?: ReactNode;
  children: ReactNode;
  /** `fullWidth` : toute la largeur utile (gestion tableau) — aside en bandeau sous le contenu */
  layout?: "standard" | "fullWidth";
};

/**
 * Enveloppe cockpit partagée hub + gestion.
 * - standard : max ~1720px, main + aside sticky
 * - fullWidth : pleine largeur viewport (page gestion)
 */
export default function MembersCockpitShell({ aside, children, layout = "standard" }: Props) {
  const isFullWidth = layout === "fullWidth";

  return (
    <div
      className="relative isolate min-h-[calc(100vh-4rem)] min-w-0 scroll-smooth pb-12 text-white selection:bg-violet-500/35 [--mem-gap:clamp(1rem,1.55vw,1.85rem)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[max(-4rem,calc(-6vw))] top-[-3rem] -z-10 h-[clamp(240px,32vw,420px)] overflow-hidden blur-3xl"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_24%_-10%,rgba(167,139,250,0.26),transparent_54%)]" />
      </div>
      <div
        className={
          isFullWidth
            ? "w-[calc(100%+2rem)] max-w-none -mx-4 px-2 pb-10 pt-0 md:w-[calc(100%+3rem)] md:-mx-6 md:px-3 md:pt-1"
            : "mx-auto w-full max-w-[min(1720px,calc(100vw-2*clamp(0.6rem,1.75vw,1.75rem)))] px-[clamp(0.75rem,2vw,2.35rem)] pb-12 pt-2 sm:pt-3"
        }
      >
        {isFullWidth ? (
          <div className="min-w-0 space-y-4 sm:space-y-5">
            <main className="min-w-0 w-full space-y-3 sm:space-y-[var(--mem-gap)]">{children}</main>
            {aside ? (
              <aside
                className="grid min-w-0 grid-cols-1 gap-3 border-t border-white/[0.06] pt-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4"
                aria-label="Aide et raccourcis gestion"
              >
                {aside}
              </aside>
            ) : null}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_min(100%,clamp(17rem,24vw,25rem))] xl:items-start xl:gap-[clamp(1.35rem,2.6vw,2.85rem)]">
            <main className="min-w-0 space-y-5 xl:space-y-[var(--mem-gap)]">{children}</main>
            {aside ? (
              <aside
                className="min-w-0 space-y-4 xl:sticky xl:top-4 xl:max-h-[calc(100vh-5rem)] xl:overflow-y-auto"
                aria-label="Navigation membres"
              >
                {aside}
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
