"use client";

import Link from "next/link";
import type { NavItem } from "@/lib/admin/navigation";

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]";

type AdminHubNavLinksProps = {
  hubs: NavItem[];
  activeHubHref?: string | null;
  variant: "desktop-bar" | "mobile-scroll" | "mobile-drawer";
  onNavigate?: () => void;
};

function hubLinkClass(isActive: boolean, extra = ""): string {
  return `${focusRing} ${extra} ${
    isActive
      ? "bg-violet-500/[0.10] text-zinc-50"
      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100"
  }`;
}

export default function AdminHubNavLinks({
  hubs,
  activeHubHref,
  variant,
  onNavigate,
}: AdminHubNavLinksProps) {
  if (hubs.length === 0) return null;

  if (variant === "desktop-bar") {
    return (
      <nav
        className="hidden w-full min-w-0 border-t border-white/[0.04] bg-gradient-to-b from-white/[0.015] to-transparent px-[clamp(0.75rem,2.5vw,1.5rem)] py-3 lg:block lg:py-3.5"
        aria-label="Navigation principale admin"
      >
        <div className="flex w-full min-w-0 flex-wrap items-stretch justify-center gap-[clamp(0.25rem,0.8vw,0.5rem)]">
          {hubs.map((hub) => {
            const isActive = activeHubHref === hub.href;
            return (
              <Link
                key={hub.href}
                href={hub.href}
                aria-current={isActive ? "page" : undefined}
                className={`relative max-w-[min(100%,11rem)] rounded-lg px-[clamp(0.65rem,1.2vw,0.9rem)] py-[clamp(0.4rem,1vw,0.55rem)] text-center text-[length:clamp(0.625rem,0.55rem+0.2vw,0.75rem)] font-medium leading-snug tracking-tight transition-colors duration-150 sm:max-w-[min(100%,13rem)] sm:px-[clamp(0.75rem,1.4vw,1rem)] ${hubLinkClass(isActive)}`}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute -bottom-[7px] left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-violet-300/85"
                  />
                ) : null}
                {hub.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (variant === "mobile-scroll") {
    return (
      <nav
        aria-label="Domaines admin"
        className="border-t border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent px-[clamp(0.75rem,2.5vw,1.5rem)] py-2.5 lg:hidden"
      >
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Domaines</p>
        <div className="-mx-0.5 flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {hubs.map((hub) => {
            const isActive = activeHubHref === hub.href;
            return (
              <Link
                key={hub.href}
                href={hub.href}
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${hubLinkClass(
                  isActive,
                  isActive
                    ? "border-violet-400/35 bg-violet-500/15 text-violet-50"
                    : "border-white/[0.08] bg-white/[0.03]",
                )}`}
              >
                {hub.label}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <nav aria-label="Changer de domaine admin" className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5 lg:hidden">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-200/80">Changer de domaine</p>
      <div className="flex flex-wrap gap-1.5">
        {hubs.map((hub) => {
          const isActive = activeHubHref === hub.href;
          return (
            <Link
              key={hub.href}
              href={hub.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold leading-snug transition-colors ${hubLinkClass(
                isActive,
                isActive
                  ? "border-violet-400/35 bg-violet-500/15 text-violet-50"
                  : "border-white/[0.08] bg-black/20",
              )}`}
            >
              {hub.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
