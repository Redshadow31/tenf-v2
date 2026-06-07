"use client";

import Link from "next/link";
import { Compass, LayoutDashboard, Search, Sparkles, Target, Users } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import { MEMBER_PANEL_RADIUS } from "@/components/member/dashboard/dashboardUi";
import { DISCOVER_ACCENT } from "@/components/member/engagement/discover/discoverUtils";

const SECTIONS = [
  { id: "discover-hero", label: "Accueil", icon: Sparkles },
  { id: "discover-explorer", label: "Explorer", icon: Search },
  { id: "discover-guidance", label: "Repères", icon: Compass },
] as const;

const LINKS = [
  { href: "/member/engagement/score", label: "Score", icon: Target },
  { href: "/member/engagement/amis", label: "Follows", icon: Users },
  { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const;

export default function DiscoverSubNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Sections à découvrir"
      className={`sticky top-[clamp(0.4rem,0.8vw,0.85rem)] z-20 overflow-hidden ${MEMBER_PANEL_RADIUS} border border-white/[0.1] bg-black/45 px-1.5 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-md`}
    >
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3.5 py-1.5 text-sm font-semibold text-white/55 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white/88"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}

        <span className="mx-0.5 hidden h-5 w-px shrink-0 bg-white/10 sm:block" aria-hidden />

        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3 py-1.5 text-xs font-semibold text-white/45 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white/75"
          >
            <Icon className="h-3 w-3" aria-hidden />
            {label}
          </Link>
        ))}

        <span
          className="ml-auto hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-violet-100/90 sm:inline-flex"
          style={{
            borderColor: hexToRgba(DISCOVER_ACCENT, 0.35),
            background: hexToRgba(DISCOVER_ACCENT, 0.12),
          }}
        >
          À découvrir
        </span>
      </div>
    </nav>
  );
}
