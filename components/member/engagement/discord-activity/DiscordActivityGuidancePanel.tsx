"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Heart, HelpCircle, Sparkles } from "lucide-react";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";
import type { DiscordActivityGuidanceModel } from "@/components/member/engagement/discord-activity/discordActivityModel";
import { DISCORD_DATA_FAQ, DISCORD_WHY_INTRO } from "@/components/member/engagement/discord-activity/discordActivityContent";
import { DISCORD_ACTIVITY_ACCENT } from "@/components/member/engagement/discord-activity/discordActivityUtils";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

type DiscordActivityGuidancePanelProps = {
  model: DiscordActivityGuidanceModel;
};

export default function DiscordActivityGuidancePanel({ model }: DiscordActivityGuidancePanelProps) {
  return (
    <DashboardPanel
      id="discord-why"
      tone="accent"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-why-title"
      className={`${MEMBER_SCROLL_MT} lg:sticky lg:top-[calc(clamp(0.4rem,0.8vw,0.85rem)+3.25rem)]`}
    >
      <DashboardPanelHeader
        kicker={DISCORD_WHY_INTRO.kicker}
        title={DISCORD_WHY_INTRO.title}
        icon={Heart}
        tone="rose"
        accentHex="#f472b6"
        titleId="discord-why-title"
      />

      <div className={MEMBER_MESSAGE_BOX}>
        <p className="text-sm font-medium leading-[1.65] text-white/90">{model.introLead}</p>
        <p className="mt-2 text-xs leading-relaxed text-white/55">{DISCORD_WHY_INTRO.footnote}</p>
      </div>

      <DashboardInnerCard hover={false} className="mt-3 !p-3">
        <div className="flex items-start gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: hexToRgba(DISCORD_ACTIVITY_ACCENT, 0.15), color: "#b4b9ff" }}
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

      <div className="mt-4">
        <p className="text-xs font-bold uppercase tracking-wide text-white/45">{model.tipsTitle}</p>
        <ul className="mt-2 space-y-1.5">
          {model.tips.map((tip, index) => (
            <li key={`${index}-${tip.slice(0, 24)}`} className="text-[11px] leading-snug text-white/58">
              · {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5"
          style={{
            backgroundColor: DISCORD_ACTIVITY_ACCENT,
            boxShadow: "0 6px 18px rgba(88, 101, 242, 0.32)",
          }}
        >
          Rejoindre le Discord
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <Link
          href="/member/profil/modifier"
          className="inline-flex items-center gap-1 text-xs font-semibold text-white/45 underline-offset-2 hover:text-white/75 hover:underline"
        >
          Vérifier mon profil
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </DashboardPanel>
  );
}

export function DiscordActivityFaqPanel() {
  return (
    <DashboardPanel
      id="discord-faq"
      tone="neutral"
      accentHex={DISCORD_ACTIVITY_ACCENT}
      intensity="soft"
      ariaLabelledBy="discord-faq-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Transparence"
        title="Comprendre ces chiffres"
        icon={HelpCircle}
        tone="neutral"
        accentHex="#f4db97"
        titleId="discord-faq-title"
      />

      <div className="space-y-3">
        {DISCORD_DATA_FAQ.map((item) => (
          <DashboardInnerCard key={item.id} hover={false} className="!p-3">
            <p className="text-sm font-bold text-white">{item.q}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-white/62">{item.a}</p>
          </DashboardInnerCard>
        ))}
      </div>
    </DashboardPanel>
  );
}
