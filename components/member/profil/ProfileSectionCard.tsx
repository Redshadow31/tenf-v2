"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  DashboardPanel,
  DashboardPanelHeader,
  MEMBER_SCROLL_MT,
  type DashboardTone,
} from "@/components/member/dashboard/dashboardUi";

type ProfileSectionCardProps = {
  id?: string;
  kicker?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  tone?: DashboardTone;
  accentHex?: string;
  intensity?: "soft" | "medium" | "bold";
  rightSlot?: ReactNode;
  children: ReactNode;
};

export default function ProfileSectionCard({
  id,
  kicker = "Profil",
  title,
  description,
  icon: Icon,
  tone = "neutral",
  accentHex = "#9146ff",
  intensity = "medium",
  rightSlot,
  children,
}: ProfileSectionCardProps) {
  const titleId = id ? `${id}-title` : undefined;

  return (
    <DashboardPanel
      id={id}
      tone={tone}
      accentHex={accentHex}
      intensity={intensity}
      ariaLabelledBy={titleId}
      className={`${MEMBER_SCROLL_MT}`}
    >
      <DashboardPanelHeader
        kicker={kicker}
        title={title}
        icon={Icon}
        tone={tone}
        accentHex={accentHex}
        titleId={titleId}
        badge={rightSlot}
      />
      {description ? (
        <p className="-mt-1 mb-3 text-sm leading-relaxed text-white/65">{description}</p>
      ) : null}
      <div className="flex flex-col">{children}</div>
    </DashboardPanel>
  );
}
