"use client";

import { PanelLeftClose } from "lucide-react";
import type { DiscordUser } from "@/lib/discord";
import UserSidebarProfileCard from "@/components/member/navigation/UserSidebarProfileCard";
import UserSidebarQuickActions from "@/components/member/navigation/UserSidebarQuickActions";
import UserSidebarVipButton from "@/components/member/navigation/UserSidebarVipButton";

type MemberOverviewPayload = {
  member?: { displayName?: string; role?: string; twitchLogin?: string | null };
  vip?: { activeThisMonth?: boolean };
};

type UserSidebarMemberWelcomeProps = {
  discordUser: DiscordUser;
  overview: MemberOverviewPayload | null;
  twitchLinked: boolean | null;
  pathname: string;
  unreadNotifications: number;
  onNavigate?: () => void;
  showDesktopCollapse?: boolean;
  onRequestCollapseDesktop?: () => void;
};

export default function UserSidebarMemberWelcome({
  discordUser,
  overview,
  twitchLinked,
  pathname,
  unreadNotifications,
  onNavigate,
  showDesktopCollapse = false,
  onRequestCollapseDesktop,
}: UserSidebarMemberWelcomeProps) {
  return (
    <section
      aria-labelledby="sidebar-member-welcome-heading"
      className="rounded-xl border border-violet-500/20 bg-black/30 p-3 shadow-[0_8px_28px_rgba(88,28,135,0.12)]"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id="sidebar-member-welcome-heading" className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-300/95">
            Espace membre
          </h2>
        </div>
        {showDesktopCollapse ? (
          <button
            type="button"
            onClick={onRequestCollapseDesktop}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/25 text-zinc-400 transition hover:border-violet-400/35 hover:text-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/60 xl:inline-flex"
            aria-label="Masquer le menu membre"
            title="Masquer le menu"
          >
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <UserSidebarProfileCard discordUser={discordUser} overview={overview} twitchLinked={twitchLinked} />

      {overview?.vip?.activeThisMonth ? <UserSidebarVipButton onNavigate={onNavigate} /> : null}

      <div className="mt-3 border-t border-white/10 pt-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-200/80">En un clic</p>
        <UserSidebarQuickActions pathname={pathname} unreadNotifications={unreadNotifications} onNavigate={onNavigate} />
      </div>
    </section>
  );
}
