"use client";

import Link from "next/link";
import { ArrowUpRight, Flag } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardPanel,
  DashboardPanelHeader,
  MemberDashedFooterLink,
} from "@/components/member/dashboard/dashboardUi";

type AdminDashboardPulseCardsProps = {
  model: AdminDashboardModel;
};

export default function AdminDashboardPulseCards({ model }: AdminDashboardPulseCardsProps) {
  return (
    <DashboardPanel tone="accent" accentHex={model.accent} intensity="soft" ariaLabelledBy="admin-pulse-title">
      <DashboardPanelHeader
        kicker={model.monthLabel}
        title={model.pulseTitle}
        icon={Flag}
        tone="accent"
        accentHex={model.accent}
        titleId="admin-pulse-title"
        badge={
          <DashboardBadge tone="accent" accentHex={model.accent}>
            {model.pulseSummary}
          </DashboardBadge>
        }
      />

      <ul className="flex flex-1 flex-col gap-2">
        {model.pulseIndicators.map((indicator) => (
          <li key={indicator.id}>
            <Link
              href={indicator.href}
              className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/25 px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/14"
              style={{ boxShadow: `inset 0 1px 0 ${hexToRgba(indicator.tone, 0.1)}` }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-black tabular-nums text-white ring-1 ring-white/10"
                style={{ backgroundColor: hexToRgba(indicator.tone, 0.18), color: indicator.tone }}
              >
                {indicator.value}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">{indicator.label}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-white/55">{indicator.hint}</p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/70" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>

      <MemberDashedFooterLink href="/admin/control-center" className="mt-4">
        Control center →
      </MemberDashedFooterLink>
    </DashboardPanel>
  );
}
