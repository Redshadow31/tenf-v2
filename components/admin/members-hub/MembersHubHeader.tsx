"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Compass, ListChecks, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import type { MembersHubCopyModel, MembersHubWelcomeInsight } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";
import {
  hubFocusRingClass,
  hubGhostButtonClass,
  hubMembersLogoCompactClass,
  hubPrimaryButtonClass,
} from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  generatedAt: string | null;
  pendingTotal: number;
  refreshing: boolean;
  partial: boolean;
  onRefresh: () => void;
};

const INSIGHT_TONE_CLASS: Record<MembersHubWelcomeInsight["tone"], string> = {
  accent: "border-violet-400/30 bg-violet-500/10 text-violet-100",
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-100",
  muted: "border-white/10 bg-white/[0.04] text-white/55",
};

export default function MembersHubHeader({
  copy,
  generatedAt,
  pendingTotal,
  refreshing,
  partial,
  onRefresh,
}: Props) {
  const generatedLabel = generatedAt
    ? new Date(generatedAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  return (
    <MembersHubPanel accentHex={copy.accent} tone="accent" intensity="bold" className="h-full">
      <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:items-stretch lg:gap-5">
        <div className="flex shrink-0 items-start justify-center lg:justify-start">
          <Image
            src="/images/membres/hub-gestion-membres-logo.png"
            alt=""
            width={512}
            height={512}
            priority
            unoptimized
            className={hubMembersLogoCompactClass}
            aria-hidden
          />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
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

          <h1 className="mt-2 text-pretty text-lg font-bold tracking-tight text-white md:text-xl">{copy.welcomeTitle}</h1>

          {copy.welcomeInsights.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Repères rapides">
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

          <p className="mt-2 text-pretty text-sm leading-relaxed text-white/70">{copy.welcomeMessage}</p>

          <p
            className="mt-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-sm leading-relaxed text-white/85"
            style={{
              borderColor: `${copy.accent}33`,
              backgroundColor: `${copy.accent}12`,
            }}
          >
            <Compass className="mt-0.5 h-4 w-4 shrink-0" style={{ color: copy.accent }} aria-hidden />
            <span>{copy.heroGuideLine}</span>
          </p>

          <p className="mt-2 text-pretty text-xs italic leading-relaxed text-violet-200/75">{copy.encouragement}</p>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-white/45">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 text-violet-300" aria-hidden />
                <span className="font-medium text-white/85">{copy.firstName}</span>
                {copy.tierLabel ? (
                  <>
                    <span className="text-white/30">·</span>
                    <span>{copy.tierLabel}</span>
                  </>
                ) : null}
              </span>
              <span>Synchro {generatedLabel}</span>
              {partial ? (
                <span className="rounded-full border border-amber-400/35 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                  {copy.partialDataLabel}
                </span>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onRefresh}
                disabled={refreshing}
                className={`${hubGhostButtonClass} disabled:opacity-60 ${hubFocusRingClass}`}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
                {refreshing ? copy.refreshBusyLabel : copy.refreshLabel}
              </button>
              <Link
                href="/admin/membres/actions"
                className={`${hubPrimaryButtonClass} ${hubFocusRingClass}`}
                aria-label={`${copy.queueCtaLabel} (${pendingTotal})`}
              >
                <ListChecks className="h-4 w-4 shrink-0" aria-hidden />
                {copy.queueCtaLabel}
                {pendingTotal > 0 ? (
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold tabular-nums">{pendingTotal}</span>
                ) : null}
                <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MembersHubPanel>
  );
}
