"use client";

import type { AdminDashboardModel } from "@/lib/admin/dashboard/adminDashboardModel";
import {
  DashboardPanel,
  DashboardPanelHeader,
} from "@/components/member/dashboard/dashboardUi";
import { Activity } from "lucide-react";

type AdminRecentActivityCardProps = {
  model: AdminDashboardModel;
  events: Array<{ id: string; type: string; memberId: string; createdAt: string; actor?: string }>;
};

export default function AdminRecentActivityCard({ model, events }: AdminRecentActivityCardProps) {
  return (
    <DashboardPanel tone="neutral" accentHex={model.accent} intensity="soft" ariaLabelledBy="admin-activity-title">
      <DashboardPanelHeader
        kicker={model.activityKicker}
        title={model.activityTitle}
        icon={Activity}
        tone="neutral"
        accentHex={model.accent}
        titleId="admin-activity-title"
      />

      {events.length === 0 ? (
        <p className="text-sm text-white/60">{model.activityEmptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, 8).map((event) => (
            <li
              key={event.id}
              className="flex items-start justify-between gap-3 border-b border-white/8 pb-2 text-sm last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white/90">
                  {event.type} · {event.memberId}
                </p>
                <p className="text-[11px] text-white/45">{event.actor || "system"}</p>
              </div>
              <time className="shrink-0 text-[11px] tabular-nums text-white/45">
                {new Date(event.createdAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </DashboardPanel>
  );
}
