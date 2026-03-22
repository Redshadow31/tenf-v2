"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Send, Sparkles, X } from "lucide-react";

const MAX_MESSAGE = 500;
const MIN_MESSAGE = 10;

interface Review {
  id: string;
  type: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
}

type SortMode = "recent" | "top";

const MESSAGE_PROMPTS = [
  "Ce que TENF m'a apporte",
  "Ce que j'ai le plus aime",
  "Un conseil pour les nouveaux",
  "Mon avant / apres TENF",
];

function pickRandomFeatured(reviews: Review[], size = 3, previousIds: string[] = []): Review[] {
  if (reviews.length <= size) return [...reviews];
  const pool = [...reviews];
  const previousSet = new Set(previousIds);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let next = pool.slice(0, size);
  if (previousSet.size > 0 && next.every((item) => previousSet.has(item.id))) {
    // Eviter de retomber sur exactement les mêmes cartes
    next = pool.slice(1, size + 1);
  }
  return next;
}

export default function AvisTenfPage() {
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number>(5);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOpenedAt, setModalOpenedAt] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [minimumHearts, setMinimumHearts] = useState<number>(1);
  const [featuredRotating, setFeaturedRotating] = useState<Review[]>([]);
  const [featuredVisible, setFeaturedVisible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      setLoading(true);
      const res = await fetch("/api/reviews?type=tenf", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const now = Date.now();
      if (modalOpenedAt && now - modalOpenedAt < 1200) {
        setError("Merci de prendre un instant pour rédiger ton avis.");
        return;
      }

      const finalMessage = selectedPrompt
        ? `${selectedPrompt}:\n${message.trim()}`
        : message.trim();

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "tenf",
          pseudo: pseudo.trim(),
          message: finalMessage,
          hearts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }
      setSuccess(true);
      setPseudo("");
      setMessage("");
      setHearts(5);
      setSelectedPrompt("");
      loadReviews();
      window.setTimeout(() => {
        setIsModalOpen(false);
      }, 900);
    } catch (e) {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const remaining = MAX_MESSAGE - message.length;
  const canSubmit =
    pseudo.trim().length >= 2 &&
    message.trim().length >= MIN_MESSAGE &&
    message.length <= MAX_MESSAGE;

  const stats = useMemo(() => {
    const total = reviews.length;
    const rated = reviews.filter((r) => typeof r.hearts === "number");
    const average =
      rated.length > 0
        ? Math.round((rated.reduce((sum, r) => sum + Number(r.hearts || 0), 0) / rated.length) * 10) / 10
        : 0;
    const fiveStarsCount = rated.filter((r) => Number(r.hearts) === 5).length;
    const fiveStarsPercent = rated.length > 0 ? Math.round((fiveStarsCount / rated.length) * 100) : 0;
    return { total, average, fiveStarsPercent };
  }, [reviews]);

  const featuredPool = useMemo(() => {
    return [...reviews]
      .sort((a, b) => {
        const ah = Number(a.hearts || 0);
        const bh = Number(b.hearts || 0);
        if (bh !== ah) return bh - ah;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 12);
  }, [reviews]);

  useEffect(() => {
    setFeaturedRotating(pickRandomFeatured(featuredPool, 3));
    setFeaturedVisible(true);
  }, [featuredPool]);

  useEffect(() => {
    if (featuredPool.length <= 3) return;
    const interval = window.setInterval(() => {
      setFeaturedVisible(false);
      window.setTimeout(() => {
        setFeaturedRotating((previous) =>
          pickRandomFeatured(
            featuredPool,
            3,
            previous.map((item) => item.id)
          )
        );
        setFeaturedVisible(true);
      }, 260);
    }, 5200);

    return () => {
      window.clearInterval(interval);
    };
  }, [featuredPool]);

  const displayedReviews = useMemo(() => {
    const filtered = reviews.filter((r) => Number(r.hearts || 0) >= minimumHearts);
    if (sortMode === "top") {
      return [...filtered].sort((a, b) => {
        const ah = Number(a.hearts || 0);
        const bh = Number(b.hearts || 0);
        if (bh !== ah) return bh - ah;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return [...filtered].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [reviews, sortMode, minimumHearts]);

  function openModal() {
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
    setModalOpenedAt(Date.now());
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0d1018] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-12 -left-20 h-72 w-72 rounded-full bg-[#7a3cff]/20 blur-[110px]" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#e12b5b]/16 blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-block text-sm mb-6 transition-colors"
          style={{ color: "rgba(234,234,241,0.72)" }}
        >
          ← Retour a l&apos;accueil
        </Link>

        <section
          className="rounded-3xl border p-6 md:p-8"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            background: "linear-gradient(145deg, rgba(26,27,38,0.95), rgba(16,17,26,0.95))",
            boxShadow: "0 18px 42px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.16em] text-[#d8b4ff]">Avis communaute</p>
              <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Ils ont rejoint TENF</h1>
              <p className="mt-3 text-sm text-gray-300 md:text-base">
                Des retours concrets sur l&apos;integration, l&apos;entraide, le staff et la progression dans la communaute.
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-[1px]"
            >
              <Send className="h-4 w-4" />
              Poster un avis
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Avis publies" value={String(stats.total)} />
            <StatCard label="Note moyenne" value={stats.average ? `${stats.average}/5` : "N/A"} />
            <StatCard label="Avis 5 coeurs" value={`${stats.fiveStarsPercent}%`} />
          </div>
        </section>

        {featuredRotating.length > 0 ? (
          <section className="mt-8 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))] p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#d8b4ff]" />
                <h2 className="text-xl font-semibold text-white">Avis a la une</h2>
              </div>
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-[0.09em] text-gray-300">
                Rotation aleatoire
              </span>
            </div>
            <div
              className={`grid grid-cols-2 gap-3 transition-opacity duration-500 lg:grid-cols-3 ${
                featuredVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {featuredRotating.map((r) => (
                <article key={`featured-${r.id}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{r.pseudo}</p>
                    <HeartsBadge hearts={Number(r.hearts || 0)} size="sm" />
                  </div>
                  <p className="line-clamp-4 text-sm text-gray-300">{r.message}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8 rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs uppercase tracking-[0.09em] text-gray-300">Trier</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 text-sm text-white"
            >
              <option value="recent">Plus recents</option>
              <option value="top">Mieux notes</option>
            </select>

            <label className="ml-2 text-xs uppercase tracking-[0.09em] text-gray-300">Filtre</label>
            <select
              value={minimumHearts}
              onChange={(e) => setMinimumHearts(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-[#0f1220] px-3 py-2 text-sm text-white"
            >
              <option value={1}>1 coeur et +</option>
              <option value={2}>2 coeurs et +</option>
              <option value={3}>3 coeurs et +</option>
              <option value={4}>4 coeurs et +</option>
              <option value={5}>5 coeurs</option>
            </select>
          </div>
        </section>

        <h2 className="mt-8 mb-4 text-xl font-semibold text-white">
          Avis publies
        </h2>
        {loading ? (
          <div className="py-12 text-center text-gray-300">
            Chargement...
          </div>
        ) : displayedReviews.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))] p-8 text-center text-gray-300">
            Aucun avis dans ce filtre pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-white/10 bg-[linear-gradient(145deg,rgba(30,31,39,0.72),rgba(17,18,24,0.78))] p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-white">{r.pseudo}</span>
                  <HeartsBadge hearts={Number(r.hearts || 0)} size="md" />
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-300">
                  {r.message}
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(r.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl border border-white/12 bg-[#141824] p-5 shadow-[0_22px_50px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Poster un avis TENF</h3>
                <p className="mt-1 text-sm text-gray-300">
                  Donne un retour clair et utile pour aider les futurs membres.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full border border-white/20 bg-white/[0.05] p-2 text-gray-200"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="mb-1 block text-xs uppercase tracking-[0.09em] text-gray-300">Ton pseudo</span>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ex: Red_Shadow_31"
                    maxLength={50}
                    required
                    className="w-full rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2.5 text-sm text-white"
                  />
                </label>

                <div>
                  <span className="mb-1 block text-xs uppercase tracking-[0.09em] text-gray-300">Note</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setHearts(n)}
                        className="rounded-lg border p-2 transition"
                        style={{
                          backgroundColor: hearts >= n ? "#e12b5b" : "rgba(255,255,255,0.04)",
                          borderColor: hearts >= n ? "#e12b5b" : "rgba(255,255,255,0.14)",
                          color: hearts >= n ? "white" : "rgba(227,227,235,0.75)",
                        }}
                        aria-label={`${n} coeur${n > 1 ? "s" : ""}`}
                      >
                        <Heart className="h-5 w-5" fill={hearts >= n ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs uppercase tracking-[0.09em] text-gray-300">Aide a la redaction</p>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedPrompt === prompt
                          ? "border-[#7a3cff]/50 bg-[#7a3cff]/20 text-[#dec9ff]"
                          : "border-white/15 bg-white/[0.04] text-gray-200"
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.09em] text-gray-300">Ton message</span>
                  <span className="text-xs text-gray-400">{remaining} caracteres restants</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: TENF m'a aide a sortir de l'isolement sur Twitch..."
                  maxLength={MAX_MESSAGE}
                  rows={6}
                  required
                  className="w-full resize-none rounded-lg border border-white/12 bg-[#0e1220] px-3 py-2.5 text-sm text-white"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Minimum {MIN_MESSAGE} caracteres. Reste concret: ce qui t&apos;a aide, ce qui est utile, ce qui change.
                </p>
              </label>

              {error ? <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div> : null}
              {success ? <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">Merci. Ton avis a bien ete publie.</div> : null}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#7a3cff] to-[#e12b5b] py-3 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Envoi en cours..." : "Publier mon avis"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] uppercase tracking-[0.09em] text-gray-300">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

function HeartsBadge({ hearts, size }: { hearts: number; size: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Heart
          key={n}
          className={iconSize}
          fill={hearts >= n ? "#e12b5b" : "none"}
          style={{ color: hearts >= n ? "#e12b5b" : "rgba(255,255,255,0.2)" }}
        />
      ))}
    </span>
  );
}
