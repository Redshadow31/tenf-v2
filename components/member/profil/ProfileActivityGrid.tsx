"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Crown, Gamepad2, ShieldCheck, Zap, type LucideIcon } from "lucide-react";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import { hexToRgba } from "@/components/member/profil/memberProfileModel";
import {
  DashboardInteractiveLink,
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
} from "@/components/member/dashboard/dashboardUi";

type Tile = {
  href: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint: string;
  tone: string;
};

type ProfileActivityGridProps = {
  model: MemberProfileModel;
  upcomingEvents: number;
  raidsThisMonth: number;
  presencesThisMonth: number;
  formationsValidated: number;
  vipStatusLabel: string;
};

export default function ProfileActivityGrid({
  model,
  upcomingEvents,
  raidsThisMonth,
  presencesThisMonth,
  formationsValidated,
  vipStatusLabel,
}: ProfileActivityGridProps) {
  const { accent, activityHeadline, activitySubline } = model;

  const tiles: Tile[] = [
    {
      href: "/member/evenements",
      icon: CalendarDays,
      label: "Événements",
      value: upcomingEvents,
      hint: "Agenda TENF",
      tone: "#a78bfa",
    },
    {
      href: "/lives",
      icon: Zap,
      label: "Raids ce mois",
      value: raidsThisMonth,
      hint: "Via lives TENF",
      tone: "#f472b6",
    },
    {
      href: "/member/evenements/presences",
      icon: Gamepad2,
      label: "Présences",
      value: presencesThisMonth,
      hint: "Ce mois-ci",
      tone: "#38bdf8",
    },
    {
      href: "/member/formations/validees",
      icon: ShieldCheck,
      label: "Formations",
      value: formationsValidated,
      hint: "Academy",
      tone: "#22c55e",
    },
    {
      href: "/member/engagement/score",
      icon: Crown,
      label: "VIP TENF",
      value: vipStatusLabel || "—",
      hint: "Statut du mois",
      tone: "#facc15",
    },
  ];

  return (
    <DashboardPanel
      id="profil-engagement"
      tone="rose"
      accentHex={accent}
      intensity="soft"
      ariaLabelledBy="profile-activity-title"
      className={MEMBER_SCROLL_MT}
    >
      <DashboardPanelHeader
        kicker="En un coup d'œil"
        title={activityHeadline}
        icon={Zap}
        tone="rose"
        accentHex="#f472b6"
        titleId="profile-activity-title"
        badge={
          <Link href="/member/activite" className="text-[11px] font-bold text-rose-300 hover:text-white">
            Mon mois →
          </Link>
        }
      />
      <p className="-mt-1.5 mb-2 text-xs text-white/55">{activitySubline}</p>

      <div className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.href} href={tile.href} className="block h-full">
              <DashboardInteractiveLink accentHex={tile.tone} className="h-full p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-white/10"
                    style={{
                      backgroundColor: hexToRgba(tile.tone, 0.18),
                      color: hexToRgba(tile.tone, 0.95),
                    }}
                    aria-hidden
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-white/25" aria-hidden />
                </div>
                <p className="mt-1.5 text-lg font-black tabular-nums text-white">{tile.value}</p>
                <p className="mt-0.5 text-xs font-bold text-white/90">{tile.label}</p>
                <p className="text-[10px] text-white/45">{tile.hint}</p>
              </DashboardInteractiveLink>
            </Link>
          );
        })}
      </div>
    </DashboardPanel>
  );
}
