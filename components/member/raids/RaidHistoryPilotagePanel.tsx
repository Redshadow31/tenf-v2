"use client";

import Link from "next/link";
import { useId } from "react";
import { ArrowRight, Medal, Target, TrendingUp } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberHeroStat,
} from "@/components/member/dashboard/dashboardUi";
import { useMemberMonthlyGoals } from "@/components/member/hooks/useMemberMonthlyGoals";
import {
  getPreviousMonthKey,
  getRaidTierDetail,
  nextRaidTierThreshold,
  type RaidHubSummary,
} from "@/components/member/raids/raidHubStatsUtils";
import { formatMonthLabel, RAID_HISTORY_ACCENT } from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryPilotagePanelProps = {
  selectedMonth: string;
  hubSummary: RaidHubSummary;
  previousMonthSent: number;
  hubLoading: boolean;
};

function ProgressRing({ value, label }: { value: number; label: string }) {
  const gradientId = useId().replace(/:/g, "");
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative mx-auto h-32 w-32 shrink-0">
      <svg viewBox="0 0 140 140" className="h-32 w-32 -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="11" fill="transparent" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke={`url(#raid-pilotage-ring-${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id={`raid-pilotage-ring-${gradientId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-2xl font-black tabular-nums text-white">{clamped}%</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      </div>
    </div>
  );
}

export default function RaidHistoryPilotagePanel({
  selectedMonth,
  hubSummary,
  previousMonthSent,
  hubLoading,
}: RaidHistoryPilotagePanelProps) {
  const { goals } = useMemberMonthlyGoals(selectedMonth);
  const delta = hubSummary.sent - previousMonthSent;
  const completionRate = goals.raids > 0 ? (hubSummary.sent / goals.raids) * 100 : 0;
  const remainingToTarget = Math.max(0, goals.raids - hubSummary.sent);
  const tierDetail = getRaidTierDetail(hubSummary.sent);
  const nextThreshold = nextRaidTierThreshold(hubSummary.sent);
  const raidsToNextTier = nextThreshold !== null ? Math.max(0, nextThreshold - hubSummary.sent) : 0;

  return (
    <DashboardPanel
      id="raid-pilotage"
      tone="amber"
      accentHex={RAID_HISTORY_ACCENT}
      intensity="soft"
      ariaLabelledBy="raid-pilotage-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Pilotage"
        title="Ton rythme ce mois-ci"
        icon={TrendingUp}
        tone="amber"
        accentHex={RAID_HISTORY_ACCENT}
        titleId="raid-pilotage-title"
        badge={
          hubLoading ? (
            <span className="text-[11px] text-white/40">Chargement…</span>
          ) : (
            <span className="text-[11px] font-bold text-amber-200">{tierDetail.label}</span>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-center">
        <ProgressRing value={completionRate} label="Objectif" />

        <div className="min-w-0 space-y-3">
          <p className="text-sm leading-relaxed text-white/62">
            {goals.raids <= 0 ? (
              <>
                Aucun objectif raids défini pour {formatMonthLabel(selectedMonth).split(" ")[0]?.toLowerCase()}.{" "}
                <Link href="/member/objectifs" className="font-semibold text-violet-300 underline-offset-2 hover:underline">
                  Configure-le sur Objectifs
                </Link>{" "}
                pour activer la jauge.
              </>
            ) : remainingToTarget > 0 ? (
              <>
                Encore {remainingToTarget} raid{remainingToTarget !== 1 ? "s" : ""} pour ton objectif ({goals.raids}) — volume
                hub TENF, complémentaire aux statuts de validation plus bas.
              </>
            ) : (
              <>Objectif mensuel atteint sur le volume hub. Continue à ton rythme, sans te mettre la pression.</>
            )}
          </p>

          <div
            className="inline-flex items-start gap-3 rounded-2xl border px-3.5 py-3"
            style={{ borderColor: `${tierDetail.color}44`, backgroundColor: "rgba(0,0,0,0.28)" }}
          >
            <Medal className="mt-0.5 h-7 w-7 shrink-0" style={{ color: tierDetail.color }} aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Palier (volume hub)</p>
              <p className="text-base font-bold text-white">{tierDetail.label}</p>
              <p className="text-xs text-white/45">{tierDetail.hint}</p>
              {nextThreshold !== null ? (
                <p className="mt-1 text-xs text-amber-200/85">
                  Encore {raidsToNextTier} raid{raidsToNextTier !== 1 ? "s" : ""} pour viser {nextThreshold}+ ce mois.
                </p>
              ) : (
                <p className="mt-1 text-xs text-amber-200/85">Sommet des paliers affichés — belle constance.</p>
              )}
            </div>
          </div>

          <Link
            href="/member/objectifs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 underline-offset-2 hover:underline"
          >
            Ajuster mon objectif
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <MemberHeroStat icon={Target} label="Objectif" value={String(goals.raids)} accent={RAID_HISTORY_ACCENT} />
        <MemberHeroStat
          icon={TrendingUp}
          label="vs mois -1"
          value={`${delta >= 0 ? "+" : ""}${delta}`}
          accent={delta >= 0 ? "#34d399" : "#f87171"}
        />
        <MemberHeroStat icon={Target} label="Cibles distinctes" value={String(hubSummary.uniqueTargets)} accent="#38bdf8" />
        <MemberHeroStat
          icon={Medal}
          label="Top cible"
          value={hubSummary.topTarget ? `×${hubSummary.topTarget.count}` : "—"}
          accent="#a78bfa"
        />
      </div>
      {hubSummary.topTarget ? (
        <p className="mt-2 truncate text-xs text-white/45">
          Cible la plus soutenue : <span className="font-semibold text-white/70">{hubSummary.topTarget.label}</span>
        </p>
      ) : null}
    </DashboardPanel>
  );
}
