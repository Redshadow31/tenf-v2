"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Play } from "lucide-react";
import type { DiscoverClip } from "@/components/decouvrir/types";
import {
  categoryLabel,
  formatDate,
  formatDuration,
  formatViews,
  styleChipClass,
  styleLabel,
} from "@/lib/decouvrir/format";
import { rolePillClass } from "@/lib/decouvrir/rolePillClass";
import { getRoleBadgeLabel, getRoleBadgeVariant } from "@/lib/roleBadgeSystem";

type DiscoverClipCardProps = {
  clip: DiscoverClip;
};

export default function DiscoverClipCard({ clip }: DiscoverClipCardProps) {
  const twitchChannel = `https://www.twitch.tv/${clip.creatorLogin}`;
  const membresHref = `/membres?member=${encodeURIComponent(clip.creatorLogin)}`;
  const thumbAlt = `Miniature du clip : ${clip.title}`;
  const avatarAlt = `Avatar de ${clip.creatorName}`;
  const roleLabel = clip.memberRole ? getRoleBadgeLabel(clip.memberRole) : null;
  const roleVariant = clip.memberRole ? getRoleBadgeVariant(clip.memberRole) : null;

  return (
    <article
      className="group/card flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/35 hover:shadow-[0_24px_64px_rgba(88,28,135,0.22)] focus-within:ring-2 focus-within:ring-violet-400/50"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)" }}
    >
      <a
        href={clip.url}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-video min-h-0 overflow-hidden bg-black outline-none ring-offset-2 ring-offset-[var(--color-bg)] focus-visible:ring-2 focus-visible:ring-violet-400"
        aria-label={`Voir le clip sur Twitch : ${clip.title}`}
      >
        <img src={clip.thumbnailUrl} alt={thumbAlt} className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.04]" loading="lazy" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/25 to-transparent opacity-95" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover/card:opacity-100 group-focus-within/card:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-white shadow-xl backdrop-blur-md ring-2 ring-white/40">
            <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
          </span>
        </div>
        <div className="absolute left-2 top-2 flex max-w-[calc(100%-5rem)] flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${styleChipClass(clip.style)}`}>
            {styleLabel(clip.style)}
          </span>
          <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {categoryLabel(clip.category)}
          </span>
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
          {formatDuration(clip.duration)}
        </div>
        <p className="pointer-events-none absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-md sm:text-sm">
          {clip.title}
        </p>
      </a>

      <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <a
            href={twitchChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 rounded-full ring-2 ring-violet-500/25 outline-none transition hover:ring-violet-400/50 focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label={`Chaîne Twitch de ${clip.creatorName}`}
          >
            <img
              src={clip.creatorAvatar || `https://unavatar.io/twitch/${clip.creatorLogin}`}
              alt={avatarAlt}
              className="h-11 w-11 rounded-full object-cover"
              loading="lazy"
            />
          </a>
          <div className="min-w-0 flex-1">
            <a
              href={twitchChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate font-bold text-white outline-none transition hover:text-violet-200 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
            >
              {clip.creatorName}
            </a>
            <p className="truncate text-xs text-zinc-400">@{clip.creatorLogin}</p>
            {roleLabel && roleVariant ? (
              <p className="mt-2">
                <span className={rolePillClass(roleVariant)}>{roleLabel}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-400">{formatViews(clip.viewCount)} vues</span>
          <span aria-hidden>·</span>
          <span>{clip.language.toUpperCase()}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(clip.createdAt)}</span>
        </div>

        <div className="mt-auto flex min-w-0 flex-col gap-2 sm:flex-row">
          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(124,58,237,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 active:scale-[0.99]"
          >
            <Play className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Voir le clip
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          </a>
          <Link
            href={membresHref}
            className="inline-flex min-h-[44px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-violet-400/40 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Découvrir son profil
            <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}
