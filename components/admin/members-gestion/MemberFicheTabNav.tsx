"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Footprints,
  History,
  LayoutDashboard,
  Shield,
  Swords,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  FICHE_TAB_ACCENTS,
  FICHE_TONE_STYLES,
  ficheFocusRing,
  ficheTabNavClass,
  type FicheTabAccent,
} from "@/lib/admin/members-fiche/memberFicheStyles";

export type FicheTabKey =
  | "overview"
  | "journey"
  | "recap"
  | "performance"
  | "participation"
  | "raids"
  | "community"
  | "logs"
  | "admin";

type TabDef = {
  key: FicheTabKey;
  label: string;
  hint: string;
  Icon: LucideIcon;
  accent: FicheTabAccent;
};

const TABS: TabDef[] = [
  { key: "overview", label: "Apercu", hint: "Profil & synthese", Icon: LayoutDashboard, accent: "violet" },
  { key: "journey", label: "Parcours", hint: "Roles & integrations", Icon: Footprints, accent: "indigo" },
  { key: "recap", label: "Recap", hint: "Evolution evaluation D", Icon: TrendingUp, accent: "emerald" },
  { key: "performance", label: "Performance", hint: "Notes mensuelles", Icon: BarChart3, accent: "sky" },
  { key: "participation", label: "Participation", hint: "Evenements & animations", Icon: Users, accent: "amber" },
  { key: "raids", label: "Raids", hint: "Faits & recus", Icon: Swords, accent: "rose" },
  { key: "community", label: "Communaute", hint: "Follows & fiche", Icon: Users, accent: "cyan" },
  { key: "logs", label: "Log membre", hint: "Historique changements", Icon: History, accent: "amber" },
  { key: "admin", label: "Administratif", hint: "Notes & sanctions", Icon: Shield, accent: "slate" },
];

type Props = {
  activeTab: FicheTabKey;
  onTabChange: (tab: FicheTabKey) => void;
  loadingTab?: FicheTabKey | null;
};

export default function MemberFicheTabNav({ activeTab, onTabChange, loadingTab }: Props) {
  return (
    <nav className={ficheTabNavClass} aria-label="Onglets fiche membre">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Vue 360°</p>
        <p className="text-[10px] text-zinc-600">9 sections · donnees live</p>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
        {TABS.map(({ key, label, hint, Icon, accent }) => {
          const active = activeTab === key;
          const loading = loadingTab === key;
          const tone = FICHE_TONE_STYLES[accent];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onTabChange(key)}
              aria-current={active ? "page" : undefined}
              title={hint}
              className={`group relative flex min-w-[7.75rem] shrink-0 flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${ficheFocusRing} ${
                active
                  ? tone.tabActive
                  : "border-transparent bg-white/[0.02] text-zinc-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-zinc-200"
              }`}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <Icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    active ? tone.tabIcon : "text-zinc-500 group-hover:text-zinc-300"
                  }`}
                  aria-hidden
                />
                {loading ? (
                  <span
                    className={`h-3 w-3 animate-spin rounded-full border-2 border-t-transparent ${
                      active ? "border-current opacity-80" : "border-zinc-500"
                    }`}
                  />
                ) : null}
              </span>
              <span className="text-xs font-bold tracking-wide">{label}</span>
              <span
                className={`line-clamp-1 text-[10px] ${
                  active ? "opacity-70" : "text-zinc-600 group-hover:text-zinc-500"
                }`}
              >
                {hint}
              </span>
              {active ? (
                <span
                  className={`absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-gradient-to-r ${tone.accentBar}`}
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MemberFichePeriodChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (months: number) => void;
}) {
  const options = [
    { months: 3, label: "3M" },
    { months: 6, label: "6M" },
    { months: 12, label: "12M" },
    { months: 24, label: "24M" },
  ] as const;

  return (
    <div
      className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1 shadow-inner shadow-black/20 ring-1 ring-inset ring-white/[0.05]"
      role="group"
      aria-label="Periode"
    >
      {options.map((opt) => (
        <button
          key={opt.months}
          type="button"
          onClick={() => onChange(opt.months)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold tabular-nums transition-all duration-150 ${ficheFocusRing} ${
            value === opt.months
              ? "bg-gradient-to-b from-violet-500/30 to-violet-600/15 text-violet-100 shadow-sm ring-1 ring-inset ring-violet-400/25"
              : "text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function MemberFicheTabContent({ children, tabKey }: { children: ReactNode; tabKey: string }) {
  const accent = FICHE_TAB_ACCENTS[tabKey] ?? "neutral";
  return (
    <div key={tabKey} className="animate-fade-in">
      <div
        className={`mb-4 h-px w-full bg-gradient-to-r ${FICHE_TONE_STYLES[accent].accentBar} opacity-60`}
        aria-hidden
      />
      {children}
    </div>
  );
}
