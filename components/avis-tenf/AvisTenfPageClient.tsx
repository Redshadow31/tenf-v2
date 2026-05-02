"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Compass,
  ExternalLink,
  Heart,
  HeartHandshake,
  Quote,
  TextQuote,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReviewMessageMarkdown from "@/components/reviews/ReviewMessageMarkdown";
import {
  MAX_REVIEW_MESSAGE_LENGTH as MAX_MESSAGE,
  MIN_REVIEW_MESSAGE_LENGTH as MIN_MESSAGE,
} from "@/lib/reviewsMessageLimits";
import fnStyles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

interface Review {
  id: string;
  type: string;
  pseudo: string;
  message: string;
  hearts: number | null;
  created_at: string;
}

type SortMode = "recent" | "top";

const SECTION_IDS = [
  { id: "avis-intro", label: "Intro" },
  { id: "avis-a-la-une", label: "À la une" },
  { id: "avis-temoignages", label: "Témoignages" },
  { id: "avis-participer", label: "Participer" },
] as const;

const MESSAGE_PROMPTS = [
  "Ce que TENF m'a apporté",
  "Ce que j'ai le plus aimé",
  "Un conseil pour les nouveaux",
  "Mon avant / après TENF",
];

function pickRandomFeatured(reviews: Review[], size = 3, previousIds: string[] = []): Review[] {
  if (reviews.length <= size) return [...reviews];
  const pool = [...reviews];
  const previousSet = new Set(previousIds);

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  let next = pool.slice(0, size);
  if (previousSet.size > 0 && next.every((item) => previousSet.has(item.id))) {
    next = pool.slice(1, size + 1);
  }
  return next;
}

