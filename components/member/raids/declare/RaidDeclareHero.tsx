"use client";

import { ArrowRight, History, Shield, Sparkles, Target } from "lucide-react";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberInsightChip,
  MemberSecondaryLink,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import type { RaidDeclareHeroModel } from "@/components/member/raids/declare/raidDeclareModel";
import { RAID_DECLARE_ACCENT } from "@/components/member/raids/declare/raidDeclareUtils";

type RaidDeclareHeroProps = {
  model: RaidDeclareHeroModel;
  pendingCount: number;
};

export default function RaidDeclareHero({ model, pendingCount }: RaidDeclareHeroProps) {
  return (
    <DashboardPanel id="declare-hero" tone="accent" accentHex={RAID_DECLARE_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={RAID_DECLARE_ACCENT}>
              <Shield className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={RAID_DECLARE_ACCENT}>
              <Sparkles className="h-3 w-3" aria-hidden />
              {model.statusBadge}
            </DashboardBadge>
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères déclaration">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <MemberSecondaryLink href="/member/raids/historique">
              <History className="h-3.5 w-3.5" aria-hidden />
              Vérifier Mes raids
            </MemberSecondaryLink>
            <MemberSecondaryLink href="/lives">Voir les lives</MemberSecondaryLink>
            <MemberSecondaryLink href="/member/objectifs">
              <Target className="h-3.5 w-3.5" aria-hidden />
              Mon objectif
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
          </div>
        </div>

        <div className="grid min-w-[10rem] gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/45">Étape rapide</p>
            <p className="mt-1 text-sm font-bold text-white">1. Cible · 2. Moment · 3. Envoi</p>
          </div>
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-950/25 px-3.5 py-3">
            <p className="text-xs font-semibold text-emerald-200">
              {pendingCount > 0
                ? `${pendingCount} dossier${pendingCount > 1 ? "s" : ""} en cours`
                : "Traitement bienveillant côté staff"}
            </p>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
