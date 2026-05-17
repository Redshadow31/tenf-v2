"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

type DiscoverEmptyStateProps = {
  onReset: () => void;
  onNewSelection: () => void;
};

export default function DiscoverEmptyState({ onReset, onNewSelection }: DiscoverEmptyStateProps) {
  const c = DISCOVER_COPY.empty;

  return (
    <div className="rounded-3xl border border-dashed border-violet-400/25 bg-violet-950/10 px-5 py-12 text-center sm:px-8 sm:py-14" role="status">
      <Search className="mx-auto h-12 w-12 text-violet-400/70" aria-hidden />
      <h2 className="mt-4 text-xl font-bold text-white sm:text-2xl">{c.title}</h2>
      <p className="mx-auto mt-3 max-w-lg text-pretty text-sm leading-relaxed text-zinc-400">{c.body}</p>
      <div className="mt-8 flex flex-col flex-wrap items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/18 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
        >
          {c.reset}
        </button>
        <button
          type="button"
          onClick={onNewSelection}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200"
        >
          {c.newSelection}
        </button>
        <Link
          href="/membres"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-violet-400/30 px-5 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-300/50 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200"
        >
          {c.annuaire}
        </Link>
      </div>
    </div>
  );
}
