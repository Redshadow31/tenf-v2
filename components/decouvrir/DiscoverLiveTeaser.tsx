"use client";

import Link from "next/link";
import { Radio, Loader2 } from "lucide-react";
import { useLiveStreamsSnapshot } from "@/components/member/hooks/useLiveStreamsSnapshot";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

export default function DiscoverLiveTeaser() {
  const snapshot = useLiveStreamsSnapshot();
  const c = DISCOVER_COPY.liveTeaser;

  return (
    <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 via-black/40 to-violet-950/25 px-5 py-6 sm:px-7 sm:py-7" aria-labelledby="live-teaser-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-emerald-200/90">
            <Radio className="h-5 w-5 shrink-0" aria-hidden />
            <h2 id="live-teaser-heading" className="text-lg font-black tracking-tight text-white sm:text-xl">
              {c.title}
            </h2>
          </div>
          <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-zinc-300">
            {snapshot.state === "loading" ? (
              <span className="inline-flex items-center gap-2 text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {c.loading}
              </span>
            ) : snapshot.state === "unavailable" ? (
              c.unavailable
            ) : snapshot.liveCount === 0 ? (
              c.zero
            ) : (
              c.some(snapshot.liveCount)
            )}
          </p>
        </div>
        <Link
          href="/lives"
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.08] px-5 py-3 text-sm font-bold text-white transition hover:border-emerald-400/40 hover:bg-emerald-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          {c.cta}
        </Link>
      </div>
    </section>
  );
}
