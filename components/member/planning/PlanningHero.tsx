"use client";

import { CalendarDays, Plus, Radio, RefreshCw, Sparkles } from "lucide-react";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberHeroStat,
  MemberSecondaryLink,
} from "@/components/member/dashboard/dashboardUi";
import { PLANNING_ACCENT } from "@/components/member/planning/planningUtils";

type PlanningHeroProps = {
  totalPlannings: number;
  upcoming7: number;
  nextLiveLabel: string;
  loading: boolean;
  syncingTwitch: boolean;
  onAdd: () => void;
  onSyncAppend: () => void;
  onSyncReplace: () => void;
  onGenerateDemo?: () => void;
  showDemo?: boolean;
};

export default function PlanningHero({
  totalPlannings,
  upcoming7,
  nextLiveLabel,
  loading,
  syncingTwitch,
  onAdd,
  onSyncAppend,
  onSyncReplace,
  onGenerateDemo,
  showDemo,
}: PlanningHeroProps) {
  return (
    <DashboardPanel tone="accent" accentHex={PLANNING_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_10.5rem] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={PLANNING_ACCENT}>
              <CalendarDays className="h-3 w-3" aria-hidden />
              Agenda perso
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={PLANNING_ACCENT}>
              <Sparkles className="h-3 w-3" aria-hidden />
              {totalPlannings} live{totalPlannings > 1 ? "s" : ""}
            </DashboardBadge>
          </div>

          <h1 className={MEMBER_HERO_TITLE}>Planning de mes streams</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <p className="text-sm leading-[1.65] text-white/78">
              Ajoute tes créneaux à la main ou importe ton{" "}
              <strong className="font-semibold text-white/92">planning créateur Twitch</strong> (fuseau Paris).
              La communauté et le hub /lives s&apos;appuient sur ces dates pour te retrouver.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5"
              style={{
                backgroundColor: PLANNING_ACCENT,
                boxShadow: "0 6px 18px rgba(145, 70, 255, 0.32)",
              }}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Ajouter un stream
            </button>
            <MemberSecondaryLink href="/member/profil">
              Retour au profil
            </MemberSecondaryLink>
            <button
              type="button"
              onClick={onSyncAppend}
              disabled={loading || syncingTwitch}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-violet-400/35 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-500/16 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncingTwitch ? "animate-spin" : ""}`} aria-hidden />
              {syncingTwitch ? "Sync…" : "Sync Twitch"}
            </button>
            <button
              type="button"
              onClick={onSyncReplace}
              disabled={loading || syncingTwitch}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/14 disabled:opacity-50"
            >
              Remplacer par Twitch
            </button>
            {showDemo && onGenerateDemo ? (
              <button
                type="button"
                onClick={onGenerateDemo}
                className="inline-flex min-h-[36px] items-center rounded-xl border border-white/12 px-3 py-1.5 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:text-white/80"
              >
                Demo local
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat icon={Radio} label="Total" value={String(totalPlannings)} accent={PLANNING_ACCENT} />
          <MemberHeroStat icon={CalendarDays} label="7 jours" value={String(upcoming7)} accent="#38bdf8" />
          <MemberHeroStat icon={Sparkles} label="Prochain" value={nextLiveLabel} accent="#f472b6" />
        </div>
      </div>
    </DashboardPanel>
  );
}
