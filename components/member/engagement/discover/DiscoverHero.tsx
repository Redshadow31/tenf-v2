"use client";

import { Sparkles, Users } from "lucide-react";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberInsightChip,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import type { DiscoverHeroModel } from "@/components/member/engagement/discover/discoverModel";
import { DISCOVER_ACCENT } from "@/components/member/engagement/discover/discoverUtils";

type DiscoverHeroProps = {
  model: DiscoverHeroModel;
};

export default function DiscoverHero({ model }: DiscoverHeroProps) {
  return (
    <DashboardPanel id="discover-hero" tone="accent" accentHex={DISCOVER_ACCENT} intensity="bold" className="md:p-5">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <DashboardBadge tone="accent" accentHex={DISCOVER_ACCENT}>
            <Sparkles className="h-3 w-3" aria-hidden />
            {model.welcomeKicker}
          </DashboardBadge>
          <DashboardBadge tone="accent" accentHex={DISCOVER_ACCENT}>
            <Users className="h-3 w-3" aria-hidden />
            {model.countBadge}
          </DashboardBadge>
        </div>

        <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

        <div className={MEMBER_MESSAGE_BOX}>
          <MemberWelcomeParagraph text={model.welcomeMessage} />
        </div>

        {model.welcomeInsights.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5" aria-label="Repères découverte">
            {model.welcomeInsights.map((insight) => (
              <MemberInsightChip key={insight.id} insight={insight} />
            ))}
          </ul>
        ) : null}
      </div>
    </DashboardPanel>
  );
}
