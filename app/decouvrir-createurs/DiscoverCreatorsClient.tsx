"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Clapperboard,
  Compass,
  ExternalLink,
  Film,
  Filter,
  Play,
  RefreshCw,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type DiscoverClip = {
  id: string;
  url: string;
  title: string;
  thumbnailUrl: string;
  creatorName: string;
  creatorLogin: string;
  creatorAvatar?: string;
  viewCount: number;
  createdAt: string;
  duration: number;
  language: string;
  style: "fun" | "epic" | "educatif" | "best-of";
  category: "gaming" | "just-chatting" | "irl" | "autre";
  moderationStatus: "approved" | "pending" | "rejected";
  memberRole?: string;
};

type ApiResponse = {
  clips?: DiscoverClip[];
  total?: number;
  error?: string;
};

const PAGE_LIMIT = 12;

const TENF_VALUES = [
  {
    title: "Inclusion active",
    description:
      "Chaque style de créateur a sa place : on valorise les univers différents et on évite la comparaison toxique.",
    icon: Users,
    accent: "from-violet-500/20 to-fuchsia-500/10",
  },
  {
    title: "Découverte collective",
    description:
      "On explore les chaînes des autres pour créer des ponts, des rencontres et des opportunités de progression.",
    icon: Compass,
    accent: "from-sky-500/15 to-violet-500/10",
  },
  {
    title: "Fous rires & bons moments",
    description:
      "Les clips Twitch partagent l’énergie TENF : moments drôles, spontanés et mémorables.",
    icon: Sparkles,
    accent: "from-amber-500/15 to-rose-500/10",
  },
] as const;

const DISCOVER_INTENT_ITEMS = [
  "Découvrir les chaînes des autres avec curiosité et bienveillance.",
  "Valoriser les univers différents : style, rythme, format et personnalité.",
  "Encourager les créateurs moins visibles pour élargir la découverte TENF.",
  "Créer des ponts entre membres via les clips et les moments marquants.",
];

const CLIP_MOMENTS_ITEMS = [
  "Partager les fous rires et les moments spontanés sans jugement.",
  "Célébrer les clips qui donnent envie de revenir et d’échanger.",
  "Mettre en avant l’humain : authenticité, bonne humeur et entraide.",
  "Transformer chaque clip en souvenir collectif positif pour la communauté.",
];

const STYLE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tous les styles" },
  { value: "fun", label: "Fun" },
  { value: "epic", label: "Epic" },
  { value: "educatif", label: "Éducatif" },
  { value: "best-of", label: "Best-of" },
];

const DURATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Toutes durées" },
  { value: "short", label: "Court · 0–45 s" },
  { value: "medium", label: "Moyen · 46–90 s" },
  { value: "long", label: "Long · 90 s +" },
];

const QUICK_PRESETS: Array<{
  id: string;
  label: string;
  hint: string;
  patch: Partial<{ style: string; duration: string }>;
}> = [
  { id: "laugh", label: "Rire garanti", hint: "Fun", patch: { style: "fun" } },
  { id: "epic", label: "Gros moment", hint: "Epic", patch: { style: "epic" } },
  { id: "learn", label: "Apprendre", hint: "Tuto & co", patch: { style: "educatif" } },
  { id: "best", label: "Best-of", hint: "Compil", patch: { style: "best-of" } },
  { id: "snack", label: "Snack", hint: "Très court", patch: { duration: "short" } },
];

