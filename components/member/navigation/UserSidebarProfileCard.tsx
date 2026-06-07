"use client";

import { Tv } from "lucide-react";
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
};

function firstName(displayName: string): string {
  const part = displayName.trim().split(/\s+/)[0];
  return part || displayName;
}

export default function UserSidebarProfileCard({ discordUser, overview, twitchLinked }: UserSidebarProfileCardProps) {
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
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
      <p className="text-xs font-semibold leading-tight text-zinc-300">
        Bon retour, <span className="text-violet-100">{greet}</span>
      </p>

      <div className="mt-2.5 flex items-center gap-2.5">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full border border-white/15 object-cover"
          />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-950/60 text-sm font-bold text-violet-100"
            aria-hidden
          >
            {discordUser.username.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{displayName}</p>
          {secondaryLine ? <p className="truncate text-[11px] text-zinc-500">{secondaryLine}</p> : null}

          <div className="mt-1.5 flex flex-wrap gap-1">
            {roleLabel ? (
              <span className="inline-flex max-w-full items-center rounded-full border border-violet-400/30 bg-violet-500/12 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                {roleLabel}
              </span>
            ) : null}
            {vipActive ? (
              <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-50">
                VIP actif
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {twitchLinked !== null ? (
        <div className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/10 bg-black/25 px-2 py-1 text-[10px] text-zinc-400">
          <Tv className="h-3 w-3 shrink-0 text-violet-300/90" aria-hidden />
          <span className="min-w-0 truncate">
            Twitch :{" "}
            <span className={twitchLinked ? "font-medium text-emerald-300/95" : "font-medium text-zinc-500"}>
              {twitchLinked ? "liée" : "non liée"}
            </span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
