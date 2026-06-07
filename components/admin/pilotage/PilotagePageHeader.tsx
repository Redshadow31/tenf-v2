"use client";

import { Compass, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import type { PilotageCopyModel, PilotageWelcomeInsight } from "@/lib/admin/pilotage/pilotageCopyModel";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass, hubGhostButtonClass } from "@/components/admin/members-hub/membersHubStyles";

type Props = {
  copy: PilotageCopyModel;
  onRefresh?: () => void;
};

const INSIGHT_TONE_CLASS: Record<PilotageWelcomeInsight["tone"], string> = {
  accent: "border-violet-400/30 bg-violet-500/10 text-violet-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  muted: "border-white/10 bg-white/[0.04] text-white/55",
};

export default function PilotagePageHeader({ copy, onRefresh }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="bold" className="h-full">
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-200/90">
                {copy.welcomeKicker}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]"
                style={{
                  borderColor: `${copy.accent}44`,
                  backgroundColor: `${copy.accent}18`,
                  color: copy.accent,
                }}
              >
                <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
                {copy.welcomeBadge}
              </span>
            </div>
            <h1 className="mt-1.5 text-pretty text-base font-bold tracking-tight text-white md:text-lg">{copy.welcomeTitle}</h1>
            <p className="mt-1 text-[11px] capitalize text-white/45">{copy.dateLabel}</p>
          </div>
          {onRefresh ? (
            <button type="button" onClick={onRefresh} className={`${hubGhostButtonClass} shrink-0 ${hubFocusRingClass}`}>
              <RefreshCw className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Actualiser</span>
            </button>
          ) : null}
        </div>

        <p
          className="rounded-xl border px-3 py-2 text-xs font-medium leading-relaxed text-white/80 md:text-sm"
          style={{ borderColor: `${copy.accent}28`, backgroundColor: `${copy.accent}0d` }}
        >
          {copy.pageMission}
        </p>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-2">
          <div className="flex flex-col gap-2">
            {copy.welcomeInsights.length > 0 ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Repères rapides">
                {copy.welcomeInsights.map((insight) => (
                  <li
                    key={insight.id}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${INSIGHT_TONE_CLASS[insight.tone]}`}
                  >
                    <span className="uppercase tracking-wide opacity-80">{insight.label}</span>
                    <span className="font-bold tabular-nums">{insight.detail}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <p className="text-pretty text-sm leading-relaxed text-white/70">{copy.welcomeMessage}</p>
            <p className="text-pretty text-xs italic leading-relaxed text-violet-200/75">{copy.encouragement}</p>
          </div>
          <p
            className="flex h-full items-start gap-2 rounded-xl border px-3 py-2.5 text-sm leading-relaxed text-white/85"
            style={{ borderColor: `${copy.accent}33`, backgroundColor: `${copy.accent}12` }}
          >
            <Compass className="mt-0.5 h-4 w-4 shrink-0" style={{ color: copy.accent }} aria-hidden />
            <span>{copy.heroGuideLine}</span>
          </p>
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-white/[0.06] pt-2 text-[11px] text-white/45">
          <ShieldCheck className="h-3 w-3 shrink-0 text-violet-300" aria-hidden />
          <span className="font-medium text-white/70">{copy.firstName}</span>
          {copy.tierLabel ? (
            <>
              <span aria-hidden>·</span>
              <span>{copy.tierLabel}</span>
            </>
          ) : null}
        </div>
      </div>
    </MembersHubPanel>
  );
}
