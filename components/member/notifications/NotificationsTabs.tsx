"use client";

import { Inbox, ShieldAlert, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type AudienceTabKey = "all" | "personal" | "community" | "staff";

type Tab = {
  key: AudienceTabKey;
  label: string;
  icon: LucideIcon;
  count: number;
  unread: number;
  show: boolean;
};

type NotificationsTabsProps = {
  current: AudienceTabKey;
  onChange: (next: AudienceTabKey) => void;
  total: number;
  totalUnread: number;
  personalCount: number;
  personalUnread: number;
  communityCount: number;
  communityUnread: number;
  staffCount: number;
  staffUnread: number;
  showStaff: boolean;
};

export default function NotificationsTabs(props: NotificationsTabsProps) {
  const tabs: Tab[] = [
    { key: "all", label: "Toutes", icon: Inbox, count: props.total, unread: props.totalUnread, show: true },
    { key: "personal", label: "Personnel", icon: User, count: props.personalCount, unread: props.personalUnread, show: true },
    { key: "community", label: "Communauté", icon: Users, count: props.communityCount, unread: props.communityUnread, show: true },
    { key: "staff", label: "Staff", icon: ShieldAlert, count: props.staffCount, unread: props.staffUnread, show: props.showStaff },
  ];

  const visible = tabs.filter((t) => t.show);

  return (
    <div
      role="tablist"
      aria-label="Audience des notifications"
      className="flex flex-nowrap items-stretch gap-1 overflow-x-auto rounded-xl bg-black/20 p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible"
    >
      {visible.map((tab) => {
        const active = tab.key === props.current;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="notifications-list"
            onClick={() => props.onChange(tab.key)}
            className={
              "group inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl px-3 py-2 text-[clamp(0.8rem,0.9vw,0.9rem)] font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 sm:flex-1 " +
              (active
                ? "bg-gradient-to-b from-violet-500/25 to-violet-700/15 text-white shadow-[0_4px_18px_rgba(139,92,246,0.18)] ring-1 ring-violet-400/45"
                : "text-zinc-300 hover:bg-white/[0.04] hover:text-white")
            }
          >
            <Icon
              className={
                "h-4 w-4 shrink-0 transition " + (active ? "text-violet-200" : "text-zinc-400 group-hover:text-violet-200/85")
              }
              aria-hidden
            />
            <span>{tab.label}</span>
            <span className="ml-0.5 inline-flex items-center gap-1">
              <span
                className={
                  "rounded-full px-1.5 py-0.5 text-[10.5px] font-bold tabular-nums " +
                  (active ? "bg-white/15 text-white" : "bg-black/35 text-zinc-300")
                }
              >
                {tab.count}
              </span>
              {tab.unread > 0 ? (
                <span
                  className="rounded-full bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white shadow-sm"
                  title={`${tab.unread} non lue(s)`}
                >
                  {tab.unread}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
