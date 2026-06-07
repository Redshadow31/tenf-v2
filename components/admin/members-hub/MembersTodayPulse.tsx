"use client";

import Link from "next/link";
import { ArrowRight, Flame, HeartPulse, Sparkles, Stethoscope } from "lucide-react";
import type { MembersQualityTier } from "@/lib/admin/members/membersQualityScore";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  urgentCount: number;
  importantCount: number;
  pendingTotal: number;
  qualityScore: number;
  qualityTier: MembersQualityTier;
};

const TIER_LABEL: Record<MembersQualityTier, { label: string; tone: string }> = {
  excellent: { label: "excellent", tone: "text-emerald-200" },
  ok: { label: "stable", tone: "text-indigo-200" },
  fragile: { label: "fragile", tone: "text-amber-200" },
  critique: { label: "critique", tone: "text-rose-200" },
};

export default function MembersTodayPulse({
  copy,
  urgentCount,
  importantCount,
  pendingTotal,
  qualityScore,
  qualityTier,
}: Props) {
  const tier = TIER_LABEL[qualityTier];
  const Icon = urgentCount > 0 ? Flame : importantCount > 0 ? Stethoscope : HeartPulse;
  const iconClass =
    urgentCount > 0
      ? "bg-rose-500/15 text-rose-200 border-rose-400/30"
      : importantCount > 0
        ? "bg-amber-500/15 text-amber-200 border-amber-400/30"
        : "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";

  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-today-pulse">
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start gap-2.5">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${iconClass}`}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-200/85">{copy.pulse.kicker}</p>
            <h2 id="members-hub-today-pulse" className="mt-0.5 text-base font-bold text-white">
              {copy.pulse.title}
            </h2>
          </div>
        </div>

        <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-white/80">{copy.pulse.headline}</p>

        <div className="mt-3 flex flex-col gap-1.5" aria-label="Chiffres clés du pouls communauté">
          <Link
            href="/admin/membres/actions"
            className={`group flex items-center justify-between rounded-lg border border-rose-400/25 bg-rose-500/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-rose-100 transition hover:bg-rose-500/20 ${hubFocusRingClass}`}
          >
            <span>
              <span className="font-bold tabular-nums">{urgentCount}</span> {copy.pulse.chipUrgent}
            </span>
            <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
          <Link
            href="/admin/membres/actions"
            className={`group flex items-center justify-between rounded-lg border border-amber-400/25 bg-amber-500/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-amber-100 transition hover:bg-amber-500/20 ${hubFocusRingClass}`}
          >
            <span>
              <span className="font-bold tabular-nums">{pendingTotal}</span> {copy.pulse.chipQueue}
            </span>
            <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
          <Link
            href="/admin/membres/qualite-data"
            className={`group flex items-center justify-between rounded-lg border border-indigo-300/25 bg-indigo-500/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" aria-hidden />
              <span className="font-bold tabular-nums">{qualityScore}/100</span>
              <span className={tier.tone}>{tier.label}</span>
            </span>
            <ArrowRight className="h-3 w-3 opacity-70" aria-hidden />
          </Link>
        </div>
      </div>
    </MembersHubPanel>
  );
}
