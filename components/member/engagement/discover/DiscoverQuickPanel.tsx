"use client";

import { Gift, RefreshCw, Shuffle, Sparkles, Target, Users, Wand2 } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MemberHeroStat,
  MemberSecondaryLink,
} from "@/components/member/dashboard/dashboardUi";
import { DISCOVER_ACCENT, type RoleFilterKey } from "@/components/member/engagement/discover/discoverUtils";

type DiscoverQuickPanelProps = {
  totalPending: number;
  filteredCount: number;
  roleCounts: Record<RoleFilterKey, number>;
  lastUpdatedAt: number | null;
  openingBatch: boolean;
  onOpenBatch: (n: number) => void;
  onPickRandom: () => void;
  onRefresh: () => void;
  canAct: boolean;
};

export default function DiscoverQuickPanel({
  totalPending,
  filteredCount,
  roleCounts,
  lastUpdatedAt,
  openingBatch,
  onOpenBatch,
  onPickRandom,
  onRefresh,
  canAct,
}: DiscoverQuickPanelProps) {
  return (
    <DashboardPanel
      id="discover-quick"
      tone="accent"
      accentHex={DISCOVER_ACCENT}
      intensity="soft"
      ariaLabelledBy="discover-quick-title"
      className="flex h-full flex-col md:p-4"
    >
      <DashboardPanelHeader
        kicker="Actions"
        title="Explorer vite"
        icon={Wand2}
        tone="accent"
        accentHex={DISCOVER_ACCENT}
        titleId="discover-quick-title"
      />

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 lg:grid-cols-1 lg:gap-2">
        <MemberHeroStat icon={Users} label="Pistes" value={String(totalPending)} accent={DISCOVER_ACCENT} />
        <MemberHeroStat icon={Sparkles} label="Filtrées" value={String(filteredCount)} accent="#38bdf8" />
        <MemberHeroStat icon={Target} label="Staff" value={String(roleCounts.staff)} accent="#f472b6" />
      </div>

      {totalPending > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-white/42">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
            Aff. {roleCounts.affilie}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
            Dév. {roleCounts.developpement}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5">
            Aut. {roleCounts.other}
          </span>
        </div>
      ) : null}

      <div className="mt-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onOpenBatch(3)}
          disabled={!canAct || openingBatch}
          title="Ouvre des onglets — follow uniquement si ça te parle."
          className="inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            backgroundColor: DISCOVER_ACCENT,
            boxShadow: "0 6px 18px rgba(192, 132, 252, 0.28)",
          }}
        >
          <Wand2 className="h-3.5 w-3.5" aria-hidden />
          {openingBatch ? "Ouverture…" : "3 idées (onglets)"}
        </button>
        <button
          type="button"
          onClick={() => onOpenBatch(5)}
          disabled={!canAct || openingBatch}
          className="inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/14 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Gift className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          5 idées
        </button>
        <button
          type="button"
          onClick={onPickRandom}
          disabled={!canAct}
          title="Curiosité d'abord — follow seulement si tu ouvres la porte."
          className="inline-flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl border border-violet-400/30 bg-violet-500/12 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/18 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Shuffle className="h-3.5 w-3.5" aria-hidden />
          Piocher au hasard
        </button>
        <MemberSecondaryLink href="/member/engagement/score" className="w-full justify-center">
          Mon score
        </MemberSecondaryLink>
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex min-h-[34px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-xs font-semibold text-white/55 transition hover:text-white/85"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Rafraîchir
        </button>
      </div>

      <p className="mt-auto pt-3 text-[10px] leading-snug text-white/38">
        MAJ {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleString("fr-FR") : "à l'instant"}
      </p>
    </DashboardPanel>
  );
}
