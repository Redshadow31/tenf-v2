"use client";

import DiscoverClipCard from "@/components/decouvrir/DiscoverClipCard";
import type { DiscoverClip } from "@/components/decouvrir/types";

export function ClipCardSkeleton() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse">
      <div className="aspect-video bg-zinc-800/80" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-800/80" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-0.5">
            <div className="h-4 w-[60%] max-w-[12rem] rounded-lg bg-zinc-800/80" />
            <div className="h-3 w-[40%] max-w-[8rem] rounded-lg bg-zinc-800/80" />
          </div>
        </div>
        <div className="h-10 w-full rounded-lg bg-zinc-800/80" />
        <div className="h-9 w-full rounded-xl bg-zinc-800/80" />
      </div>
    </div>
  );
}

type DiscoverGridProps = {
  clips: DiscoverClip[];
  skeletonCount?: number;
  loading?: boolean;
};

export default function DiscoverGrid({ clips, skeletonCount = 8, loading }: DiscoverGridProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Chargement des clips"
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ClipCardSkeleton key={`sk-${i}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {clips.map((clip) => (
        <DiscoverClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
