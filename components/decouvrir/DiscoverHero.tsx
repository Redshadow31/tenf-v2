"use client";

import Link from "next/link";
import { Clapperboard, ExternalLink } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

type DiscoverHeroProps = {
  onExploreSelection: () => void;
};

export default function DiscoverHero({ onExploreSelection }: DiscoverHeroProps) {
  const c = DISCOVER_COPY.hero;

  return (
    <section
      aria-labelledby="discover-hero-heading"
      className="relative overflow-hidden rounded-3xl border border-violet-500/20 p-6 sm:p-8 lg:p-10"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          background:
            "linear-gradient(125deg, rgba(12,10,18,0.98) 0%, rgba(48,22,72,0.88) 42%, rgba(18,14,28,0.97) 100%)",
        }}
      />
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 right-[-8%] h-72 w-72 rounded-full bg-fuchsia-600/22 blur-3xl" />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-[min(42rem,100%)] flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/35 bg-violet-500/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100">
              <Clapperboard className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {c.badge}
            </span>
          </div>
          <h1 id="discover-hero-heading" className="mt-4 text-balance text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.5rem]">
            {c.h1}
          </h1>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">{c.lead}</p>

          <div className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onExploreSelection}
              className="inline-flex min-h-[48px] min-w-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(124,58,237,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 active:scale-[0.99]"
            >
              {c.ctaExplore}
            </button>
            <Link
              href="/lives"
              className="inline-flex min-h-[48px] min-w-0 items-center justify-center gap-2 rounded-xl border border-white/18 bg-white/[0.07] px-6 py-3 text-sm font-bold text-white transition hover:border-red-400/35 hover:bg-red-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300/80"
            >
              {c.ctaLives}
              <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            </Link>
          </div>

          <p className="mt-5 text-sm">
            <Link
              href="/membres"
              className="font-semibold text-violet-200 underline-offset-4 transition hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200"
            >
              {c.linkAnnuaire}
            </Link>
          </p>

          <p className="mt-4 max-w-xl text-xs leading-relaxed text-zinc-500 sm:text-sm">{c.reassurance}</p>
        </div>

        <aside
          className="w-full shrink-0 rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm lg:max-w-sm xl:max-w-md"
          aria-label="Rappel des autres espaces TENF"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Où tu es</p>
          <ul className="mt-3 space-y-3 text-sm text-zinc-300">
            <li>
              <span className="font-bold text-white">Cette page</span> — clips pour une découverte rapide.
            </li>
            <li>
              <Link href="/membres" className="font-bold text-violet-200 underline-offset-2 hover:underline">
                Annuaire
              </Link>{" "}
              — profils détaillés des membres.
            </li>
            <li>
              <Link href="/lives" className="font-bold text-violet-200 underline-offset-2 hover:underline">
                Lives
              </Link>{" "}
              — chaînes en direct maintenant.
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
