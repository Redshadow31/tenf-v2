"use client";

import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import DiscordMarkdownPreview from "@/components/member/ui/DiscordMarkdownPreview";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import {
  DashboardInnerCard,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  MemberDashedFooterLink,
} from "@/components/member/dashboard/dashboardUi";

type ProfileBioCardProps = {
  model: MemberProfileModel;
  member: {
    displayName: string;
    twitchLogin: string;
    avatar: string;
    bio: string;
  };
};

export default function ProfileBioCard({ model, member }: ProfileBioCardProps) {
  const { accent, hasPublicProfileLink, publicProfileHref } = model;

  return (
    <DashboardPanel
      tone="rose"
      accentHex={accent}
      intensity="soft"
      ariaLabelledBy="profile-bio-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="Vitrine"
        title="Bio publique"
        icon={FileText}
        tone="rose"
        accentHex="#f472b6"
        titleId="profile-bio-title"
      />

      <DashboardInnerCard className="!p-0 overflow-hidden">
        <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-black/25 px-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={member.avatar}
            alt=""
            className="h-8 w-8 shrink-0 rounded-lg border border-white/10 object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{member.displayName}</p>
            <p className="truncate text-[11px] text-white/45">
              {hasPublicProfileLink ? `@${member.twitchLogin}` : "Pseudo à finaliser"}
            </p>
          </div>
        </div>
        <div className="max-h-[14rem] overflow-y-auto p-3 text-sm">
          <DiscordMarkdownPreview
            content={member.bio || ""}
            emptyFallback="Ajoute une bio dans « Compléter mon profil »."
          />
        </div>
      </DashboardInnerCard>

      {hasPublicProfileLink ? (
        <Link
          href={publicProfileHref}
          className="inline-flex min-h-[34px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/35 bg-emerald-500/10 text-xs font-bold text-emerald-100 transition hover:bg-emerald-500/16"
        >
          Ouvrir ma fiche
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : (
        <MemberDashedFooterLink href="/member/profil/completer">Compléter la bio →</MemberDashedFooterLink>
      )}
    </DashboardPanel>
  );
}
