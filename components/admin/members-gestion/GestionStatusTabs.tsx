"use client";

import {
  UserCheck,
  HeartHandshake,
  Users,
  Sparkles,
  BadgeCheck,
  LogOut,
  Ban,
  Archive,
} from "lucide-react";
import type { GestionStatusTab } from "@/lib/admin/members-gestion/memberPopulationFilters";

export type { GestionStatusTab };

type GestionStatusTabsProps = {
  statusTab: GestionStatusTab;
  onChange: (tab: GestionStatusTab) => void;
  counts: Record<GestionStatusTab, number>;
};

const TAB_CONFIG: {
  key: GestionStatusTab;
  label: string;
  Icon: typeof UserCheck;
  activeClass: string;
  idleHover: string;
  ring: string;
}[] = [
  {
    key: "actifs",
    label: "Actifs",
    Icon: UserCheck,
    activeClass: "scale-[1.02] bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-900/30 ring-1 ring-emerald-400/50",
    idleHover: "hover:border-emerald-500/25",
    ring: "focus-visible:ring-emerald-400/50",
  },
  {
    key: "communaute",
    label: "Communauté",
    Icon: Users,
    activeClass: "scale-[1.02] bg-gradient-to-r from-sky-600 to-cyan-700 text-white shadow-lg shadow-sky-900/25 ring-1 ring-sky-400/45",
    idleHover: "hover:border-sky-500/25",
    ring: "focus-visible:ring-sky-400/50",
  },
  {
    key: "suivi_pause",
    label: "Suivi pause",
    Icon: HeartHandshake,
    activeClass: "scale-[1.02] bg-gradient-to-r from-rose-600 to-orange-700 text-white shadow-lg shadow-rose-900/25 ring-1 ring-rose-400/45",
    idleHover: "hover:border-rose-500/25",
    ring: "focus-visible:ring-rose-400/50",
  },
  {
    key: "nouveaux",
    label: "Nouveaux",
    Icon: Sparkles,
    activeClass: "scale-[1.02] bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-900/30 ring-1 ring-violet-400/45",
    idleHover: "hover:border-violet-500/25",
    ring: "focus-visible:ring-violet-400/50",
  },
  {
    key: "affilies",
    label: "Affiliés TENF",
    Icon: BadgeCheck,
    activeClass: "scale-[1.02] bg-gradient-to-r from-amber-600 to-yellow-700 text-white shadow-lg shadow-amber-900/25 ring-1 ring-amber-400/45",
    idleHover: "hover:border-amber-500/25",
    ring: "focus-visible:ring-amber-400/50",
  },
  {
    key: "departs",
    label: "Départs",
    Icon: LogOut,
    activeClass: "scale-[1.02] bg-gradient-to-r from-orange-600 to-red-800 text-white shadow-lg shadow-orange-900/25 ring-1 ring-orange-400/45",
    idleHover: "hover:border-orange-500/25",
    ring: "focus-visible:ring-orange-400/50",
  },
  {
    key: "bans",
    label: "Bans",
    Icon: Ban,
    activeClass: "scale-[1.02] bg-gradient-to-r from-red-700 to-red-950 text-white shadow-lg shadow-red-950/35 ring-1 ring-red-400/45",
    idleHover: "hover:border-red-500/25",
    ring: "focus-visible:ring-red-400/50",
  },
  {
    key: "archives",
    label: "Archivés",
    Icon: Archive,
    activeClass: "scale-[1.02] bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg shadow-black/30 ring-1 ring-slate-400/40",
    idleHover: "hover:border-slate-500/35",
    ring: "focus-visible:ring-slate-400/50",
  },
];

/**
 * Bandeau d'onglets « population de base » pour la gestion membres.
 */
export default function GestionStatusTabs({ statusTab, onChange, counts }: GestionStatusTabsProps) {
  return (
    <>
      <p className="mb-2 max-w-4xl text-xs leading-relaxed text-slate-500">
        Les onglets ci-dessous changent la <span className="font-medium text-slate-300">population de base</span> (actifs,
        communauté, suivi pause, nouveaux, affiliés post-intégration, départs, bans, archivés). La recherche et les filtres
        affinent ensuite cette liste — les compteurs peuvent différer selon la couche utilisée.
      </p>
      <div
        className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#2a3148] bg-[linear-gradient(145deg,rgba(22,26,40,0.95),rgba(12,14,20,0.98))] p-2 shadow-inner shadow-black/20"
        role="tablist"
        aria-label="Filtrer la liste par population"
      >
        {TAB_CONFIG.map(({ key, label, Icon, activeClass, idleHover, ring }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={statusTab === key}
            aria-pressed={statusTab === key}
            onClick={() => onChange(key)}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all focus:outline-none focus-visible:ring-2 ${ring} ${
              statusTab === key
                ? activeClass
                : `border border-transparent bg-[#1a1f2e] text-slate-300 ${idleHover} hover:text-white`
            }`}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            {label}
            <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs tabular-nums">{counts[key]}</span>
          </button>
        ))}
      </div>
    </>
  );
}
