"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, ShieldCheck, Sparkles } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberInsightChip,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";

type AdminDashboardHeroProps = {
  model: AdminDashboardModel;
};

export default function AdminDashboardHero({ model }: AdminDashboardHeroProps) {
  const StatusIcon =
    model.tier === "founder"
      ? ShieldCheck
      : model.tier === "moderator_discovery"
        ? Sparkles
        : Compass;

  return (
    <DashboardPanel tone="accent" accentHex={model.accent} intensity="bold" ariaLabelledBy="admin-dashboard-hero-title">
      <div className="grid gap-5 xl:grid-cols-[1fr_11.5rem] xl:items-start">
        <div className="min-w-0 space-y-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <DashboardBadge tone="accent" accentHex={model.accent}>
              <Compass className="h-3 w-3" aria-hidden />
              {model.welcomeKicker}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={model.accent}>
              <StatusIcon className="h-3 w-3" aria-hidden />
              {model.roleLabel}
            </DashboardBadge>
            <DashboardBadge tone="accent" accentHex={model.accent}>
              {model.firstName}
            </DashboardBadge>
          </div>

          <h1 id="admin-dashboard-hero-title" className={MEMBER_HERO_TITLE}>
            {model.welcomeTitle}
          </h1>

          <div className={MEMBER_MESSAGE_BOX}>
            <MemberWelcomeParagraph text={model.welcomeMessage} />
          </div>

          {model.welcomeInsights.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Repères personnalisés">
              {model.welcomeInsights.map((insight) => (
                <MemberInsightChip key={insight.id} insight={insight} />
              ))}
            </ul>
          ) : null}

          <p
            className="rounded-xl border px-3.5 py-3 text-sm leading-relaxed text-white/80"
            style={{
              borderColor: hexToRgba(model.accent, 0.28),
              background: `linear-gradient(135deg, ${hexToRgba(model.accent, 0.08)}, rgba(0,0,0,0.35))`,
            }}
          >
            {model.encouragement}
          </p>

          <p className="text-xs capitalize text-white/45">{model.dateLabel}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          <div className="rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">{model.heroMeetingKicker}</p>
            <p className="mt-1 text-sm font-bold text-white">{model.meetingLabel}</p>
            <p className="mt-0.5 text-xs text-white/60">{model.meetingDateLabel}</p>
            <p className="mt-2 text-lg font-black tabular-nums text-white">{model.meetingRegistrations}</p>
            <p className="text-[10px] text-white/45">{model.meetingRegistrationsHint}</p>
          </div>
          <Link
            href={model.heroExtendedHref}
            className="group flex flex-col justify-between rounded-xl border border-white/10 bg-black/25 p-3 transition hover:-translate-y-0.5 hover:border-violet-400/35"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/80">{model.heroExtendedHint}</p>
            <p className="mt-2 text-sm font-bold text-white group-hover:text-violet-100">{model.heroExtendedLabel}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-violet-200/90">
              Ouvrir
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </Link>
        </div>
      </div>
    </DashboardPanel>
  );
}
