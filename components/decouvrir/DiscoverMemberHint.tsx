"use client";

import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";

type DiscoverMemberHintProps = {
  displayName?: string | null;
};

export default function DiscoverMemberHint({ displayName }: DiscoverMemberHintProps) {
  const c = DISCOVER_COPY.memberHint;

  return (
    <aside
      className="flex flex-col gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label="Raccourci espace membre"
    >
      <p className="min-w-0 text-sm leading-relaxed text-zinc-100">
        {displayName ? (
          <>
            Salut <span className="font-bold text-white">{displayName}</span> — {c.text}
          </>
        ) : (
          c.text
        )}
      </p>
      <Link
        href="/member/dashboard"
        className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-black/30 px-4 py-2 text-sm font-bold text-white transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 sm:self-auto"
      >
        <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
        {c.cta}
      </Link>
    </aside>
  );
}
