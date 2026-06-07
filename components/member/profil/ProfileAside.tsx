"use client";

import Link from "next/link";
import { CalendarCheck, ExternalLink, Radio, Twitch } from "lucide-react";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type ProfileAsideProps = {
  model: MemberProfileModel;
  member: {
    displayName: string;
    twitchLogin: string;
    avatar: string;
    bio: string;
  };
};

export default function ProfileAside({ model, member }: ProfileAsideProps) {
  const {
    accent,
    nextPlanningLabel,
    integrationDateLabel,
    twitchConnected,
    livePlanningHref,
    hasPublicProfileLink,
    publicProfileHref,
  } = model;

  return (
    <DashboardPanel
      tone="cyan"
      accentHex={accent}
      intensity="soft"
      ariaLabelledBy="profile-aside-title"
      className="h-full"
    >
      <DashboardPanelHeader
        kicker="Repères"
        title="En bref & aperçu"
        icon={Radio}
        tone="cyan"
        titleId="profile-aside-title"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <DashboardInnerCard className="!p-0">
          <ul className="divide-y divide-white/[0.06]">
            <li>
              <Link
                href={livePlanningHref}
                className="flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-white/[0.03]"
              >
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                  <Radio className="h-3.5 w-3.5 text-cyan-300" aria-hidden />
                  Prochain live
                </span>
                <span className="text-sm font-bold text-white">{nextPlanningLabel}</span>
              </Link>
            </li>
            <li className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <CalendarCheck className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Intégration
              </span>
              <span className="text-sm font-medium text-white/80">{integrationDateLabel}</span>
            </li>
            <li className="flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/45">
                <Twitch className="h-3.5 w-3.5 text-violet-300" aria-hidden />
                Twitch
              </span>
              <span className={`text-sm font-bold ${twitchConnected ? "text-emerald-300" : "text-white/40"}`}>
                {twitchConnected ? "Relié" : "Non relié"}
              </span>
            </li>
          </ul>
        </DashboardInnerCard>

        <DashboardInnerCard className="flex min-h-0 flex-1 flex-col !p-0 overflow-hidden">
          <div className="border-b border-white/[0.06] bg-black/30 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45">Fiche publique</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={member.avatar}
                alt=""
                className="h-9 w-9 rounded-lg border border-white/10 object-cover"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{member.displayName}</p>
                <p className="truncate text-[11px] text-white/45">
                  {hasPublicProfileLink ? `@${member.twitchLogin}` : "Pseudo à finaliser"}
                </p>
              </div>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-sm">
            <DiscordMarkdownPreview
              content={member.bio || ""}
              emptyFallback="Ajoute une bio dans « Compléter mon profil »."
            />
          </div>
        </DashboardInnerCard>

        {hasPublicProfileLink ? (
          <Link
            href={publicProfileHref}
            className="mt-auto inline-flex min-h-[36px] w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/18"
          >
            Ouvrir ma fiche
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        ) : (
          <p className="mt-auto text-center text-[11px] text-white/45">
            Fiche publique dispo après validation du pseudo Twitch.
          </p>
        )}
      </div>
    </DashboardPanel>
  );
}
