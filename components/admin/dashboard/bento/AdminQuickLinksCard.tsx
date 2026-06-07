"use client";

import Link from "next/link";
import { ArrowUpRight, Target } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type AdminQuickLinksCardProps = {
  model: AdminDashboardModel;
};

export default function AdminQuickLinksCard({ model }: AdminQuickLinksCardProps) {
  return (
    <DashboardPanel tone="amber" accentHex={model.accent} intensity="soft" ariaLabelledBy="admin-quicklinks-title">
      <DashboardPanelHeader
        kicker={model.quickLinksKicker}
        title={model.quickLinksTitle}
        icon={Target}
        tone="amber"
        accentHex={model.accent}
        titleId="admin-quicklinks-title"
      />
      <p className="mb-3 text-xs leading-relaxed text-white/55">{model.quickLinksIntro}</p>
      <ul className="grid flex-1 content-start gap-2">
        {model.quickLinks.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/16"
              style={{ boxShadow: `inset 0 1px 0 ${item.tone}18` }}
              target={item.href.startsWith("/member") || item.href.startsWith("/rejoindre") ? "_blank" : undefined}
              rel={item.href.startsWith("/member") || item.href.startsWith("/rejoindre") ? "noreferrer" : undefined}
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10"
                style={{ backgroundColor: `${item.tone}20`, color: item.tone }}
                aria-hidden
              >
                <Target className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">{item.label}</span>
                <span className="block text-[10px] text-white/45">{item.sub}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 group-hover:text-white/70" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
