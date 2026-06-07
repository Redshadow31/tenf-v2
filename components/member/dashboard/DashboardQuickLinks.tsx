"use client";

import Link from "next/link";
import { ArrowUpRight, Calendar, Radio, Target, TrendingUp } from "lucide-react";
import type { MemberDashboardModel } from "@/components/member/dashboard/memberDashboardModel";
import { DashboardPanel, DashboardPanelHeader } from "@/components/member/dashboard/dashboardUi";

const LINKS = [
  { href: "/lives", label: "Lives TENF", sub: "Voir qui stream", icon: Radio, tone: "#ef4444" },
  { href: "/member/activite", label: "Mon mois", sub: "Synthèse complète", icon: TrendingUp, tone: "#f97316" },
  { href: "/member/evenements", label: "Événements", sub: "Agenda & inscriptions", icon: Calendar, tone: "#38bdf8" },
  { href: "/member/objectifs", label: "Objectifs", sub: "Tes repères perso", icon: Target, tone: "#a78bfa" },
] as const;

type DashboardQuickLinksProps = {
  model: MemberDashboardModel;
};

export default function DashboardQuickLinks({ model }: DashboardQuickLinksProps) {
  return (
    <DashboardPanel tone="amber" accentHex={model.accent} intensity="soft" ariaLabelledBy="dashboard-quicklinks-title">
      <DashboardPanelHeader
        kicker="Raccourcis"
        title="Accès directs"
        icon={Target}
        tone="amber"
        titleId="dashboard-quicklinks-title"
      />
      <ul className="grid flex-1 content-start gap-2">
        {LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-3 transition hover:-translate-y-0.5 hover:border-white/16"
                style={{ boxShadow: `inset 0 1px 0 ${item.tone}18` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-white/10 transition group-hover:scale-105"
                  style={{ backgroundColor: `${item.tone}20`, color: item.tone }}
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-white">{item.label}</span>
                  <span className="block text-[10px] text-white/45">{item.sub}</span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:text-white/70" aria-hidden />
              </Link>
            </li>
          );
        })}
      </ul>
    </DashboardPanel>
  );
}
