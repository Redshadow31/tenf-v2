"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HomeLiveItem = {
  id: string;
  username: string;
  game: string;
  thumbnail: string;
  twitchUrl: string;
};

type HomeLivesScrollerProps = {
  lives: HomeLiveItem[];
};

export default function HomeLivesScroller({ lives }: HomeLivesScrollerProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByDir = useCallback((dir: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const delta = Math.round(el.clientWidth * 0.85) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  if (lives.length === 0) {
    return (
      <article className="about-reveal home-panel-empty col-span-2 rounded-2xl border p-6 md:col-span-3">
        <p className="home-muted">Aucun live détecté pour le moment, reviens dans quelques minutes.</p>
      </article>
    );
  }

  return (
    <div className="relative">
      {lives.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => scrollByDir(-1)}
            className="home-live-scroll-btn absolute left-0 top-1/2 z-[2] hidden -translate-y-1/2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] p-2 text-[var(--color-text)] shadow-lg backdrop-blur-md transition hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-card))] md:flex"
            aria-label="Voir les lives précédents"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => scrollByDir(1)}
            className="home-live-scroll-btn absolute right-0 top-1/2 z-[2] hidden -translate-y-1/2 rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] p-2 text-[var(--color-text)] shadow-lg backdrop-blur-md transition hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-card))] md:flex"
            aria-label="Voir les lives suivants"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </>
      ) : null}

      <div
        ref={scrollerRef}
        className="home-live-scroller flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {lives.map((live) => (
          <article
            key={live.id}
            className="about-reveal home-live-card group w-[min(100%,320px)] shrink-0 snap-start overflow-hidden rounded-2xl border md:w-[calc(33.333%-1rem)]"
          >
            <div className="relative aspect-video overflow-hidden">
              <Image
                src={live.thumbnail}
                alt={live.username}
                fill
                className="home-live-thumbnail object-cover transition duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 85vw, 33vw"
              />
              <span className="home-live-pill absolute left-3 top-3 animate-pulse">EN DIRECT</span>
            </div>
            <div className="space-y-2 p-4 sm:space-y-3 sm:p-5">
              <h3 className="text-lg font-bold">{live.username}</h3>
              <p className="home-muted text-sm">{live.game || "Just Chatting"}</p>
              <Link
                href={live.twitchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="home-btn-primary home-btn-primary--block inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
              >
                Regarder le live
              </Link>
            </div>
          </article>
        ))}
      </div>
      {lives.length > 1 ? (
        <p className="home-muted mt-2 text-center text-xs md:hidden">Fais défiler horizontalement pour voir les autres lives.</p>
      ) : null}
    </div>
  );
}
