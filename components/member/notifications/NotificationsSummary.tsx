"use client";

import { Bell, ListChecks, ShieldAlert, User, Users, type LucideIcon } from "lucide-react";

type SummaryStat = {
  key: string;
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  toneClass: string;
};

type NotificationsSummaryProps = {
  total: number;
  unread: number;
  personalUnread: number;
  communityUnread: number;
  staffUnread: number;
  showStaff: boolean;
};

export default function NotificationsSummary({
  total,
  unread,
  personalUnread,
  communityUnread,
  staffUnread,
  showStaff,
}: NotificationsSummaryProps) {
  const stats: SummaryStat[] = [
    {
      key: "unread",
      label: "À lire",
      hint: "Notifications non lues",
      value: unread,
      icon: Bell,
      toneClass: "border-violet-400/35 bg-violet-500/10 text-violet-100",
    },
    {
      key: "personal",
      label: "Personnel",
      hint: "Pour toi",
      value: personalUnread,
      icon: User,
      toneClass: "border-sky-400/30 bg-sky-500/10 text-sky-100",
    },
    {
      key: "community",
      label: "Communauté",
      hint: "Annonces TENF",
      value: communityUnread,
      icon: Users,
      toneClass: "border-amber-400/35 bg-amber-500/10 text-amber-100",
    },
  ];

  if (showStaff) {
    stats.push({
      key: "staff",
      label: "Staff",
      hint: "Tâches d’organisation",
      value: staffUnread,
      icon: ShieldAlert,
      toneClass: "border-rose-400/35 bg-rose-500/10 text-rose-100",
    });
  }

  return (
    <section
      aria-label="Résumé des notifications"
      className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-4"
    >
      <div
        className="col-span-2 flex items-center gap-3 rounded-2xl border px-4 py-3 md:col-span-3 xl:col-span-1"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-zinc-300">
          <ListChecks className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Au total</p>
          <p className="text-lg font-bold tabular-nums text-white">{total}</p>
        </div>
      </div>
      {stats.map((stat) => (
        <div
          key={stat.key}
          className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${stat.toneClass}`}
        >
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/25">
            <stat.icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-75">{stat.label}</p>
            <p className="truncate text-xs opacity-80">{stat.hint}</p>
            <p className="mt-0.5 text-lg font-bold tabular-nums text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
