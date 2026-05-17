import type { DiscoverClip } from "@/components/decouvrir/types";

export const STYLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tous les styles" },
  { value: "fun", label: "Fun" },
  { value: "epic", label: "Epic" },
  { value: "educatif", label: "Éducatif" },
  { value: "best-of", label: "Best-of" },
];

export const DURATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Toutes durées" },
  { value: "short", label: "Court · 0–45 s" },
  { value: "medium", label: "Moyen · 46–90 s" },
  { value: "long", label: "Long · 90 s +" },
];

/** Suggestions rapides (max 3) : un clic remplit style et/ou durée. */
export const QUICK_PRESETS: Array<{
  id: string;
  label: string;
  hint: string;
  patch: Partial<{ style: string; duration: string }>;
}> = [
  { id: "fun", label: "Moments fun", hint: "Style fun", patch: { style: "fun" } },
  { id: "learn", label: "À apprendre", hint: "Style éducatif", patch: { style: "educatif" } },
  { id: "short", label: "Courts formats", hint: "0–45 s", patch: { duration: "short" } },
];

export function filterChipClass(active: boolean): string {
  return active
    ? "border-violet-400/60 bg-violet-500/25 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-1 ring-violet-400/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
    : "border-white/12 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/50";
}

export function filterClips(
  clips: DiscoverClip[],
  languageFilter: string,
  styleFilter: string,
  durationFilter: string
): DiscoverClip[] {
  return clips.filter((clip) => {
    if (languageFilter !== "all" && clip.language !== languageFilter) return false;
    if (styleFilter !== "all" && clip.style !== styleFilter) return false;

    if (durationFilter === "short" && clip.duration > 45) return false;
    if (durationFilter === "medium" && (clip.duration <= 45 || clip.duration > 90)) return false;
    if (durationFilter === "long" && clip.duration <= 90) return false;

    return true;
  });
}

export function countActiveFilters(languageFilter: string, styleFilter: string, durationFilter: string): number {
  let count = 0;
  if (languageFilter !== "all") count += 1;
  if (styleFilter !== "all") count += 1;
  if (durationFilter !== "all") count += 1;
  return count;
}
