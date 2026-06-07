"use client";

import Link from "next/link";
import { ArrowUpRight, BookOpen, Sparkles } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import { hexToRgba } from "@/components/member/dashboard/memberDashboardModel";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type AdminRoleGuideCardProps = {
  model: AdminDashboardModel;
};

export default function AdminRoleGuideCard({ model }: AdminRoleGuideCardProps) {
  const { roleGuide, accent } = model;

  return (
    <DashboardPanel tone="violet" accentHex={accent} intensity="soft" ariaLabelledBy="admin-role-guide-title">
      <DashboardPanelHeader
        kicker={model.roleGuideKicker}
        title={roleGuide.title}
        icon={model.tier === "moderator_discovery" ? Sparkles : BookOpen}
        tone="violet"
        accentHex={accent}
        titleId="admin-role-guide-title"
      />

      <div className="space-y-3 text-sm leading-relaxed text-white/75">
        {roleGuide.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 40)}>{paragraph}</p>
        ))}
      </div>

      {roleGuide.bullets && roleGuide.bullets.length > 0 ? (
        <ul className="mt-4 space-y-2 border-t border-white/10 pt-4">
          {roleGuide.bullets.map((bullet) => (
            <li key={bullet.slice(0, 48)} className="flex gap-2 text-xs leading-relaxed text-white/70">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {roleGuide.cta ? (
        <Link
          href={roleGuide.cta.href}
          className="mt-4 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition hover:-translate-y-0.5"
          style={{
            backgroundColor: hexToRgba(accent, 0.22),
            color: hexToRgba(accent, 0.98),
            border: `1px solid ${hexToRgba(accent, 0.35)}`,
          }}
        >
          {roleGuide.cta.label}
          <ArrowUpRight size={13} aria-hidden />
        </Link>
      ) : null}
    </DashboardPanel>
  );
}
