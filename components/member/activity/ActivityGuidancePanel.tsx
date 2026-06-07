"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { ActivityGuidanceModel } from "@/components/member/activity/activityModel";
import { ACTIVITY_WHY } from "@/components/member/activity/activityContent";
import { ACTIVITY_ACCENT } from "@/components/member/activity/activityUtils";

type ActivityGuidancePanelProps = {
  model: ActivityGuidanceModel;
};

export default function ActivityGuidancePanel({ model }: ActivityGuidancePanelProps) {
  return (
    <DashboardPanel
      id="activity-why"
      tone="accent"
      accentHex={ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="activity-why-title"
      className={`${MEMBER_SCROLL_MT} lg:sticky lg:top-[calc(clamp(0.4rem,0.8vw,0.85rem)+3.25rem)]`}
    >
      <DashboardPanelHeader
        kicker={ACTIVITY_WHY.kicker}
        title={ACTIVITY_WHY.title}
        icon={Heart}
        tone="rose"
        accentHex="#f472b6"
        titleId="activity-why-title"
      />

      <div className={MEMBER_MESSAGE_BOX}>
        <p className="text-sm font-medium leading-[1.65] text-white/90">{model.introLead}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{ACTIVITY_WHY.footnote}</p>
      </div>

      <DashboardInnerCard hover={false} className="mt-3 !p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexToRgba(ACTIVITY_ACCENT, 0.15), color: "#fdba74" }}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <p className="text-xs leading-relaxed text-white/68">{model.encouragement}</p>
        </div>
      </DashboardInnerCard>

      <ul className="mt-3 space-y-2">
        {model.truths.map((truth) => (
          <li key={truth.id}>
            <DashboardInnerCard hover={false} className="!p-3">
              <p className="text-sm font-bold text-white">{truth.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/62">{truth.body}</p>
            </DashboardInnerCard>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/member/progression"
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5"
          style={{
            backgroundColor: ACTIVITY_ACCENT,
            boxShadow: "0 6px 18px rgba(249, 115, 22, 0.32)",
          }}
        >
          Ma progression
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <Link
          href="/member/formations"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/45 underline-offset-2 hover:text-white/75 hover:underline"
        >
          Mes formations
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </DashboardPanel>
  );
}
