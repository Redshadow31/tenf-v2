"use client";

import { ArrowRight, Compass, Rocket, Sparkles, Users } from "lucide-react";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberHeroStat,
  MemberInsightChip,
  MemberSecondaryLink,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import ActivityPulseRing from "@/components/member/activity/ActivityPulseRing";
import type { ActivityHeroModel } from "@/components/member/activity/activityModel";
import { ACTIVITY_ACCENT, formatMonthShort } from "@/components/member/activity/activityUtils";

type ActivityHeroProps = {
  model: ActivityHeroModel;
  monthKey: string;
  intensityScore: number;
  raidsTotal: number;
  attendedThisMonth: number;
  trackedThisMonth: number;
  vipActive: boolean;
};

export default function ActivityHero({
  model,
  monthKey,
  intensityScore,
  raidsTotal,
  attendedThisMonth,
  trackedThisMonth,
  vipActive,
}: ActivityHeroProps) {
  return (
    <DashboardPanel id="activity-hero" tone="accent" accentHex={ACTIVITY_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[auto_1fr_10.5rem] xl:items-start">
        <ActivityPulseRing value={intensityScore} />

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={ACTIVITY_ACCENT}>
              <Compass className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={ACTIVITY_ACCENT}>
              {model.rhythmBadge}
            </DashboardBadge>
            {monthKey ? (
              <DashboardBadge tone="amber">
                {formatMonthShort(monthKey)}
              </DashboardBadge>
            ) : null}
            {vipActive ? (
              <DashboardBadge tone="gold">
                <Sparkles className="h-3 w-3" aria-hidden />
                VIP ce mois
              </DashboardBadge>
            ) : null}
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères du mois">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <MemberSecondaryLink href="/member/objectifs">
              Mes objectifs
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
            <MemberSecondaryLink href="/member/evenements">Planning événements</MemberSecondaryLink>
            <MemberSecondaryLink href="/member/activite/historique">Historique détaillé</MemberSecondaryLink>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat icon={Users} label="Événements" value={`${attendedThisMonth}/${trackedThisMonth || "—"}`} accent="#38bdf8" />
          <MemberHeroStat icon={Rocket} label="Raids total" value={String(raidsTotal)} accent="#f59e0b" />
          <MemberHeroStat icon={Compass} label="Intensité" value={`${intensityScore}%`} accent={ACTIVITY_ACCENT} />
        </div>
      </div>
    </DashboardPanel>
  );
}
