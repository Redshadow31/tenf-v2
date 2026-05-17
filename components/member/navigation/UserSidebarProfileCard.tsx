"use client";

import Link from "next/link";
import { ArrowRight, Tv } from "lucide-react";
import type { DiscordUser } from "@/lib/discord";
import { getRoleBadgeLabel } from "@/lib/roleBadgeSystem";

type MemberOverview = {
  member?: { displayName?: string; role?: string; twitchLogin?: string | null };
  vip?: { activeThisMonth?: boolean };
};

type UserSidebarProfileCardProps = {
  discordUser: DiscordUser;
  overview: MemberOverview | null;
  twitchLinked: boolean | null;
  onNavigate?: () => void;
};

function firstName(displayName: string): string {
  const part = displayName.trim().split(/\s+/)[0];
  return part || displayName;
}

export default function UserSidebarProfileCard({ discordUser, overview, twitchLinked, onNavigate }: UserSidebarProfileCardProps) {
  const displayName = overview?.member?.displayName?.trim() || discordUser.username;
  const twitchLogin = overview?.member?.twitchLogin?.trim();
  const roleLabel = overview?.member?.role ? getRoleBadgeLabel(overview.member.role) : null;
  const vipActive = Boolean(overview?.vip?.activeThisMonth);

  const discordHandle = `@${discordUser.username}`;
  const twitchHandle = twitchLogin ? `@${twitchLogin}` : null;
  let secondaryLine: string | null = null;
  if (twitchHandle && twitchHandle.replace("@", "").toLowerCase() !== displayName.toLowerCase().replace(/\s/g, "")) {
    secondaryLine = twitchHandle;
  } else if (discordHandle.replace("@", "").toLowerCase() !== displayName.toLowerCase().replace(/\s/g, "")) {
    secondaryLine = discordHandle;
  }

  const avatarSrc = discordUser.avatar
    ? discordUser.avatar.startsWith("http")
      ? discordUser.avatar
      : `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  const greet = firstName(displayName);

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-3.5">
      <p className="text-sm font-semibold leading-tight text-white">
        Bon retour, <span className="bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent">{greet}</span>
      </p>

      <div className="mt-3 flex items-start gap-3">
        <div className="relative shrink-0">
          <div
            className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-violet-500/60 to-fuchsia-500/40 opacity-90 blur-[2px]"
            aria-hidden
          />
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="relative h-14 w-14 rounded-full border-2 border-white/20 object-cover shadow-lg"
            />
          ) : (
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-violet-400/35 bg-gradient-to-br from-violet-900/80 to-zinc-900 text-lg font-bold text-violet-100 shadow-inner"
              aria-hidden
            >
              {discordUser.username.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="truncate text-base font-bold tracking-tight text-white">{displayName}</p>
          {secondaryLine ? (
            <p className="mt-0.5 truncate text-xs font-medium text-zinc-500">{secondaryLine}</p>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-1.5">
            {roleLabel ? (
              <span className="inline-flex max-w-full items-center rounded-full border border-violet-400/35 bg-violet-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-violet-100">
                {roleLabel}
              </span>
            ) : null}
            {vipActive ? (
              <span className="inline-flex items-center rounded-full border border-amber-400/45 bg-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-50">
                VIP actif
              </span>
            ) : null}
          </div>

          {twitchLinked !== null ? (
            <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-zinc-400">
              <Tv className="h-3.5 w-3.5 shrink-0 text-violet-300/90" aria-hidden />
              <span className="min-w-0 truncate">
                Twitch :{" "}
                <span className={twitchLinked ? "font-medium text-emerald-300/95" : "font-medium text-zinc-500"}>
                  {twitchLinked ? "chaîne liée" : "non liée"}
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <Link
          href="/member/profil"
          onClick={onNavigate}
          className="group inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-violet-400/35 bg-violet-600/15 px-3 py-2 text-xs font-bold text-violet-50 transition hover:border-violet-300/50 hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          Voir mon profil complet
          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
