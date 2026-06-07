"use client";

import { useState } from "react";
import { Compass, Heart, Sparkles } from "lucide-react";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { DiscoverGuidanceModel } from "@/components/member/engagement/discover/discoverModel";
import { DISCOVER_ACCENT } from "@/components/member/engagement/discover/discoverUtils";

type DiscoverGuidancePanelProps = {
  model: DiscoverGuidanceModel;
  variant?: "full" | "sidebar";
};

export default function DiscoverGuidancePanel({ model, variant = "full" }: DiscoverGuidancePanelProps) {
  const [open, setOpen] = useState(false);
  const isSidebar = variant === "sidebar";

  return (
    <DashboardPanel
      id="discover-guidance"
      tone="cyan"
      accentHex={DISCOVER_ACCENT}
      intensity="soft"
      ariaLabelledBy="discover-guidance-title"
      className={`${MEMBER_SCROLL_MT} ${isSidebar ? "lg:sticky lg:top-[4.5rem] lg:max-h-[min(72vh,52rem)] lg:overflow-y-auto" : ""}`}
    >
      <DashboardPanelHeader
        kicker="Repères"
        title={model.panelTitle}
        icon={Compass}
        tone="cyan"
        accentHex="#38bdf8"
        titleId="discover-guidance-title"
      />

      <div className={`grid gap-2 ${isSidebar ? "grid-cols-1" : "sm:grid-cols-2"}`}>
        <DashboardInnerCard hover={false} className="!p-3">
          <div className="flex items-start gap-2.5">
            <Heart className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            <div>
              <p className="text-xs font-bold text-white">{model.cardA.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/58">{model.cardA.body}</p>
            </div>
          </div>
        </DashboardInnerCard>
        <DashboardInnerCard hover={false} className="!p-3">
          <div className="flex items-start gap-2.5">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            <div>
              <p className="text-xs font-bold text-white">{model.cardB.title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/58">{model.cardB.body}</p>
            </div>
          </div>
        </DashboardInnerCard>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="mt-3 flex w-full items-center justify-between rounded-xl border border-sky-500/20 bg-sky-950/20 px-3 py-2.5 text-left text-xs font-semibold text-sky-100/90 transition hover:bg-sky-950/30"
        aria-expanded={open}
      >
        <span>{model.tipsToggleLabel}</span>
        <span className="text-[10px] text-sky-300/70">{open ? "Masquer" : "Afficher"}</span>
      </button>
      {open ? (
        <ul className="mt-2 space-y-2 rounded-xl border border-white/8 bg-black/20 p-3">
          {model.tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-[11px] leading-relaxed text-white/62">
              <span className="text-violet-400">•</span>
              {tip}
            </li>
          ))}
        </ul>
      ) : null}
    </DashboardPanel>
  );
}
