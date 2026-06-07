"use client";

import { BarChart3, CalendarDays, Gift, Search, Target, TrendingUp } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import { MEMBER_PANEL_RADIUS } from "@/components/member/dashboard/dashboardUi";
import { RAID_HISTORY_ACCENT } from "@/components/member/raids/raidHistoryUtils";

const ITEMS = [
  { id: "raid-month", label: "Mois", icon: CalendarDays },
  { id: "raid-pilotage", label: "Pilotage", icon: TrendingUp },
  { id: "raid-trends", label: "Tendances", icon: BarChart3 },
  { id: "raid-timeline", label: "Liste", icon: Search },
  { id: "raid-gratitude", label: "Retours", icon: Gift },
  { id: "raid-culture", label: "Repères", icon: Target },
] as const;

export default function RaidHistorySubNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav
      aria-label="Sections historique raids"
      className={`sticky top-[clamp(0.4rem,0.8vw,0.85rem)] z-20 overflow-hidden ${MEMBER_PANEL_RADIUS} border border-white/[0.1] bg-black/45 px-1.5 py-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.32)] backdrop-blur-md`}
    >
      <div className="flex flex-nowrap items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => scrollTo(id)}
            className="inline-flex min-h-[36px] shrink-0 items-center justify-center gap-1.5 rounded-xl border border-transparent px-3.5 py-1.5 text-sm font-semibold text-white/55 transition hover:border-white/10 hover:bg-white/[0.04] hover:text-white/88 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
          >
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {label}
          </button>
        ))}
        <span
          className="ml-auto hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold text-amber-100/90 sm:inline-flex"
          style={{
            borderColor: hexToRgba(RAID_HISTORY_ACCENT, 0.35),
            background: hexToRgba(RAID_HISTORY_ACCENT, 0.12),
          }}
        >
          Auto + déclarations
        </span>
      </div>
    </nav>
  );
}
