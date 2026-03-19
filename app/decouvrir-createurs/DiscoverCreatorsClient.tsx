"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
      "Chaque style de créateur a sa place: on valorise les univers différents et on évite la comparaison toxique.",
  },
  {
    title: "Découverte collective",
    description:
      "On explore les chaînes des autres pour créer des ponts, des rencontres et des opportunités de progression.",
  },
  {
    title: "Fous rires & bons moments",
    description:
      "Les clips Twitch sont là pour partager l'énergie TENF: les moments drôles, spontanés et mémorables.",
  },
];

const DISCOVER_INTENT_ITEMS = [
  "Découvrir les chaînes des autres avec curiosité et bienveillance.",
  "Valoriser les univers différents: style, rythme, format et personnalité.",
  "Encourager les créateurs moins visibles pour élargir la découverte TENF.",
  "Créer des ponts entre membres via les clips et les moments marquants.",
];

const CLIP_MOMENTS_ITEMS = [
  "Partager les fous rires et les moments spontanés sans jugement.",
  "Célébrer les clips qui donnent envie de revenir et d'échanger.",
  "Mettre en avant l'humain: authenticité, bonne humeur et entraide.",
  "Transformer chaque clip en souvenir collectif positif pour la communauté.",
];

function formatViews(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "n/a";
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
  if (style === "educatif") return "Educatif";
  if (style === "epic") return "Epic";
  return "Fun";
}

function durationLabel(value: string): string {
  if (value === "short") return "0-45s";
  if (value === "medium") return "46-90s";
  if (value === "long") return "90s+";
  return "Toutes";
}

export default function DiscoverCreatorsClient() {
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

  return (
    <main className="min-h-screen py-10 sm:py-12" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
          style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, var(--color-primary) 30%, transparent)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "color-mix(in srgb, #22c55e 22%, transparent)" }}
          />

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
                Découverte TENF
              </p>
              <h1 className="text-3xl font-bold sm:text-4xl">Découvrir les créateurs</h1>
              <p className="max-w-3xl text-sm sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                Une sélection vivante de clips TENF: découvrir les autres, célébrer les bons moments, et progresser ensemble.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Rafraîchir
              </button>
              <Link
                href="/membres"
                className="rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Voir l&apos;annuaire
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {TENF_VALUES.map((value) => (
              <article
                key={value.title}
                className="rounded-2xl border p-4"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 70%, var(--color-surface) 30%)",
                }}
              >
                <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
                  {value.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {value.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Langue
              </span>
              <select
                value={languageFilter}
                onChange={(event) => setLanguageFilter(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <option value="all">Toutes</option>
                {availableLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Style
              </span>
              <select
                value={styleFilter}
                onChange={(event) => setStyleFilter(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <option value="all">Tous</option>
                <option value="fun">Fun</option>
                <option value="epic">Epic</option>
                <option value="educatif">Educatif</option>
                <option value="best-of">Best-of</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="mb-1 block" style={{ color: "var(--color-text-secondary)" }}>
                Durée
              </span>
              <select
                value={durationFilter}
                onChange={(event) => setDurationFilter(event.target.value)}
                className="w-full rounded-xl border px-3 py-2 outline-none"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <option value="all">Toutes</option>
                <option value="short">Courte (0-45s)</option>
                <option value="medium">Moyenne (46-90s)</option>
                <option value="long">Longue (90s+)</option>
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              {filteredClips.length} clip(s) affiché(s)
            </span>
            <span
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
            >
              Filtres actifs: {activeFiltersCount}
            </span>
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-full border px-2.5 py-1 transition-colors hover:bg-white/5"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
              >
                Réinitialiser ({durationLabel(durationFilter)})
              </button>
            ) : null}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article
            className="rounded-2xl border p-5"
            style={{
              borderColor: "color-mix(in srgb, var(--color-primary) 45%, var(--color-border))",
              background:
                "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 14%, var(--color-card)) 0%, var(--color-card) 100%)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Intention de découverte TENF
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Une ligne de conduite simple: inclusion, ouverture et découverte active des autres créateurs.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {DISCOVER_INTENT_ITEMS.map((item) => (
                <p
                  key={item}
                  className="rounded-xl border px-3 py-2 text-xs"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-primary) 35%, var(--color-border))",
                    color: "var(--color-text)",
                    backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, transparent)",
                  }}
                >
                  {item}
                </p>
              ))}
            </div>
          </article>

          <article
            className="rounded-2xl border p-5"
            style={{
              borderColor: "rgba(16,185,129,0.45)",
              background:
                "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, color-mix(in srgb, var(--color-card) 95%, transparent) 100%)",
            }}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
              Fous rires & bons moments clips Twitch
            </h2>
            <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Les clips TENF servent aussi à transmettre l'énergie positive et les moments mémorables de la commu.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {CLIP_MOMENTS_ITEMS.map((item) => (
                <p
                  key={item}
                  className="rounded-xl border px-3 py-2 text-xs"
                  style={{
                    borderColor: "rgba(16,185,129,0.45)",
                    color: "var(--color-text)",
                    backgroundColor: "rgba(16,185,129,0.08)",
                  }}
                >
                  {item}
                </p>
              ))}
            </div>
          </article>
        </section>

        {loading ? (
          <section
            className="rounded-2xl border p-6 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            Chargement des clips...
          </section>
        ) : filteredClips.length === 0 ? (
          <section
            className="rounded-2xl border p-6 text-sm"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            Aucun clip disponible pour ce tirage. Reviens plus tard ou clique sur rafraîchir.
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClips.map((clip) => (
              <article
                key={clip.id}
                className="overflow-hidden rounded-2xl border transition-transform duration-200 hover:-translate-y-1"
                style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
              >
                <a href={clip.url} target="_blank" rel="noopener noreferrer" className="block">
                  <div className="relative aspect-video overflow-hidden bg-black/20">
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <div className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {styleLabel(clip.style)}
                    </div>
                    <div className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {formatDuration(clip.duration)}
                    </div>
                  </div>
                </a>

                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={clip.creatorAvatar || `https://unavatar.io/twitch/${clip.creatorLogin}`}
                      alt={clip.creatorName}
                      className="h-10 w-10 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{clip.creatorName}</p>
                      <p className="truncate text-xs" style={{ color: "var(--color-text-secondary)" }}>
                        @{clip.creatorLogin}
                        {clip.memberRole ? ` · ${clip.memberRole}` : ""}
                      </p>
                    </div>
                  </div>

                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-sm font-medium hover:underline"
                  >
                    {clip.title}
                  </a>

                  <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    <span>{formatViews(clip.viewCount)} vues</span>
                    <span>•</span>
                    <span>{formatDuration(clip.duration)}</span>
                    <span>•</span>
                    <span>{clip.language.toUpperCase()}</span>
                    <span>•</span>
                    <span>{formatDate(clip.createdAt)}</span>
                  </div>

                  <a
                    href={clip.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Voir le clip sur Twitch
                  </a>
                </div>
              </article>
            ))}
          </section>
        )}

        {error ? (
          <section
            className="rounded-2xl border p-4 text-xs"
            style={{ borderColor: "rgba(248,113,113,0.4)", backgroundColor: "rgba(127,29,29,0.22)", color: "#fecaca" }}
          >
            Erreur API: {error} (seed: {refreshToken})
          </section>
        ) : null}
      </div>
    </main>
  );
}
