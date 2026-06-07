"use client";

import Link from "next/link";
import { Bell, LayoutDashboard, UserCircle, type LucideIcon } from "lucide-react";

type QuickItem = {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
  active: boolean;
  showUnreadDot?: boolean;
};

type UserSidebarQuickActionsProps = {
  pathname: string;
  unreadNotifications: number;
  onNavigate?: () => void;
};

export default function UserSidebarQuickActions({ pathname, unreadNotifications, onNavigate }: UserSidebarQuickActionsProps) {
  const items: QuickItem[] = [
    {
      href: "/member/dashboard",
      label: "Tableau de bord",
      shortLabel: "Tableau",
      icon: LayoutDashboard,
      active: pathname === "/member/dashboard" || pathname.startsWith("/member/dashboard/"),
    },
    {
      href: "/member/notifications",
      label: "Mes nouvelles",
      shortLabel: "Mes nouv.",
      icon: Bell,
      active: pathname.startsWith("/member/notifications"),
      showUnreadDot: unreadNotifications > 0,
    },
    {
      href: "/member/profil",
      label: "Mon profil",
      shortLabel: "Profil",
      icon: UserCircle,
      active: pathname === "/member/profil" || pathname.startsWith("/member/profil/"),
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Raccourcis rapides">
      {items.map((item) => {
        const active = item.active;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            className={
              "group flex min-h-[2.85rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1.5 text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300 active:scale-[0.97] " +
              (active
                ? "border-violet-400/55 bg-gradient-to-b from-violet-600/35 to-violet-950/30 text-white shadow-[0_0_20px_rgba(139,92,246,0.25)]"
                : "border-white/10 bg-white/[0.04] text-zinc-200 hover:border-violet-400/35 hover:bg-violet-500/10 hover:text-white")
            }
          >
            <span
              className={
                "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-colors " +
                (active
                  ? "border-violet-300/40 bg-violet-500/25 text-white"
                  : "border-white/10 bg-black/30 text-violet-200/90 group-hover:border-violet-400/30 group-hover:bg-violet-500/15")
              }
            >
              <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              {item.showUnreadDot ? (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-zinc-900 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
              ) : null}
            </span>
            <span className="max-w-full truncate text-[10px] font-bold leading-tight sm:text-[11px]">{item.shortLabel}</span>
          </Link>
        );
      })}
    </div>
  );
}
