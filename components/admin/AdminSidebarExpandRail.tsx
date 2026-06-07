"use client";

import { PanelLeftOpen } from "lucide-react";
import { useAdminDesktopNav } from "@/contexts/AdminDesktopNavContext";

/**
 * Languette desktop pour rouvrir la sidebar admin quand elle est repliée.
 */
export default function AdminSidebarExpandRail() {
  const { effectiveDesktopCollapsed, prefersReducedMotion, setDesktopCollapsed, isAdminArea } =
    useAdminDesktopNav();

  if (!isAdminArea || !effectiveDesktopCollapsed) return null;

  return (
    <button
      type="button"
      onClick={() => setDesktopCollapsed(false)}
      className="pointer-events-auto fixed left-0 top-[clamp(5.5rem,18vh,10rem)] z-[60] hidden min-h-[48px] min-w-[44px] items-center justify-center rounded-r-xl border border-l-0 border-violet-400/20 py-3 pl-1 pr-2 text-zinc-200 shadow-lg transition-colors lg:flex"
      style={{
        backgroundColor: "rgba(17,18,28,0.96)",
        transitionDuration: prefersReducedMotion ? "0ms" : "150ms",
      }}
      aria-label="Afficher le menu admin"
    >
      <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden />
    </button>
  );
}
