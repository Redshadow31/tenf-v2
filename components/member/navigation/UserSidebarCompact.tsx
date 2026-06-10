"use client";

import Link from "next/link";
import { ArrowRight, Bell, LayoutDashboard } from "lucide-react";
import type { DiscordUser } from "@/lib/discord";
import UserSidebarVipButton from "@/components/member/navigation/UserSidebarVipButton";

type UserSidebarCompactProps = {
  discordUser: DiscordUser;
  displayName: string;
  unreadNotifications: number;
  vipActiveThisMonth?: boolean;
  onNavigate?: () => void;
};

export default function UserSidebarCompact({
  discordUser,
  displayName,
  unreadNotifications,
  vipActiveThisMonth = false,
  onNavigate,
}: UserSidebarCompactProps) {
  const avatarSrc = discordUser.avatar
    ? discordUser.avatar.startsWith("http")
      ? discordUser.avatar
      : `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  return (
    <section
      aria-labelledby="sidebar-compact-heading"
      className="rounded-xl border border-violet-500/20 bg-black/25 p-3.5"
    >
      <h2 id="sidebar-compact-heading" className="sr-only">
        Accès rapide à l’espace membre
      </h2>

      <div className="flex items-center gap-3">
        {avatarSrc ? (
          <img src={avatarSrc} alt="" className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover" />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-950/60 text-sm font-bold text-violet-100"
            aria-hidden
          >
            {discordUser.username.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{displayName}</p>
          <p className="truncate text-xs text-zinc-500">@{discordUser.username}</p>
        </div>
      </div>

      <Link
        href="/member/dashboard"
        onClick={onNavigate}
        className="mt-3 flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-violet-600/15 px-3 py-2 text-sm font-bold text-violet-50 transition hover:border-violet-300/50 hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
        Mon espace membre
        <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
      </Link>

      {vipActiveThisMonth ? <UserSidebarVipButton onNavigate={onNavigate} /> : null}

      {unreadNotifications > 0 ? (
        <Link
          href="/member/notifications"
          onClick={onNavigate}
          className="mt-2 flex min-h-[36px] w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-violet-400/30 hover:text-white"
        >
          <Bell className="h-3.5 w-3.5 shrink-0 text-violet-300" aria-hidden />
          {unreadNotifications} nouvelle{unreadNotifications > 1 ? "s" : ""} non lue{unreadNotifications > 1 ? "s" : ""}
        </Link>
      ) : null}
    </section>
  );
}
