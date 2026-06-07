"use client";

import Link from "next/link";
import { ArrowUpRight, Compass, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import type { AdminAccountModel } from "@/lib/admin/account/adminAccountModel";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardPanel,
  MEMBER_HERO_TITLE,
  MEMBER_MESSAGE_BOX,
  MemberInsightChip,
  MemberWelcomeParagraph,
} from "@/components/member/dashboard/dashboardUi";
import { FOCUS_RING_CLASS, formatDateFr, initialsFromName } from "@/lib/admin/account/adminAccountUtils";
import type { AdminAccountPayload } from "@/lib/admin/account/adminAccountTypes";

type AdminAccountHeroProps = {
  model: AdminAccountModel;
  data: AdminAccountPayload;
  onRefresh: () => void;
};

export default function AdminAccountHero({ model, data, onRefresh }: AdminAccountHeroProps) {
  const StatusIcon =
    model.tier === "founder"
      ? ShieldCheck
      : model.tier === "moderator_discovery"
        ? Sparkles
        : Compass;

  return (
    <DashboardPanel tone="accent" accentHex={model.accent} intensity="bold" ariaLabelledBy="admin-account-hero-title">
      <div className="grid gap-5 xl:grid-cols-[1fr_11rem] xl:items-start">
        <div className="min-w-0 space-y-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-xl font-bold tracking-tight shadow-inner ring-1 ring-white/10"
              style={{
                borderColor: hexToRgba(model.accent, 0.45),
                background: `linear-gradient(160deg, ${hexToRgba(model.accent, 0.25)}, rgba(20,22,32,0.9))`,
                color: hexToRgba(model.accent, 0.95),
              }}
              aria-hidden
            >
              {initialsFromName(data.displayName)}
            </div>
            <div className="flex flex-wrap gap-2">
              <DashboardBadge tone="accent" accentHex={model.accent}>
                <Compass className="h-3 w-3" aria-hidden />
                {model.welcomeKicker}
              </DashboardBadge>
              <DashboardBadge tone="accent" accentHex={model.accent}>
                <StatusIcon className="h-3 w-3" aria-hidden />
                {model.roleLabel}
              </DashboardBadge>
            </div>
          </div>

          <h1 id="admin-account-hero-title" className={MEMBER_HERO_TITLE}>
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

          <div className="flex flex-wrap gap-2 text-xs text-white/45">
            <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1">
              Membre depuis {formatDateFr(data.memberCreatedAtIso)}
            </span>
            {data.integrationDateIso ? (
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200/90">
                Intégration staff {formatDateFr(data.integrationDateIso)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
          <button
            type="button"
            onClick={onRefresh}
            className={`flex flex-col justify-center rounded-xl border border-white/10 bg-black/25 p-3 text-left transition hover:border-white/20 ${FOCUS_RING_CLASS}`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">{model.heroRefreshKicker}</p>
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-white">
              <RefreshCw className="h-4 w-4" aria-hidden />
              {model.heroRefreshLabel}
            </p>
          </button>
          <Link
            href={model.primaryStaffHref}
            className="group flex flex-col justify-between rounded-xl border border-white/10 bg-black/25 p-3 transition hover:-translate-y-0.5 hover:border-violet-400/35"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-violet-200/80">{model.heroPrimaryKicker}</p>
            <p className="mt-2 text-sm font-bold text-white group-hover:text-violet-100">{model.primaryStaffLabel}</p>
            <p className="mt-1 text-[11px] leading-snug text-white/50">{model.heroPrimaryHint}</p>
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
