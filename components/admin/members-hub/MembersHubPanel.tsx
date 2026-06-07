"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type MembersHubPanelProps = {
  children: ReactNode;
  accentHex: string;
  className?: string;
  id?: string;
  ariaLabelledBy?: string;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
  intensity?: "soft" | "medium" | "bold";
};

export function MembersHubPanel({
  children,
  accentHex,
  className = "",
  id,
  ariaLabelledBy,
  tone = "neutral",
  intensity = "medium",
}: MembersHubPanelProps) {
  return (
    <DashboardPanel
      id={id}
      ariaLabelledBy={ariaLabelledBy}
      accentHex={accentHex}
      tone={tone}
      intensity={intensity}
      className={className}
    >
      {children}
    </DashboardPanel>
  );
}

type MembersHubPanelHeaderProps = {
  kicker: string;
  title: string;
  intro?: string;
  icon?: LucideIcon;
  accentHex: string;
  titleId?: string;
  badge?: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "info";
};

export function MembersHubPanelHeader({
  kicker,
  title,
  intro,
  icon,
  accentHex,
  titleId,
  badge,
  tone = "accent",
}: MembersHubPanelHeaderProps) {
  return (
    <>
      <DashboardPanelHeader
        kicker={kicker}
        title={title}
        icon={icon}
        accentHex={accentHex}
        tone={tone}
        titleId={titleId}
        badge={badge}
      />
      {intro ? (
        <p className="-mt-1 mb-2 max-w-[62ch] text-sm leading-relaxed text-white/55 md:mb-3">{intro}</p>
      ) : null}
    </>
  );
}
