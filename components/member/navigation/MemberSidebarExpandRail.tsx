"use client";

import { PanelLeftOpen } from "lucide-react";
import { useMemberDesktopNav } from "@/contexts/MemberDesktopNavContext";

/**
 * Languette desktop pour rouvrir la sidebar membre quand elle est repliée.
 * Masqué sur mobile (drawer inchangé).
 */
export default function MemberSidebarExpandRail() {
  const { effectiveDesktopCollapsed, prefersReducedMotion, setDesktopCollapsed, isMemberArea } = useMemberDesktopNav();

  if (!isMemberArea || !effectiveDesktopCollapsed) return null;

  return (
    <button
      type="button"
      onClick={() => setDesktopCollapsed(false)}
      className="pointer-events-auto fixed left-0 top-[clamp(5.5rem,18vh,10rem)] z-[60] hidden min-h-[48px] min-w-[44px] items-center justify-center rounded-r-xl border border-l-0 py-3 pl-1 pr-2 shadow-lg transition-colors xl:flex"
      style={{
        backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
        borderColor: "var(--color-border)",
        color: "var(--color-text)",
        transitionDuration: prefersReducedMotion ? "0ms" : "150ms",
      }}
      aria-label="Afficher le menu membre"
    >
      <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
}
