"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  LayoutDashboard,
  MessageSquare,
  Radio,
  ShieldAlert,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AudienceTabKey } from "@/components/member/notifications/NotificationsTabs";

type AudienceRow = {
  key: Exclude<AudienceTabKey, "all">;
  label: string;
  hint: string;
  icon: LucideIcon;
  count: number;
  unread: number;
  toneClass: string;
};

type NotificationsAsideProps = {
  total: number;
  unread: number;
  personalCount: number;
  personalUnread: number;
  communityCount: number;
  communityUnread: number;
  staffCount: number;
  staffUnread: number;
  showStaff: boolean;
  audienceTab: AudienceTabKey;
  onSelectAudience: (next: AudienceTabKey) => void;
};

const SHORTCUTS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/member/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/member/evenements", label: "Agenda TENF", icon: Calendar },
  { href: "/lives", label: "Lives en cours", icon: Radio },
  { href: "/contact", label: "Contacter le staff", icon: MessageSquare },
];

export default function NotificationsAside({
  total,
  unread,
  personalCount,
  personalUnread,
  communityCount,
  communityUnread,
  staffCount,
  staffUnread,
  showStaff,
  audienceTab,
  onSelectAudience,
}: NotificationsAsideProps) {
  const rows: AudienceRow[] = [
    {
      key: "personal",
      label: "Personnel",
      hint: "Pour toi",
      icon: User,
      count: personalCount,
      unread: personalUnread,
      toneClass: "from-sky-500/12 to-transparent border-sky-400/25",
    },
    {
      key: "community",
      label: "Communauté",
      hint: "Annonces TENF",
      icon: Users,
      count: communityCount,
      unread: communityUnread,
      toneClass: "from-amber-500/12 to-transparent border-amber-400/25",
    },
  ];
  if (showStaff) {
    rows.push({
      key: "staff",
      label: "Staff",
      hint: "Tâches d’organisation",
      icon: ShieldAlert,
      count: staffCount,
      unread: staffUnread,
      toneClass: "from-rose-500/12 to-transparent border-rose-400/25",
    });
  }

  const progress = total > 0 ? Math.round(((total - unread) / total) * 100) : 100;

  return (
    <aside
      aria-label="Résumé et raccourcis"
      className="space-y-4 lg:sticky lg:top-3 lg:max-h-[calc(100dvh-1.5rem)] lg:overflow-y-auto lg:pr-1"
    >
      <section
        className="rounded-2xl border p-4"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-100">
            <Bell className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">État du fil</p>
            <p className="mt-0.5 text-pretty text-sm text-zinc-300">
              <span className="text-base font-extrabold tabular-nums text-white">{unread}</span>{" "}
              <span className="text-zinc-400">à lire sur</span>{" "}
              <span className="font-bold tabular-nums text-white">{total}</span>
            </p>
          </div>
        </div>

        <div
          aria-hidden
          className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]"
          title={`${progress}% lu`}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
          {progress}% de tes notifications sont lues
        </p>
      </section>

      <section
        className="rounded-2xl border p-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Audiences</p>
        <ul className="space-y-1.5">
          <li>
            <AudienceButton
              active={audienceTab === "all"}
              onClick={() => onSelectAudience("all")}
              label="Toutes"
              hint="Vue complète"
              icon={Bell}
              count={total}
              unread={unread}
              toneClass="from-violet-500/12 to-transparent border-violet-400/30"
            />
          </li>
          {rows.map((row) => (
            <li key={row.key}>
              <AudienceButton
                active={audienceTab === row.key}
                onClick={() => onSelectAudience(row.key)}
                label={row.label}
                hint={row.hint}
                icon={row.icon}
                count={row.count}
                unread={row.unread}
                toneClass={row.toneClass}
              />
            </li>
          ))}
        </ul>
      </section>

      <section
        className="rounded-2xl border p-3"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
      >
        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">Raccourcis utiles</p>
        <ul className="grid grid-cols-2 gap-1.5">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.href}>
              <Link
                href={shortcut.href}
                className="group flex h-full min-h-[3.25rem] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[12px] font-semibold text-zinc-300 transition hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white"
              >
                <shortcut.icon className="h-4 w-4 shrink-0 text-violet-300/80 group-hover:text-violet-200" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{shortcut.label}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 transition group-hover:text-violet-200" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function AudienceButton({
  active,
  onClick,
  label,
  hint,
  icon: Icon,
  count,
  unread,
  toneClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
  icon: LucideIcon;
  count: number;
  unread: number;
  toneClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border bg-gradient-to-r px-3 py-2.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 " +
        toneClass +
        " " +
        (active
          ? "ring-1 ring-violet-300/35"
          : "opacity-90 hover:opacity-100")
      }
    >
      <span
        aria-hidden
        className={
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-black/30 " +
          (active ? "border-white/25 text-white" : "border-white/10 text-zinc-300")
        }
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight text-white">{label}</span>
        <span className="block text-[11px] leading-tight text-zinc-400">{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {unread > 0 ? (
          <span className="rounded-full bg-rose-500/85 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white">
            {unread}
          </span>
        ) : null}
        <span className="rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-zinc-300">
          {count}
        </span>
      </span>
    </button>
  );
}
