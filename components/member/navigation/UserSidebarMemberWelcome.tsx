"use client";

import type { DiscordUser } from "@/lib/discord";
import UserSidebarProfileCard from "@/components/member/navigation/UserSidebarProfileCard";
import UserSidebarQuickActions from "@/components/member/navigation/UserSidebarQuickActions";

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
};

/**
 * Bloc haut de la sidebar membre : carte identité + raccourcis, présentation accueillante et lisible.
 */
export default function UserSidebarMemberWelcome({
  discordUser,
  overview,
  twitchLinked,
  pathname,
  unreadNotifications,
  onNavigate,
}: UserSidebarMemberWelcomeProps) {
  return (
    <section
      aria-labelledby="sidebar-member-welcome-heading"
      className="relative overflow-hidden rounded-2xl border border-violet-500/25 bg-gradient-to-b from-violet-950/35 via-zinc-950/70 to-black/30 p-[1px] shadow-[0_12px_40px_rgba(88,28,135,0.18)]"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fuchsia-600/20 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-violet-600/25 blur-3xl" aria-hidden />

      <div className="relative rounded-[0.9rem] bg-black/35 px-4 pb-4 pt-3.5 backdrop-blur-[2px] sm:px-4 sm:pb-4 sm:pt-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 id="sidebar-member-welcome-heading" className="sr-only">
              Ton espace membre TENF
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-300/95">Espace membre</p>
            <p className="mt-1 text-pretty text-xs leading-snug text-zinc-400">
              Un aperçu de ton compte et des raccourcis pour naviguer vite.
            </p>
          </div>
        </div>

        <UserSidebarProfileCard
          discordUser={discordUser}
          overview={overview}
          twitchLinked={twitchLinked}
          onNavigate={onNavigate}
        />

        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-violet-200/85">En un clic</p>
          <UserSidebarQuickActions
            pathname={pathname}
            unreadNotifications={unreadNotifications}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </section>
  );
}
