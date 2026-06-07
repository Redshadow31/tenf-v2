"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CircleDot,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { MemberProfileModel } from "@/components/member/profil/memberProfileModel";
import {
  DashboardBadge,
  DashboardPanel,
  DashboardPanelHeader,
  MemberDashedFooterLink,
  MemberProgressBar,
} from "@/components/member/dashboard/dashboardUi";

const STATUS_ICON: Record<
  "ok" | "warning" | "missing",
  { icon: LucideIcon; color: string; label: string }
> = {
  ok: { icon: CheckCircle2, color: "#22c55e", label: "OK" },
  warning: { icon: AlertTriangle, color: "#f59e0b", label: "À peaufiner" },
  missing: { icon: CircleDot, color: "#f472b6", label: "Manquant" },
};

type ProfileChecklistPanelProps = {
  model: MemberProfileModel;
  compact?: boolean;
};

export default function ProfileChecklistPanel({ model, compact = false }: ProfileChecklistPanelProps) {
  const { accent, checklist, checklistSummary, profilePercent } = model;

  return (
    <DashboardPanel
      tone="accent"
      accentHex={accent}
      intensity="soft"
      ariaLabelledBy="profile-checklist-title"
      className={compact ? "" : "h-full"}
    >
      <DashboardPanelHeader
        kicker="Complétion"
        title="Ta checklist"
        icon={ClipboardList}
        tone="accent"
        accentHex={accent}
        titleId="profile-checklist-title"
        badge={
          <DashboardBadge tone="accent" accentHex={accent}>
            {checklistSummary}
          </DashboardBadge>
        }
      />

      <div className="mb-3">
        <MemberProgressBar percent={profilePercent} accentHex={accent} />
      </div>

      <ul className={`flex flex-col gap-1.5 ${compact ? "" : "flex-1 justify-between"}`}>
        {checklist.map((item) => {
          const cfg = STATUS_ICON[item.status];
          const Icon = cfg.icon;
          const inner = (
            <div className={`flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 transition hover:border-white/14 hover:bg-white/[0.03] ${compact ? "px-2.5 py-2" : "gap-2.5 px-3 py-2.5"}`}>
              <Icon className="h-4 w-4 shrink-0" style={{ color: cfg.color }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-white">{item.label}</span>
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide" style={{ color: cfg.color }}>
                {cfg.label}
              </span>
              {item.href ? (
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/20" aria-hidden />
              ) : null}
            </div>
          );

          return (
            <li key={item.id}>
              {item.href ? (
                <Link href={item.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>

      {!compact ? (
        <MemberDashedFooterLink href="/member/profil/completer" className="mt-2 shrink-0">
          Compléter mon profil →
        </MemberDashedFooterLink>
      ) : null}
    </DashboardPanel>
  );
}
