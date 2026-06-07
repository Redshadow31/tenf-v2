"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Crown,
  ExternalLink,
  LayoutDashboard,
  Radio,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import { hexToRgba } from "@/components/member/profil/memberProfileModel";
import ProfileCompletionRing from "@/components/member/profil/ProfileCompletionRing";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MEMBER_SCROLL_MT,
  MemberHeroStat,
  MemberInsightChip,
  MemberPrimaryLink,
  MemberSecondaryLink,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";

type ProfileHeroProps = {
  model: MemberProfileModel;
};

export default function ProfileHero({ model }: ProfileHeroProps) {
  const {
    accent,
    avatar,
    displayName,
    twitchLogin,
    role,
    profilePercent,
    vipActive,
    validationLabel,
    validationTone,
    integrationDone,
    upcomingLives,
    hasPublicProfileLink,
    publicProfileHref,
    livePlanningHref,
    welcomeKicker,
    welcomeTitle,
    welcomeMessage,
    welcomeInsights,
    primaryAction,
  } = model;

  const StatusIcon = vipActive ? Crown : validationTone === "success" ? CheckCircle2 : Sparkles;

  return (
    <DashboardPanel
      id="profil-resume"
      tone="accent"
      accentHex={accent}
      intensity="bold"
      ariaLabelledBy="profile-hero-title"
      className={`${MEMBER_SCROLL_MT} md:p-5`}
    >
      <div className="grid gap-4 xl:grid-cols-[1fr_10.5rem] xl:items-start">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative shrink-0">
              <div
                aria-hidden
                className="absolute -inset-1 rounded-[1.15rem] opacity-90 blur-sm"
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(accent, 0.5)}, ${hexToRgba(accent, 0.22)})`,
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt=""
                className="relative rounded-xl border-2 border-white/20 object-cover shadow-lg"
                style={{ width: "clamp(3.25rem,5vw,4.25rem)", height: "clamp(3.25rem,5vw,4.25rem)" }}
              />
            </div>
            <ProfileCompletionRing percent={profilePercent} sizeEm={4.25} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <DashboardBadge tone="accent" accentHex={accent}>
                  <UserCircle2 className="h-3 w-3" aria-hidden />
                  {welcomeKicker}
                </DashboardBadge>
                <DashboardBadge tone="accent" accentHex={accent}>
                  <StatusIcon className="h-3 w-3" aria-hidden />
                  {role}
                </DashboardBadge>
              </div>
              <h1 id="profile-hero-title" className={`mt-1 ${MEMBER_HERO_TITLE}`}>
                {welcomeTitle}
              </h1>
              <p className="mt-0.5 text-sm text-white/55">
                {displayName} · @{twitchLogin}
              </p>
            </div>
          </div>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={welcomeMessage} />
          </div>

          {welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5" aria-label="Repères profil">
              {welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Link href={primaryAction.href} className="inline-block">
              <div
                className="group inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: hexToRgba(accent, 0.2),
                  color: hexToRgba(accent, 0.98),
                  border: `1px solid ${hexToRgba(accent, 0.35)}`,
                }}
              >
                {primaryAction.label}
                <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
              </div>
            </Link>
            <MemberPrimaryLink href="/member/profil/completer" accentHex={accent}>
              Compléter
            </MemberPrimaryLink>
            <MemberSecondaryLink href={livePlanningHref}>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Planning
            </MemberSecondaryLink>
            {hasPublicProfileLink ? (
              <Link
                href={publicProfileHref}
                className="inline-flex min-h-[34px] items-center gap-1.5 rounded-xl border border-emerald-500/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/14"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Fiche publique
              </Link>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 xl:grid-cols-1 xl:gap-2">
          <MemberHeroStat
            icon={Sparkles}
            label="VIP"
            value={vipActive ? "Actif" : "—"}
            accent={vipActive ? "#facc15" : accent}
          />
          <MemberHeroStat
            icon={LayoutDashboard}
            label="Intégration"
            value={integrationDone ? "Faite" : "À faire"}
            accent="#38bdf8"
          />
          <MemberHeroStat icon={Radio} label="Lives" value={String(upcomingLives)} accent="#f472b6" />
          <MemberHeroStat
            icon={CheckCircle2}
            label="Validation"
            value={validationLabel.split(" ")[0]}
            accent={validationTone === "success" ? "#22c55e" : "#f59e0b"}
          />
        </div>
      </div>
    </DashboardPanel>
  );
}
