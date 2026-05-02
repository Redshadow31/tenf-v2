"use client";

import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";

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
    <article
      className={`group/card relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:border-violet-400/45 hover:shadow-[0_22px_56px_rgba(88,28,135,0.22)] ${padding}`}
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        boxShadow: "0 12px 32px rgba(0,0,0,0.22)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% -20%, rgba(167,139,250,0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(236,72,153,0.08), transparent 45%)",
        }}
        aria-hidden
      />

      {posterSrc ? (
        <div className={`relative mb-3 overflow-hidden rounded-xl ${compact ? "" : "-mx-1"}`}>
          <img src={posterSrc} alt={posterAlt || ""} className="aspect-video w-full object-cover transition duration-500 group-hover/card:scale-[1.03]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-card)] via-black/40 to-transparent" />
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg animate-pulse">
            En direct
          </span>
        </div>
      ) : null}

      <div className="relative z-[1] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-3">
            <img
              src={avatarSrc}
              alt=""
              className={`${avatarSize} shrink-0 rounded-full border-2 border-violet-500/20 object-cover shadow-md ring-2 ring-transparent transition group-hover/card:ring-violet-400/40`}
              style={{ borderColor: "var(--color-border)" }}
            />
            <div className="min-w-0">
              <p className="truncate font-bold tracking-tight" style={{ color: "var(--color-text)" }}>
                {displayName}
              </p>
              <p className="truncate text-xs text-violet-300/90">@{twitchLogin}</p>
              <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                {primaryGame}
              </p>
            </div>
          </div>
          {followCorner ? <div className="shrink-0">{followCorner}</div> : null}
        </div>

        {description ? (
          <p className={`text-xs leading-relaxed text-zinc-400 ${compact ? "line-clamp-2" : "line-clamp-3"}`}>{description}</p>
        ) : (
          <p className="text-xs italic text-zinc-500">Bio à découvrir dans la fiche TENF.</p>
        )}

        <div className="flex flex-wrap gap-1.5 text-[11px]">{badgeRow}</div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:items-stretch">
          <button
            type="button"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_rgba(124,58,237,0.35)] transition hover:brightness-110 active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg, #c084fc 0%, var(--color-primary) 45%, #7c3aed 100%)" }}
            onClick={onOpenProfile}
          >
            Ouvrir la fiche
            <ArrowRight className="h-4 w-4 shrink-0 opacity-95 group-hover/card:translate-x-0.5 motion-safe:transition-transform" aria-hidden />
          </button>
          <a
            href={twitchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-violet-400/45 hover:bg-violet-500/12"
          >
            Voir sur Twitch
            <ExternalLink className="h-3.5 w-3.5 opacity-80" aria-hidden />
          </a>
        </div>
      </div>
    </article>
  );
}
