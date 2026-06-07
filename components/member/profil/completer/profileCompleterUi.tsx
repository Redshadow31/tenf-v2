"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  type DashboardTone,
} from "@/components/member/dashboard/dashboardUi";

export const FIELD_CLASS =
  "w-full rounded-xl border border-white/12 bg-black/30 px-3.5 py-3 text-sm text-white placeholder:text-white/35 backdrop-blur-sm transition focus:border-violet-500/45 focus:outline-none focus:ring-2 focus:ring-violet-500/15 disabled:opacity-60";
export const FIELD_LABEL = "mb-1.5 block text-sm font-medium text-white/85";
export const FIELD_HINT = "mt-1.5 text-xs leading-relaxed text-white/45";

type CompleterPanelProps = {
  id?: string;
  kicker?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: DashboardTone;
  accentHex?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function CompleterPanel({
  id,
  kicker = "Profil",
  title,
  description,
  icon,
  tone = "neutral",
  accentHex = "#9146ff",
  badge,
  children,
  className = "",
}: CompleterPanelProps) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <DashboardPanel
      id={id}
      tone={tone}
      accentHex={accentHex}
      intensity="medium"
      ariaLabelledBy={titleId}
      className={`h-full ${className}`}
    >
      <DashboardPanelHeader
        kicker={kicker}
        title={title}
        icon={icon}
        tone={tone}
        accentHex={accentHex}
        titleId={titleId}
        badge={badge}
      />
      {description ? (
        <p className="-mt-1 mb-3 text-sm leading-relaxed text-white/65">{description}</p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </DashboardPanel>
  );
}