function formatViews(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function styleLabel(style: DiscoverClip["style"]): string {
  if (style === "best-of") return "Best-of";
  if (style === "educatif") return "Éducatif";
  if (style === "epic") return "Epic";
  return "Fun";
}

function styleChipClass(style: DiscoverClip["style"]): string {
  if (style === "best-of") return "bg-amber-500/90 text-black";
  if (style === "educatif") return "bg-sky-600/95 text-white";
  if (style === "epic") return "bg-violet-600/95 text-white";
  return "bg-emerald-600/95 text-white";
}

function categoryLabel(category: DiscoverClip["category"]): string {
  if (category === "gaming") return "Gaming";
  if (category === "just-chatting") return "Discussion";
  if (category === "irl") return "IRL";
  return "Autre";
}

function filterChipClass(active: boolean): string {
  return active
    ? "border-violet-400/60 bg-violet-500/25 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)] ring-1 ring-violet-400/35"
    : "border-white/12 bg-white/[0.04] text-zinc-300 hover:border-white/20 hover:bg-white/[0.07]";
}

function ClipCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse">
      <div className="aspect-video bg-zinc-800/80" />
      <div className="space-y-3 p-4">
        <div className="flex gap-3">
          <div className="h-11 w-11 shrink-0 rounded-full bg-zinc-800/80" />
          <div className="flex flex-1 flex-col gap-2 pt-0.5">
            <div className="h-4 w-3/5 rounded-lg bg-zinc-800/80" />
            <div className="h-3 w-2/5 rounded-lg bg-zinc-800/80" />
          </div>
        </div>
        <div className="h-10 w-full rounded-lg bg-zinc-800/80" />
        <div className="h-9 w-full rounded-xl bg-zinc-800/80" />
      </div>
    </div>
  );
}

