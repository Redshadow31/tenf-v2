"use client";

import Link from "next/link";
import { ArrowUpRight, ClipboardList } from "lucide-react";
import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";

type AdminOpsQueueCardProps = {
  model: AdminDashboardModel;
};

export default function AdminOpsQueueCard({ model }: AdminOpsQueueCardProps) {
  if (!model.showOpsQueue) {
    return (
      <DashboardPanel tone="neutral" accentHex={model.accent} intensity="soft" ariaLabelledBy="admin-ops-pause-title">
      <DashboardPanelHeader
        kicker={model.opsKicker}
        title={model.opsTitle}
        icon={ClipboardList}
        tone="neutral"
        titleId="admin-ops-pause-title"
      />
      <p className="text-sm leading-relaxed text-white/65">{model.opsIntro}</p>
      </DashboardPanel>
    );
  }

  return (
    <DashboardPanel tone="cyan" accentHex={model.accent} intensity="medium" ariaLabelledBy="admin-ops-title">
      <DashboardPanelHeader
        kicker={model.opsKicker}
        title={model.opsTitle}
        icon={ClipboardList}
        tone="cyan"
        accentHex={model.accent}
        titleId="admin-ops-title"
      />
      <p className="mb-4 text-xs leading-relaxed text-white/60">{model.opsIntro}</p>

      {model.opsQueue.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/12 bg-black/20 p-4 text-sm text-white/70">
          {model.opsEmptyMessage}
        </div>
      ) : (
        <ul className="space-y-2">
          {model.opsQueue.slice(0, 5).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 p-3 transition hover:-translate-y-0.5 hover:border-white/16"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.priority === "P1"
                      ? "bg-rose-500/20 text-rose-200"
                      : item.priority === "P2"
                        ? "bg-amber-500/20 text-amber-200"
                        : "bg-sky-500/20 text-sky-200"
                  }`}
                >
                  {item.priority}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <span className="text-lg font-black tabular-nums text-white">{item.count}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-snug text-white/55">{item.helper}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 group-hover:text-white/70" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