export default function AvisTenfPageClient() {
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number>(5);
  const [selectedPrompt, setSelectedPrompt] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);
  const [modalOpenedAt, setModalOpenedAt] = useState<number | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [minimumHearts, setMinimumHearts] = useState<number>(1);
  const [listQuery, setListQuery] = useState("");
  const [featuredRotating, setFeaturedRotating] = useState<Review[]>([]);
  const [featuredVisible, setFeaturedVisible] = useState(true);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0].id);
  const [audience, setAudience] = useState<"public" | "membre">("public");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    const nodes = SECTION_IDS.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveSection(visible.target.id);
      },
      { root: null, rootMargin: "-38% 0px -45% 0px", threshold: [0, 0.12, 0.25, 0.45] },
    );
    nodes.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isModalOpen) {
      setModalEntered(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => setModalEntered(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isModalOpen]);

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

      const finalMessage = selectedPrompt ? `${selectedPrompt}:\n${message.trim()}` : message.trim();
      if (finalMessage.length > MAX_MESSAGE) {
        setError(`Le message ne doit pas dépasser ${MAX_MESSAGE} caractères`);
        return;
      }

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
    } catch {
      setError("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  const promptPrefixLength = selectedPrompt ? selectedPrompt.length + 2 : 0;
  const maxMessageInputLength = Math.max(0, MAX_MESSAGE - promptPrefixLength);
  const remaining = maxMessageInputLength - message.length;
  const canSubmit =
    pseudo.trim().length >= 2 &&
    message.trim().length >= MIN_MESSAGE &&
    message.length <= maxMessageInputLength &&
    maxMessageInputLength >= MIN_MESSAGE;

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
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const interval = window.setInterval(() => {
      setFeaturedVisible(false);
      window.setTimeout(() => {
        setFeaturedRotating((previous) =>
          pickRandomFeatured(
            featuredPool,
            3,
            previous.map((item) => item.id),
          ),
        );
        setFeaturedVisible(true);
      }, 260);
    }, 5200);

    return () => window.clearInterval(interval);
  }, [featuredPool]);

  const displayedReviews = useMemo(() => {
    const q = listQuery.trim().toLowerCase();
    const filteredByHearts = reviews.filter((r) => Number(r.hearts || 0) >= minimumHearts);
    const filtered = q
      ? filteredByHearts.filter(
          (r) =>
            r.pseudo.toLowerCase().includes(q) ||
            r.message.toLowerCase().includes(q) ||
            r.message.toLowerCase().includes(q.normalize("NFD")),
        )
      : filteredByHearts;

    if (sortMode === "top") {
      return [...filtered].sort((a, b) => {
        const ah = Number(a.hearts || 0);
        const bh = Number(b.hearts || 0);
        if (bh !== ah) return bh - ah;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [reviews, sortMode, minimumHearts, listQuery]);

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function openModal() {
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
    setModalOpenedAt(Date.now());
  }

  return (
    <div className={`${fnStyles.fonctionnementPage} relative min-h-screen text-[var(--color-text)]`}>
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className={`inline-flex items-center gap-1 text-sm font-medium transition-colors hover:text-white ${fnStyles.fnFlowLink}`}
            style={{ color: "var(--color-text-secondary)" }}
          >
            ← Retour à l&apos;accueil
          </Link>
          <div className="flex flex-wrap gap-2">
            <Link href="/fonctionnement-tenf/decouvrir" className={fnStyles.fnBtnGhost}>
              <Compass className="h-4 w-4" aria-hidden />
              Fonctionnement TENF
            </Link>
            <Link href="/a-propos" className={fnStyles.fnBtnGhost}>
              <BookOpen className="h-4 w-4" aria-hidden />
              À propos
            </Link>
          </div>
        </div>

        <section id="avis-intro" className="scroll-mt-28 space-y-8">
          <header className={`${fnStyles.fnPageHero} mb-0`}>
            <div className={fnStyles.fnPageHeroInner}>
              <p className={`${fnStyles.fnEyebrow} flex flex-wrap items-center gap-2`}>
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-[0_0_22px_color-mix(in_srgb,var(--fn-purple)_28%,transparent)]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--fn-purple) 42%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--fn-purple) 22%, #0f081c)",
                    color: "#e9d5ff",
                  }}
                  aria-hidden
                >
                  <TextQuote className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </span>
                Témoignages · communauté TENF
              </p>
              <h1 className={fnStyles.fnHeroTitle}>Ils racontent leur expérience TENF</h1>
              <p className={fnStyles.fnHeroSubtitle}>
                Page ouverte à tous : lire des retours authentiques sur l&apos;intégration, l&apos;entraide et la vie du serveur. Les membres peuvent
                aussi publier un avis structuré — utile pour les personnes qui hésitent encore à franchir le pas.
              </p>
              <div className={fnStyles.fnHeroActions}>
                <button type="button" onClick={openModal} className={fnStyles.fnBtnPrimary}>
                  <Send className="h-4 w-4" aria-hidden />
                  Poster un avis
                </button>
                <button type="button" onClick={() => scrollToId("avis-temoignages")} className={fnStyles.fnBtnGhost}>
                  Parcourir les témoignages
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <Link
                  href="https://discord.gg/WnpazgcZHk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={fnStyles.fnBtnGhost}
                >
                  Discord
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </header>

          <nav className={`${fnStyles.fnDiscoverJumpNav}`} aria-label="Sections de la page">
            <div className="flex min-w-min gap-1.5 px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {SECTION_IDS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  className={`${fnStyles.fnDiscoverJumpLink} ${activeSection === id ? fnStyles.fnDiscoverJumpLinkActive : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAudience("public")}
              className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                audience === "public"
                  ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                <Users className="h-4 w-4" aria-hidden />
                Grand public
              </span>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Je compare les communautés avant de rejoindre</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Les filtres et la recherche t&apos;aident à trouver des retours qui parlent de sujets qui t&apos;importent (intégration, ambiance,
                progression).
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAudience("membre")}
              className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                audience === "membre"
                  ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                <HeartHandshake className="h-4 w-4" aria-hidden />
                Membre TENF
              </span>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">Je veux partager mon ressenti au collectif</p>
              <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-text-secondary)_96%,#c4b5fd)]">
                Utilise les prompts pour structurer ton message. Une note sincère aide le staff et rassure les prochains arrivants.
              </p>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={Star} label="Avis publiés" value={String(stats.total)} hint="Témoignages modérés côté serveur" />
            <StatCard
              icon={Sparkles}
              label="Note moyenne"
              value={stats.average ? `${stats.average}/5` : "—"}
              hint="Sur les avis avec note"
            />
            <StatCard icon={Heart} label="Part de 5 cœurs" value={`${stats.fiveStarsPercent}%`} hint="Parmi les avis notés" />
          </div>
        </section>

        {featuredRotating.length > 0 ? (
          <section
            id="avis-a-la-une"
            className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} mt-10 scroll-mt-28 border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))]`}
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--fn-purple)_22%,transparent)] text-[#e9d5ff]">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h2 className={fnStyles.fnSectionTitle}>À la une</h2>
                  <p className={fnStyles.fnSectionLead}>Sélection mise en avant — rotation automatique parmi les avis les plus récents et mieux notés.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--fn-purple)_28%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_10%,transparent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--fn-purple)_90%,#fff)]">
                <RefreshCw className="h-3 w-3" aria-hidden />
                Rotation
              </span>
            </div>
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-500 sm:grid-cols-2 lg:grid-cols-3 ${
                featuredVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {featuredRotating.map((r) => (
                <article
                  key={`featured-${r.id}`}
                  className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} relative overflow-hidden border-[color-mix(in_srgb,var(--fn-purple)_18%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_88%,transparent)]`}
                >
                  <Quote className="absolute -right-1 -top-1 h-16 w-16 rotate-12 text-[color-mix(in_srgb,var(--fn-purple)_25%,transparent)]" aria-hidden />
                  <div className="relative mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--color-text)]">{r.pseudo}</p>
                    <HeartsBadge hearts={Number(r.hearts || 0)} size="sm" />
                  </div>
                  <div className="relative max-h-[6.5rem] overflow-hidden text-sm">
                    <ReviewMessageMarkdown source={r.message} className="text-[color-mix(in_srgb,var(--color-text-secondary)_98%,#ddd6fe)]" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      scrollToId("avis-temoignages");
                      setExpandedReviewId(r.id);
                    }}
                    className={`${fnStyles.fnFlowLink} mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]`}
                  >
                    Trouver dans la liste
                    <ChevronDown className="h-3 w-3 -rotate-90" aria-hidden />
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section id="avis-participer" className="scroll-mt-28 pt-10">
          <div className={`${fnStyles.fnGuidanceSection}`}>
            <h2 className={fnStyles.fnSectionTitle}>Participer</h2>
            <p className={fnStyles.fnSectionLead}>
              Ton retour compte : il nourrit la confiance des nouveaux et aide le staff à ajuster le cadre. Garde un ton respectueux et précis — pas
              besoin d&apos;être long.
            </p>
            <button type="button" onClick={openModal} className={`${fnStyles.fnBtnPrimary} mt-4`}>
              <Send className="h-4 w-4" aria-hidden />
              Ouvrir le formulaire d&apos;avis
            </button>
          </div>
        </section>

        <section id="avis-temoignages" className="scroll-mt-28 space-y-5 pt-10">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className={fnStyles.fnSectionTitle}>Tous les témoignages</h2>
              <p className={fnStyles.fnSectionLead}>Trie, filtre par note et recherche plein texte (pseudo ou contenu).</p>
            </div>
          </div>

          <div className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center`}>
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" aria-hidden />
              <input
                type="search"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_92%,transparent)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)]"
                aria-label="Rechercher dans les témoignages"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Trier
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_92%,transparent)] px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                >
                  <option value="recent">Plus récents</option>
                  <option value="top">Mieux notés</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Note min.
                <select
                  value={minimumHearts}
                  onChange={(e) => setMinimumHearts(Number(e.target.value))}
                  className="rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_92%,transparent)] px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                >
                  <option value={1}>1 cœur et +</option>
                  <option value={2}>2 cœurs et +</option>
                  <option value={3}>3 cœurs et +</option>
                  <option value={4}>4 cœurs et +</option>
                  <option value={5}>5 cœurs</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className={`${fnStyles.fnMutedCard} py-14 text-center text-[var(--color-text-secondary)]`}>
              <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-[color-mix(in_srgb,var(--fn-purple)_35%,transparent)]" />
              Chargement des témoignages…
            </div>
          ) : displayedReviews.length === 0 ? (
            <div className={`${fnStyles.fnMutedCard} py-10 text-center text-[var(--color-text-secondary)]`}>
              Aucun témoignage ne correspond à ce filtre pour le moment.
            </div>
          ) : (
            <ul className="space-y-4">
              {displayedReviews.map((r) => {
                const open = expandedReviewId === r.id;
                return (
                  <li key={r.id}>
                    <article
                      className={`${fnStyles.fnCard} ${fnStyles.fnCardInteractive} ${fnStyles.fnCardPad} ${
                        open ? "border-[color-mix(in_srgb,var(--fn-purple)_45%,var(--color-border))]" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-[var(--color-text)]">{r.pseudo}</span>
                          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                            {new Date(r.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <HeartsBadge hearts={Number(r.hearts || 0)} size="md" />
                      </div>
                      <div className={`mt-3 text-sm ${open ? "" : "line-clamp-4"}`}>
                        <ReviewMessageMarkdown source={r.message} className="text-[color-mix(in_srgb,var(--color-text-secondary)_98%,#e9d5ff)]" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedReviewId(open ? null : r.id)}
                        className={`${fnStyles.fnFlowLink} mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)]`}
                      >
                        {open ? "Réduire" : "Lire tout"}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className={`${fnStyles.fnFlowFooter} mt-14`}>
          <p className="text-sm text-[var(--color-text-secondary)]">Découvre le fonctionnement ou reviens à l&apos;accueil.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/fonctionnement-tenf/decouvrir" className={`${fnStyles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
              Fonctionnement TENF →
            </Link>
            <Link href="/rejoindre/guide-public" className={`${fnStyles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
              Guide rejoindre →
            </Link>
          </div>
        </div>
      </div>

      {isModalOpen ? (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${modalEntered ? "opacity-100" : "opacity-0"} transition-opacity duration-200`}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-label="Fermer"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avis-modal-title"
            className={`relative z-10 flex max-h-[min(92dvh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl border border-[color-mix(in_srgb,var(--fn-purple)_28%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,#12081f_96%,#000)] shadow-[0_-12px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl ${modalEntered ? "translate-y-0 sm:scale-100" : "translate-y-4 sm:scale-95"} transition-transform duration-200 ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="shrink-0 border-b border-[color-mix(in_srgb,var(--fn-purple)_22%,transparent)] px-5 py-4"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--fn-purple) 28%, transparent), color-mix(in srgb, #e12b5b 12%, transparent))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 id="avis-modal-title" className="text-lg font-bold text-white">
                    Poster un avis TENF
                  </h3>
                  <p className="mt-1 text-sm text-white/85">
                    Utile pour les futurs membres : ce qui t&apos;a aidé, ce qui pourrait s&apos;améliorer, ton ressenti global.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/25 bg-black/25 p-2 text-white backdrop-blur-sm hover:bg-black/40"
                  aria-label="Fermer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                    Pseudo affiché
                  </span>
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ex. ton pseudo Twitch"
                    maxLength={50}
                    required
                    className="w-full rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_25%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_95%,transparent)] px-3 py-2.5 text-sm text-[var(--color-text)]"
                  />
                </label>

                <div className="sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                    Note (cœurs)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setHearts(n)}
                        className="rounded-xl border p-2.5 transition hover:scale-[1.03]"
                        style={{
                          backgroundColor: hearts >= n ? "color-mix(in srgb, #e12b5b 85%, #000)" : "color-mix(in srgb, #fff 5%, transparent)",
                          borderColor: hearts >= n ? "#fb7185" : "color-mix(in srgb, var(--fn-purple) 28%, var(--color-border))",
                          color: hearts >= n ? "white" : "var(--color-text-secondary)",
                        }}
                        aria-label={`${n} cœur${n > 1 ? "s" : ""}`}
                      >
                        <Heart className="h-5 w-5" fill={hearts >= n ? "currentColor" : "none"} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                  Aide à la rédaction
                </p>
                <div className="flex flex-wrap gap-2">
                  {MESSAGE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => setSelectedPrompt(prompt)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selectedPrompt === prompt
                          ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_25%,transparent)] text-white"
                          : "border-[color-mix(in_srgb,var(--fn-purple)_18%,var(--color-border))] bg-[color-mix(in_srgb,#fff_4%,transparent)] text-[var(--color-text-secondary)] hover:border-[color-mix(in_srgb,var(--fn-purple)_38%,var(--color-border))]"
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              <label className="mt-4 block min-h-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">Ton message</span>
                  <span className="text-xs text-[var(--color-text-secondary)]">{Math.max(0, remaining)} caractères restants</span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex. TENF m'a aidé à sortir de l'isolement sur Twitch…"
                  maxLength={maxMessageInputLength || MAX_MESSAGE}
                  rows={6}
                  required
                  className="min-h-[140px] w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_25%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_95%,transparent)] px-3 py-2.5 text-sm text-[var(--color-text)]"
                />
                <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                  Minimum {MIN_MESSAGE} caractères, maximum {MAX_MESSAGE} au total (y compris l&apos;aide). Retours à la ligne conservés. Mise en forme
                  type Discord : **gras**, *italique*, listes, `code`.
                </p>
              </label>

              {error ? (
                <div className="mt-3 rounded-xl border border-rose-400/35 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</div>
              ) : null}
              {success ? (
                <div className="mt-3 rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  Merci — ton avis a bien été publié.
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={`${fnStyles.fnBtnPrimary} mt-4 w-full justify-center disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <Send className="h-4 w-4" aria-hidden />
                {submitting ? "Envoi…" : "Publier mon avis"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint: string; icon: LucideIcon }) {
  return (
    <article
      className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} relative overflow-hidden border-[color-mix(in_srgb,var(--fn-purple)_20%,var(--color-border))]`}
    >
      <Icon className="absolute -right-2 -top-2 h-14 w-14 text-[color-mix(in_srgb,var(--fn-purple)_18%,transparent)]" aria-hidden />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--fn-purple)_75%,#fff)]">{label}</p>
      <p className="relative mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">{value}</p>
      <p className="relative mt-2 text-xs leading-snug text-[var(--color-text-secondary)]">{hint}</p>
    </article>
  );
}

function HeartsBadge({ hearts, size }: { hearts: number; size: "sm" | "md" }) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <span className="inline-flex gap-0.5" aria-label={`${hearts} sur 5 cœurs`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Heart
          key={n}
          className={iconSize}
          fill={hearts >= n ? "#e11d48" : "none"}
          style={{
            color: hearts >= n ? "#fb7185" : "color-mix(in srgb, var(--fn-purple) 35%, transparent)",
          }}
        />
      ))}
    </span>
  );
}
