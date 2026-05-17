"use client";

import Link from "next/link";
import { ArrowRight, ExternalLink, Heart } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

export default function DiscoverFinalCta() {
  const c = DISCOVER_COPY.finalCta;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-950/50 via-black/60 to-fuchsia-950/40 px-5 py-10 text-center sm:px-10 sm:py-12" aria-labelledby="discover-final-heading">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(139,92,246,0.2),_transparent_55%)]" />
      <div className="relative mx-auto max-w-2xl">
        <Heart className="mx-auto h-10 w-10 text-violet-300/90" aria-hidden />
        <h2 id="discover-final-heading" className="mt-4 text-2xl font-black tracking-tight text-white sm:text-3xl">
          {c.title}
        </h2>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-zinc-300 sm:text-base">{c.subtitle}</p>
        <div className="mt-8 flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/membres"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.08] px-6 py-3 text-sm font-bold text-white transition hover:border-violet-300/50 hover:bg-violet-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200"
          >
            {c.annuaire}
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
          <Link
            href="/lives"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-100"
          >
            {c.lives}
            <ExternalLink className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-200"
          >
            {c.discover}
          </Link>
        </div>
      </div>
    </section>
  );
}
