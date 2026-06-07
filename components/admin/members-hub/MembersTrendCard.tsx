"use client";

import Link from "next/link";
import { ArrowRight, History, TrendingUp } from "lucide-react";
import type { MembersHubCopyModel } from "@/lib/admin/members/membersHubCopyModel";
import { MembersHubPanel, MembersHubPanelHeader } from "@/components/admin/members-hub/MembersHubPanel";
import { hubFocusRingClass } from "./membersHubStyles";

type Props = {
  copy: MembersHubCopyModel;
  pendingTotal: number;
  qualityScore: number;
};

export default function MembersTrendCard({ copy, pendingTotal, qualityScore }: Props) {
  return (
    <MembersHubPanel accentHex={copy.accent} tone="neutral" className="h-full" ariaLabelledBy="members-hub-trend">
      <div className="flex h-full min-h-0 flex-col">
        <MembersHubPanelHeader
          kicker={copy.trend.kicker}
          title={copy.trend.title}
          intro={copy.trend.intro}
          icon={TrendingUp}
          accentHex={copy.accent}
          titleId="members-hub-trend"
        />

        <div className="grid flex-1 grid-cols-1 gap-2 content-start">
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{copy.trend.queueStatLabel}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">{pendingTotal}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{copy.trend.queueStatHint}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40">{copy.trend.qualityStatLabel}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-white">{qualityScore}/100</p>
            <p className="mt-0.5 text-[11px] text-white/40">{copy.trend.qualityStatHint}</p>
          </div>
        </div>

        <Link
          href="/admin/membres/historique"
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/30 bg-indigo-500/[0.10] px-3 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-indigo-500/20 ${hubFocusRingClass}`}
        >
          <History className="h-3.5 w-3.5" aria-hidden />
          {copy.trend.cta}
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </MembersHubPanel>
  );
}
