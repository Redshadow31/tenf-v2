"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, Zap } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardBadge,
  DashboardInteractiveLink,
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type AdminNextActionCardProps = {
  model: AdminDashboardModel;
};

export default function AdminNextActionCard({ model }: AdminNextActionCardProps) {
  const { accent, primaryAction, secondaryActions } = model;

  return (
    <DashboardPanel tone="accent" accentHex={accent} intensity="medium" ariaLabelledBy="admin-next-step-title">
      <DashboardPanelHeader
        kicker={model.nextActionKicker}
        title={model.nextActionTitle}
        icon={Zap}
        tone="accent"
        accentHex={accent}
        titleId="admin-next-step-title"
        badge={
          <DashboardBadge tone="accent" accentHex={accent}>
            <Sparkles className="h-3 w-3" aria-hidden />
            {model.monthLabel}
          </DashboardBadge>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <Link href={primaryAction.href} className="block h-full" target={primaryAction.href.startsWith("/member") ? "_blank" : undefined} rel={primaryAction.href.startsWith("/member") ? "noreferrer" : undefined}>
          <DashboardInteractiveLink accentHex={accent} featured className="h-full p-4 md:p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: hexToRgba(accent, 0.95) }}>
              Action principale
            </p>
            <p className="mt-1.5 text-lg font-bold leading-tight text-white md:text-xl">{primaryAction.label}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/72">{primaryAction.detail}</p>
            <span
              className="mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition group-hover/link:gap-2.5"
              style={{ backgroundColor: hexToRgba(accent, 0.2), color: hexToRgba(accent, 0.98) }}
            >
              Y aller
              <ArrowUpRight size={14} aria-hidden />
            </span>
          </DashboardInteractiveLink>
        </Link>

        <div className="grid gap-2">
          {secondaryActions.length === 0 ? (
            <div className="flex h-full flex-col justify-center rounded-xl border border-dashed border-white/12 bg-black/20 p-4 text-sm text-white/65">
              <p className="font-semibold text-white/90">{model.secondaryEmptyTitle}</p>
              <p className="mt-1.5 leading-relaxed">{model.secondaryEmptyMessage}</p>
            </div>
          ) : (
            secondaryActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="block"
                target={action.href.startsWith("/member") || action.href.startsWith("/rejoindre") ? "_blank" : undefined}
                rel={action.href.startsWith("/member") || action.href.startsWith("/rejoindre") ? "noreferrer" : undefined}
              >
                <DashboardInteractiveLink className="p-3.5">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-white/10"
                      style={{
                        backgroundColor: hexToRgba(accent, 0.16),
                        color: hexToRgba(accent, 0.96),
                      }}
                      aria-hidden
                    >
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{action.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/60">{action.detail}</p>
                    </div>
                  </div>
                </DashboardInteractiveLink>
              </Link>
            ))
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
