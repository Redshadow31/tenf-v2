"use client";

import { ArrowRight, ExternalLink, MessageSquare, Sparkles } from "lucide-react";
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
import type { DiscordActivityHeroModel } from "@/components/member/engagement/discord-activity/discordActivityModel";
import { DISCORD_ACTIVITY_ACCENT } from "@/components/member/engagement/discord-activity/discordActivityUtils";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";

type DiscordActivityHeroProps = {
  model: DiscordActivityHeroModel;
  displayName: string;
  twitchLogin: string;
  totalMessages: number;
  totalVocalHours: number;
  activeMonthCount: number;
  loading: boolean;
};

export default function DiscordActivityHero({
  model,
  displayName,
  twitchLogin,
  totalMessages,
  totalVocalHours,
  activeMonthCount,
  loading,
}: DiscordActivityHeroProps) {
  return (
    <DashboardPanel id="discord-hero" tone="accent" accentHex={DISCORD_ACTIVITY_ACCENT} intensity="bold" className="md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_10.5rem] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={DISCORD_ACTIVITY_ACCENT}>
              <MessageSquare className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={DISCORD_ACTIVITY_ACCENT}>
              <Sparkles className="h-3 w-3" aria-hidden />
              {model.profileBadge}
            </DashboardBadge>
          </div>

          <h1 className={MEMBER_HERO_TITLE}>{model.welcomeTitle}</h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères Discord">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={DISCORD_INVITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold text-white transition hover:-translate-y-0.5"
              style={{
                backgroundColor: DISCORD_ACTIVITY_ACCENT,
                boxShadow: "0 6px 18px rgba(88, 101, 242, 0.32)",
              }}
            >
              Ouvrir Discord TENF
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <MemberSecondaryLink href="/lives">Voir les lives</MemberSecondaryLink>
            <MemberSecondaryLink href="/member/profil/modifier">
              Vérifier mon profil
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </MemberSecondaryLink>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat
            icon={MessageSquare}
            label="Messages"
            value={loading ? "…" : totalMessages.toLocaleString("fr-FR")}
            accent={DISCORD_ACTIVITY_ACCENT}
          />
          <MemberHeroStat
            icon={Sparkles}
            label="Vocal"
            value={loading ? "…" : `${totalVocalHours} h`}
            accent="#a78bfa"
          />
          <MemberHeroStat
            icon={MessageSquare}
            label="Mois actifs"
            value={loading ? "…" : String(activeMonthCount)}
            accent="#34d399"
          />
        </div>
      </div>

      {(displayName || twitchLogin) && (
        <p className="mt-3 truncate text-xs text-white/45">
          Profil rattaché : <span className="font-semibold text-white/70">{displayName || twitchLogin}</span>
          {twitchLogin && displayName !== twitchLogin ? (
            <span className="text-white/40"> · @{twitchLogin}</span>
          ) : null}
        </p>
      )}
    </DashboardPanel>
  );
}
