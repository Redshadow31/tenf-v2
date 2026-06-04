"use client";

import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import theme from "@/components/members/membres-theme.module.css";

export type MembresDirectoryMemberCardProps = {
  displayName: string;
  twitchLogin: string;
  avatarSrc: string;
  primaryGame: string;
  badgeRow: ReactNode;
  posterSrc?: string;
  posterAlt?: string;
  description?: string;
  followCorner?: ReactNode;
  onOpenProfile: () => void;
  twitchUrl: string;
  density?: "comfortable" | "compact";
};

export default function MembresDirectoryMemberCard({
  displayName,
  twitchLogin,
  avatarSrc,
  primaryGame,
  badgeRow,
  posterSrc,
  posterAlt,
  description,
  followCorner,
  onOpenProfile,
  twitchUrl,
  density = "comfortable",
}: MembresDirectoryMemberCardProps) {
  const compact = density === "compact";
  const avatarSize = compact ? "h-10 w-10" : "h-14 w-14";
  const padding = compact ? "p-3" : "p-4 sm:p-5";

  return (
    <article className={`group/card relative ${theme.memberCard} ${padding}`}>
      <div className={theme.memberCardGlow} aria-hidden />

      {posterSrc ? (
        <div className={`relative mb-3 overflow-hidden rounded-xl ${compact ? "" : "-mx-0.5"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterSrc}
            alt={posterAlt || ""}
            className="aspect-video w-full object-cover transition duration-500 group-hover/card:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-black/40 to-transparent" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg animate-pulse">
            En direct
          </span>
        </div>
      ) : null}

      <div className="relative z-[1] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarSrc}
              alt=""
              className={`${avatarSize} shrink-0 rounded-full border-2 border-violet-500/25 object-cover shadow-md ring-2 ring-transparent transition group-hover/card:ring-emerald-400/35`}
            />
            <div className="min-w-0">
              <p className="truncate font-bold tracking-tight text-white">{displayName}</p>
              <p className="truncate text-xs text-violet-200/85">@{twitchLogin}</p>
              <p className="mt-0.5 truncate text-xs text-zinc-400">{primaryGame}</p>
            </div>
          </div>
          {followCorner ? <div className="shrink-0">{followCorner}</div> : null}
        </div>

        {description ? (
          <p className={`text-xs leading-relaxed text-zinc-400 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>
            {description}
          </p>
        ) : (
          <p className="text-xs italic text-zinc-500">Bio à découvrir dans la fiche TENF.</p>
        )}

        <div className={`flex flex-wrap gap-1.5 text-[11px] [&_.role-badge]:max-w-full`}>{badgeRow}</div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
          <button type="button" className={`${theme.btnPrimary} min-h-[44px] flex-1`} onClick={onOpenProfile}>
            Ouvrir la fiche
            <ArrowRight
              className="h-4 w-4 shrink-0 opacity-95 group-hover/card:translate-x-0.5 motion-safe:transition-transform"
              aria-hidden
            />
          </button>
          <a
            href={twitchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${theme.btnSecondary} min-h-[44px] flex-1`}
          >
            Voir sur Twitch
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
