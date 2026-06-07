"use client";

import { ExternalLink, Heart, Shield } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import { RAID_DECLARE_WHY } from "@/components/member/raids/declare/raidDeclareContent";
import type { RaidDeclareGuidanceModel } from "@/components/member/raids/declare/raidDeclareModel";
import { RAID_DECLARE_ACCENT, twitchChannelUrl } from "@/components/member/raids/declare/raidDeclareUtils";

type RaidDeclareGuidancePanelProps = {
  model: RaidDeclareGuidanceModel;
  formPreview: {
    target: string;
    date: string;
    time: string;
    note: string;
    loginClean: string;
  };
  isApproximateTime: boolean;
};

export default function RaidDeclareGuidancePanel({ model, formPreview, isApproximateTime }: RaidDeclareGuidancePanelProps) {
  return (
    <div className="space-y-3">
      <DashboardPanel
        id="declare-why"
        tone="accent"
        accentHex={RAID_DECLARE_ACCENT}
        intensity="soft"
        ariaLabelledBy="declare-why-title"
        className={`${MEMBER_SCROLL_MT} lg:sticky lg:top-[calc(clamp(0.4rem,0.8vw,0.85rem)+3.25rem)]`}
      >
        <DashboardPanelHeader
          kicker={RAID_DECLARE_WHY.kicker}
          title={RAID_DECLARE_WHY.title}
          icon={Heart}
          tone="rose"
          accentHex="#f472b6"
          titleId="declare-why-title"
        />

        <div className={MEMBER_MESSAGE_BOX}>
          <p className="text-sm font-medium leading-[1.65] text-white/90">{model.introLead}</p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">{RAID_DECLARE_WHY.footnote}</p>
        </div>

        <DashboardInnerCard hover={false} className="mt-3 !p-3">
          <p className="text-xs leading-relaxed text-white/68">{model.encouragement}</p>
        </DashboardInnerCard>

        <ol className="mt-3 space-y-2">
          {model.steps.map((step, index) => (
            <li key={step.id}>
              <DashboardInnerCard hover={false} className="!p-3">
                <div className="flex gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
                    style={{
                      backgroundColor: hexToRgba(RAID_DECLARE_ACCENT, 0.18),
                      color: "#c4b5fd",
                    }}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/58">{step.body}</p>
                  </div>
                </div>
              </DashboardInnerCard>
            </li>
          ))}
        </ol>

        <div
          className="mt-4 rounded-xl border px-3 py-3"
          style={{
            borderColor: hexToRgba("#f87171", 0.22),
            backgroundColor: hexToRgba("#f87171", 0.06),
          }}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-red-300/90" aria-hidden />
            <p className="text-xs font-bold text-red-100/95">À garder en tête</p>
          </div>
          <ul className="mt-2 space-y-1.5">
            {model.rules.map((rule) => (
              <li key={rule} className="text-[11px] leading-snug text-white/62">
                · {rule}
              </li>
            ))}
          </ul>
        </div>
      </DashboardPanel>

      <DashboardPanel tone="neutral" accentHex={RAID_DECLARE_ACCENT} intensity="soft">
        <DashboardPanelHeader
          kicker="Aperçu"
          title="Avant envoi"
          tone="accent"
          accentHex={RAID_DECLARE_ACCENT}
          titleId="declare-preview-title"
        />
        <p className="mb-3 text-xs text-white/45">Ce récap correspond au ticket staff.</p>
        <DashboardInnerCard hover={false} className="!p-4">
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase text-white/45">Cible</p>
              <p className="mt-0.5 font-semibold text-white">{formPreview.target}</p>
              {formPreview.loginClean ? (
                <a
                  href={twitchChannelUrl(formPreview.loginClean)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-violet-300 hover:text-violet-200"
                >
                  Ouvrir Twitch <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase text-white/45">Date</p>
                <p className="font-medium text-white/80">{formPreview.date}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-white/45">Heure</p>
                <p className="font-medium text-white/80">
                  {formPreview.time}
                  {isApproximateTime ? <span className="ml-1 text-xs text-amber-400/90">~</span> : null}
                </p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-white/45">Note</p>
              <p className="text-white/70">{formPreview.note}</p>
            </div>
          </div>
        </DashboardInnerCard>
      </DashboardPanel>
    </div>
  );
}
