"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { RefreshCw } from "lucide-react";
import type { DiscoverClip, DiscoverClipsApiResponse } from "@/components/decouvrir/types";
import DiscoverEmptyState from "@/components/decouvrir/DiscoverEmptyState";
import DiscoverErrorState from "@/components/decouvrir/DiscoverErrorState";
import DiscoverFilters from "@/components/decouvrir/DiscoverFilters";
import DiscoverFinalCta from "@/components/decouvrir/DiscoverFinalCta";
import DiscoverGrid from "@/components/decouvrir/DiscoverGrid";
import DiscoverHero from "@/components/decouvrir/DiscoverHero";
import DiscoverIntro from "@/components/decouvrir/DiscoverIntro";
import DiscoverLiveTeaser from "@/components/decouvrir/DiscoverLiveTeaser";
import DiscoverMemberHint from "@/components/decouvrir/DiscoverMemberHint";
import DiscoverMoreSection from "@/components/decouvrir/DiscoverMoreSection";
import DiscoverSpiritSection from "@/components/decouvrir/DiscoverSpiritSection";
import { DISCOVER_COPY } from "@/lib/decouvrir/copy";
import { countActiveFilters, filterClips } from "@/lib/decouvrir/filters";

const PAGE_LIMIT = 12;

export default function DiscoverCreatorsClient() {
  const clipsSectionRef = useRef<HTMLElement>(null);
  const { data: session, status } = useSession();

  const [clips, setClips] = useState<DiscoverClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string>("");

  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");

  const fetchClips = useCallback(async (seed: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/public/discover-clips?limit=${PAGE_LIMIT}&seed=${encodeURIComponent(seed)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as DiscoverClipsApiResponse;
      const nextClips = Array.isArray(payload.clips) ? payload.clips : [];
      // `moderationStatus` est aujourd’hui toujours "approved" côté API ; on conserve le filtre pour rester aligné si le pipeline évolue.
      setClips(nextClips.filter((clip) => clip.moderationStatus === "approved"));

      if (payload.error) {
        setError(payload.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau");
      setClips([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialSeed = `${Date.now()}`;
    setRefreshToken(initialSeed);
    void fetchClips(initialSeed);
  }, [fetchClips]);

  const filteredClips = useMemo(
    () => filterClips(clips, languageFilter, styleFilter, durationFilter),
    [clips, languageFilter, styleFilter, durationFilter]
  );

  const activeFiltersCount = useMemo(
    () => countActiveFilters(languageFilter, styleFilter, durationFilter),
    [durationFilter, languageFilter, styleFilter]
  );

  const availableLanguages = useMemo(() => {
    const set = new Set<string>();
    for (const clip of clips) {
      if (clip.language) set.add(clip.language);
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [clips]);

  async function handleRefresh() {
    const nextSeed = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setRefreshToken(nextSeed);
    await fetchClips(nextSeed);
  }

  function resetFilters() {
    setLanguageFilter("all");
    setStyleFilter("all");
    setDurationFilter("all");
  }

  function applyPreset(patch: Partial<{ style: string; duration: string }>) {
    if (patch.style !== undefined) setStyleFilter(patch.style);
    if (patch.duration !== undefined) setDurationFilter(patch.duration);
  }

  const scrollToClips = useCallback(() => {
    clipsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const clipCopy = DISCOVER_COPY.clips;
  const memberName =
    (session?.user?.name as string | undefined) ||
    (session?.user as { twitchLogin?: string } | undefined)?.twitchLogin ||
    null;

  return (
    <main className="min-h-screen w-full min-w-0 pb-16 pt-6 sm:pb-20 sm:pt-8" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto w-full max-w-[min(120rem,100%)] space-y-10 px-[clamp(1rem,3vw,2.5rem)] sm:space-y-12 lg:space-y-14">
        {status === "authenticated" ? <DiscoverMemberHint displayName={memberName} /> : null}

        <DiscoverHero onExploreSelection={scrollToClips} />
        <DiscoverIntro />
        <DiscoverLiveTeaser />

        <section
          ref={clipsSectionRef}
          id="decouvrir-clips"
          className="scroll-mt-6 space-y-6 sm:space-y-8"
          aria-labelledby="clips-section-heading"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <h2 id="clips-section-heading" className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                {clipCopy.sectionTitle}
              </h2>
              <p className="mt-2 text-pretty text-sm leading-relaxed text-zinc-400 sm:text-base">{clipCopy.sectionSubtitle}</p>
            </div>
            <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center lg:w-auto lg:justify-end">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-bold text-white shadow-[0_12px_36px_rgba(124,58,237,0.4)] transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99] sm:shrink-0"
                aria-busy={loading}
              >
                <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                {clipCopy.newSelection}
              </button>
              {!loading ? (
                <div className="flex flex-wrap gap-2 text-xs text-zinc-400 sm:justify-end">
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 font-semibold tabular-nums text-zinc-200">
                    {clipCopy.loadedLabel} : {clips.length}
                  </span>
                  <span className="rounded-full border border-violet-500/25 bg-violet-500/10 px-3 py-1.5 font-semibold tabular-nums text-violet-100">
                    {clipCopy.afterFiltersLabel} : {filteredClips.length}
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {error ? <DiscoverErrorState message={error} refreshToken={refreshToken} onRetry={handleRefresh} /> : null}

          <DiscoverFilters
            languageFilter={languageFilter}
            styleFilter={styleFilter}
            durationFilter={durationFilter}
            availableLanguages={availableLanguages}
            filteredCount={filteredClips.length}
            activeFiltersCount={activeFiltersCount}
            onLanguageChange={setLanguageFilter}
            onStyleChange={setStyleFilter}
            onDurationChange={setDurationFilter}
            onReset={resetFilters}
            onApplyPreset={applyPreset}
          />

          {loading ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">{clipCopy.gridHint}</p>
              <DiscoverGrid clips={[]} loading skeletonCount={6} />
            </div>
          ) : filteredClips.length === 0 ? (
            <DiscoverEmptyState onReset={resetFilters} onNewSelection={handleRefresh} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500">{clipCopy.gridHint}</p>
              <DiscoverGrid clips={filteredClips} />
            </div>
          )}
        </section>

        <DiscoverMoreSection />
        <DiscoverSpiritSection />
        <DiscoverFinalCta />
      </div>
    </main>
  );
}