function DiscoverClipCard({ clip }: { clip: DiscoverClip }) {
  const twitchChannel = `https://www.twitch.tv/${clip.creatorLogin}`;
  const membresHref = `/membres?member=${encodeURIComponent(clip.creatorLogin)}`;

  return (
    <article
      className="group/card flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_16px_48px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-violet-400/35 hover:shadow-[0_24px_64px_rgba(88,28,135,0.22)]"
      style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)" }}
    >
      <a href={clip.url} target="_blank" rel="noopener noreferrer" className="relative block aspect-video overflow-hidden bg-black">
        <img
          src={clip.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover transition duration-500 group-hover/card:scale-[1.06]"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-90" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300 group-hover/card:opacity-100">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/25 text-white shadow-xl backdrop-blur-md ring-2 ring-white/40">
            <Play className="ml-0.5 h-7 w-7 fill-current" aria-hidden />
          </span>
        </div>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${styleChipClass(clip.style)}`}>
            {styleLabel(clip.style)}
          </span>
          <span className="rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
            {categoryLabel(clip.category)}
          </span>
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
          {formatDuration(clip.duration)}
        </div>
        <p className="absolute bottom-2 left-2 right-2 line-clamp-2 text-xs font-semibold leading-snug text-white drop-shadow-md sm:text-sm">
          {clip.title}
        </p>
      </a>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <a
            href={twitchChannel}
            target="_blank"
            rel="noopener noreferrer"
            className="relative shrink-0 rounded-full ring-2 ring-violet-500/25 transition hover:ring-violet-400/50"
          >
            <img
              src={clip.creatorAvatar || `https://unavatar.io/twitch/${clip.creatorLogin}`}
              alt=""
              className="h-11 w-11 rounded-full object-cover"
              loading="lazy"
            />
          </a>
          <div className="min-w-0 flex-1">
            <a
              href={twitchChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate font-bold text-white transition hover:text-violet-200"
            >
              {clip.creatorName}
            </a>
            <p className="truncate text-xs text-zinc-400">
              @{clip.creatorLogin}
              {clip.memberRole ? (
                <span className="text-zinc-500"> · {clip.memberRole}</span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span className="font-medium text-zinc-400">{formatViews(clip.viewCount)} vues</span>
          <span aria-hidden>·</span>
          <span>{clip.language.toUpperCase()}</span>
          <span aria-hidden>·</span>
          <span>{formatDate(clip.createdAt)}</span>
        </div>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <a
            href={clip.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white shadow-[0_8px_28px_rgba(124,58,237,0.4)] transition hover:brightness-110 active:scale-[0.99]"
          >
            <Play className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
            Voir le clip
            <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
          </a>
          <Link
            href={membresHref}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-zinc-100 transition hover:border-violet-400/40 hover:bg-violet-500/10"
          >
            Fiche TENF
            <ArrowRight className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function DiscoverCreatorsClient() {
  const [clips, setClips] = useState<DiscoverClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string>("");

  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [styleFilter, setStyleFilter] = useState<string>("all");
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [cadreTab, setCadreTab] = useState<"decouverte" | "esprit">("decouverte");

  const fetchClips = useCallback(async (seed: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/public/discover-clips?limit=${PAGE_LIMIT}&seed=${encodeURIComponent(seed)}`,
        { cache: "no-store" }
      );
      const payload = (await response.json()) as ApiResponse;
      const nextClips = Array.isArray(payload.clips) ? payload.clips : [];
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

  const filteredClips = useMemo(() => {
    return clips.filter((clip) => {
      if (languageFilter !== "all" && clip.language !== languageFilter) return false;
      if (styleFilter !== "all" && clip.style !== styleFilter) return false;

      if (durationFilter === "short" && clip.duration > 45) return false;
      if (durationFilter === "medium" && (clip.duration <= 45 || clip.duration > 90)) return false;
      if (durationFilter === "long" && clip.duration <= 90) return false;

      return true;
    });
  }, [clips, languageFilter, styleFilter, durationFilter]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (languageFilter !== "all") count += 1;
    if (styleFilter !== "all") count += 1;
    if (durationFilter !== "all") count += 1;
    return count;
  }, [durationFilter, languageFilter, styleFilter]);

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

  return (
    <main className="min-h-screen pb-14 pt-8 sm:pb-16 sm:pt-10" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-violet-500/25 p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-95"
            style={{
              background:
                "linear-gradient(125deg, rgba(12,10,18,0.98) 0%, rgba(48,22,72,0.92) 45%, rgba(18,14,28,0.97) 100%)",
            }}
          />
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-violet-600/35 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-[-10%] h-80 w-80 rounded-full bg-fuchsia-600/25 blur-3xl" />
          <div className="pointer-events-none absolute right-1/4 top-12 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
                  <Clapperboard className="h-3.5 w-3.5" aria-hidden />
                  Clips TENF
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Public & New Family</span>
              </div>
              <h1 className="mt-4 text-3xl font-black leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-[2.65rem]">
                Tombe sur des moments{" "}
                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-200 bg-clip-text text-transparent">
                  qui donnent envie de suivre
                </span>
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-300 sm:text-base">
                Une sélection qui change à chaque rafraîchissement : extraits drôles, clutchs, tutos… Parfait pour découvrir une chaîne TENF avant d’ouvrir l’annuaire ou un live. Les membres peuvent s’en servir pour{" "}
                <strong className="font-semibold text-white">repérer des voisin·es de réseau</strong> et passer faire un coucou sur Twitch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-bold text-white shadow-[0_14px_40px_rgba(124,58,237,0.45)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.99]"
                >
                  <RefreshCw className={`h-4 w-4 shrink-0 ${loading ? "animate-spin" : ""}`} aria-hidden />
                  Nouveau tirage
                </button>
                <Link
                  href="/membres"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white transition hover:border-violet-400/35 hover:bg-violet-500/10"
                >
                  <Users className="h-4 w-4 text-violet-300" aria-hidden />
                  Annuaire membres
                </Link>
                <Link
                  href="/lives"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
                >
                  Lives TENF
                  <ExternalLink className="h-4 w-4 opacity-70" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Dans ce tirage</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-white">{loading ? "…" : clips.length}</p>
                <p className="mt-1 text-xs text-zinc-400">Clips chargés (puis filtrés ci-dessous).</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Après filtres</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-violet-200">{loading ? "…" : filteredClips.length}</p>
                <p className="mt-1 text-xs text-zinc-400">Affine langue, style ou durée.</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 backdrop-blur-sm">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90">Astuce</p>
                <p className="mt-2 text-sm font-medium leading-snug text-zinc-200">
                  Chaque carte ouvre le clip Twitch + un raccourci vers la <span className="text-white">fiche TENF</span> du créateur.
                </p>
              </div>
            </div>
          </div>

          {/* Valeurs — cartes interactives */}
          <div className="relative mt-10 grid gap-3 sm:grid-cols-3">
            {TENF_VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  role="presentation"
                  className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${value.accent} p-4 transition duration-300 hover:-translate-y-0.5 hover:border-violet-400/30 hover:shadow-lg`}
                  style={{ backgroundColor: "color-mix(in srgb, var(--color-card) 75%, transparent)" }}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/30 text-violet-200 ring-1 ring-white/10 transition group-hover:scale-105 group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-bold text-white">{value.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-400">{value.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Filtres & presets */}
        <section className="rounded-3xl border border-white/10 bg-black/20 p-4 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-white">
              <Filter className="h-5 w-5 text-violet-400" aria-hidden />
              <h2 className="text-lg font-bold sm:text-xl">Affine ta session découverte</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-medium tabular-nums text-zinc-300">
                {filteredClips.length} résultat{filteredClips.length !== 1 ? "s" : ""}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {activeFiltersCount} filtre{activeFiltersCount !== 1 ? "s" : ""}
              </span>
              {activeFiltersCount > 0 ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1 font-semibold text-zinc-200 transition hover:bg-white/10"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Tout réinitialiser
                </button>
              ) : null}
            </div>
          </div>

          <p className="mt-3 text-sm text-zinc-500">Raccourcis — un clic remplit les filtres (tu peux combiner avec la langue).</p>
          <div className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.patch)}
                className="shrink-0 snap-start rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-2.5 text-left transition hover:border-violet-400/45 hover:bg-violet-500/18"
              >
                <span className="block text-sm font-bold text-white">{preset.label}</span>
                <span className="text-[11px] text-violet-200/80">{preset.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Langue</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setLanguageFilter("all")} className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterChipClass(languageFilter === "all")}`}>
                  Toutes
                </button>
                {availableLanguages.map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguageFilter(lang)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterChipClass(languageFilter === lang)}`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Style</p>
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStyleFilter(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterChipClass(styleFilter === opt.value)}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Durée</p>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDurationFilter(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${filterChipClass(durationFilter === opt.value)}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cadre TENF — onglets */}
        <section className="overflow-hidden rounded-3xl border border-white/10" style={{ backgroundColor: "var(--color-card)" }}>
          <div className="flex border-b border-white/10 bg-black/20">
            <button
              type="button"
              onClick={() => setCadreTab("decouverte")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition sm:text-base ${
                cadreTab === "decouverte"
                  ? "bg-violet-500/15 text-white ring-inset ring-1 ring-violet-400/30"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <Compass className="h-4 w-4 shrink-0" aria-hidden />
              Intention découverte
            </button>
            <button
              type="button"
              onClick={() => setCadreTab("esprit")}
              className={`flex flex-1 items-center justify-center gap-2 px-4 py-4 text-sm font-bold transition sm:text-base ${
                cadreTab === "esprit"
                  ? "bg-emerald-500/10 text-white ring-inset ring-1 ring-emerald-400/25"
                  : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
              }`}
            >
              <Film className="h-4 w-4 shrink-0" aria-hidden />
              Esprit des clips
            </button>
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-sm leading-relaxed text-zinc-400">
              {cadreTab === "decouverte"
                ? "Une ligne de conduite simple pour explorer les chaînes TENF sans pression : curiosité, inclusion et bienveillance."
                : "Les clips ne sont pas qu’un divertissement : ils transportent l’énergie positive de la communauté."}
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {(cadreTab === "decouverte" ? DISCOVER_INTENT_ITEMS : CLIP_MOMENTS_ITEMS).map((item) => (
                <li
                  key={item}
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-snug text-zinc-200 transition hover:border-violet-400/25"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/membres"
              className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-violet-300 transition hover:text-violet-200"
            >
              Passer à l’annuaire pour lire les bios complètes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </section>

        {/* Grille clips */}
        {loading ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ClipCardSkeleton key={`sk-${i}`} />
            ))}
          </section>
        ) : filteredClips.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 text-center">
            <Calendar className="mx-auto h-12 w-12 text-zinc-600" aria-hidden />
            <h2 className="mt-4 text-xl font-bold text-white">Aucun clip dans cette combinaison</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
              Élargis les filtres ou lance un nouveau tirage : le catalogue tourne et chaque rafraîchissement pioche d’autres créateurs TENF.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Réinitialiser les filtres
              </button>
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
              >
                Nouveau tirage
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">Sélection à regarder</h2>
              <p className="text-sm text-zinc-500">Survol pour lire le titre · Clic sur la vignette = lecture sur Twitch</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClips.map((clip) => (
                <DiscoverClipCard key={clip.id} clip={clip} />
              ))}
            </div>
          </section>
        )}

        {error ? (
          <section className="rounded-2xl border border-red-500/35 bg-red-950/40 px-4 py-3 text-sm text-red-100">
            <span className="font-semibold">Erreur :</span> {error}
            <span className="mt-1 block text-xs text-red-200/70">Réf. tirage : {refreshToken}</span>
          </section>
        ) : null}
      </div>
    </main>
  );
}
