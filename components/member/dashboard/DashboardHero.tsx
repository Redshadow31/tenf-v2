"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  Crown,
  Heart,
  Sparkles,
  Target,
} from "lucide-react";
import {
  hexToRgba,
  type MemberDashboardModel,
} from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberHeroStat,
  MemberInsightChip,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";

type DashboardHeroProps = {
  model: MemberDashboardModel;
};

export default function DashboardHero({ model }: DashboardHeroProps) {
  const { accent, status, monthIndicators, welcomeInsights } = model;
  const StatusIcon =
    status === "vip"
      ? Crown
      : status === "newcomer"
        ? Sparkles
        : status === "paused"
          ? Heart
          : status === "staff"
            ? Compass
            : CheckCircle2;

  const raidsIndicator = monthIndicators.find((i) => i.id === "raids");
  const presencesIndicator = monthIndicators.find((i) => i.id === "presences");

  return (
    <DashboardPanel
      tone="accent"
      accentHex={accent}
      intensity="bold"
      ariaLabelledBy="dashboard-hero-title"
      className="md:p-6"
    >
      <div className="grid gap-5 xl:grid-cols-[1fr_11.5rem] xl:items-start">
        <div className="min-w-0 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={accent}>
              <Compass className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={accent}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {model.statusBadge}
            </DashboardBadge>
          </div>

          <h1 id="dashboard-hero-title" className={MEMBER_HERO_TITLE}>
            {model.welcomeTitle}
          </h1>

          {!model.welcomeBanner ? (
            <div className={MEMBER_MESSAGE_BOX}>
              <MemberWelcomeParagraph text={model.welcomeMessage} />
            </div>
          ) : null}

          {welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Repères personnalisés">
              {welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          {model.welcomeBanner ? (
            <div
              className="grid items-start gap-3 rounded-xl border p-3.5 sm:grid-cols-[1fr_auto] sm:items-center"
              style={{
                borderColor: hexToRgba(accent, 0.32),
                background: `linear-gradient(135deg, ${hexToRgba(accent, 0.1)}, rgba(0,0,0,0.35))`,
              }}
            >
              <div>
                <p className="text-sm font-bold text-white">{model.welcomeBanner.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/75">
                  {model.welcomeBanner.description}
                </p>
              </div>
              <Link
                href={model.welcomeBanner.cta.href}
                className="inline-flex min-h-[38px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold shadow-lg transition hover:-translate-y-0.5"
                style={{
                  backgroundColor: hexToRgba(accent, 0.95),
                  color: "#1f1a12",
                  boxShadow: `0 8px 20px ${hexToRgba(accent, 0.35)}`,
                }}
              >
                {model.welcomeBanner.cta.label}
                <ArrowUpRight size={13} aria-hidden />
              </Link>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-2 xl:grid-cols-1 xl:gap-2.5">
          <MemberHeroStat icon={Target} label="Repères" value={model.monthProgressLabel} accent={accent} />
          {raidsIndicator ? (
            <MemberHeroStat
              icon={Sparkles}
              label="Raids"
              value={`${raidsIndicator.current}/${raidsIndicator.target}`}
              accent="#f59e0b"
            />
          ) : null}
          {presencesIndicator ? (
            <MemberHeroStat
              icon={CalendarDays}
              label="Présences"
              value={`${presencesIndicator.current}/${presencesIndicator.target}`}
              accent="#38bdf8"
            />
          ) : null}
        </div>
      </div>
    </DashboardPanel>
  );
}
