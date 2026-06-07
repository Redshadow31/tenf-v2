"use client";

import Link from "next/link";
import { ArrowRight, History, PlusCircle, Sparkles, Target } from "lucide-react";
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
import type { RaidHistoryHeroModel } from "@/components/member/raids/raidHistoryModel";
import { RAID_HISTORY_ACCENT } from "@/components/member/raids/raidHistoryUtils";

type RaidHistoryHeroProps = {
  model: RaidHistoryHeroModel;
  totalMonth: number;
  validatedMonth: number;
  validationRate: number;
};

export default function RaidHistoryHero({ model, totalMonth, validatedMonth, validationRate }: RaidHistoryHeroProps) {
  return (
    <DashboardPanel id="raid-hero" tone="amber" accentHex={RAID_HISTORY_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_10.5rem] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="amber" accentHex={RAID_HISTORY_ACCENT}>
              <History className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="amber" accentHex={RAID_HISTORY_ACCENT}>
              <Sparkles className="h-3 w-3" aria-hidden />
              {model.monthBadge}
            </DashboardBadge>
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères raids">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/lives"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-[#1f1a12] transition hover:-translate-y-0.5"
              style={{ backgroundColor: RAID_HISTORY_ACCENT, boxShadow: "0 6px 18px rgba(245, 158, 11, 0.28)" }}
            >
              <PlusCircle className="h-3.5 w-3.5" aria-hidden />
              Soutenir un live
            </Link>
            <MemberSecondaryLink href="/member/objectifs">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Mon objectif
            </MemberSecondaryLink>
            <button
              type="button"
              onClick={() => document.getElementById("raid-pilotage")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-semibold text-white/72 transition hover:border-white/18 hover:bg-white/[0.07] hover:text-white"
            >
              Voir le pilotage
            </button>
            <MemberSecondaryLink href="/member/raids/declarer">
              Signaler un raid absent
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat icon={Target} label="Ce mois" value={String(totalMonth)} accent={RAID_HISTORY_ACCENT} />
          <MemberHeroStat icon={Sparkles} label="Validés" value={String(validatedMonth)} accent="#22c55e" />
          <MemberHeroStat icon={History} label="Taux" value={`${validationRate}%`} accent="#38bdf8" />
        </div>
      </div>
    </DashboardPanel>
  );
}
