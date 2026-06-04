"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Compass,
  ExternalLink,
  Filter,
  Heart,
  HeartHandshake,
  HelpCircle,
  Loader2,
  MessageSquare,
  Quote,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  TextQuote,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReviewMessageMarkdown from "@/components/reviews/ReviewMessageMarkdown";
import { DISCORD_INVITE_URL } from "@/lib/socialLinks";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import {
  MAX_REVIEW_MESSAGE_LENGTH as MAX_MESSAGE,
  MIN_REVIEW_MESSAGE_LENGTH as MIN_MESSAGE,
} from "@/lib/reviewsMessageLimits";
import { PRIVACY_CONSENT_ERROR_FORM } from "@/lib/legal/privacyConsent";
import fnStyles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

// ============================================================
// Types & constantes
// ============================================================
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
  { id: "avis-pourquoi", label: "Pourquoi ça compte" },
  { id: "avis-a-la-une", label: "À la une" },
  { id: "avis-temoignages", label: "Tous les retours" },
  { id: "avis-partager", label: "Témoigner" },
  { id: "avis-faq", label: "FAQ" },
] as const;

const MESSAGE_PROMPTS = [
  "Ce que TENF m'a apporté",
  "Ce que j'ai le plus aimé",
  "Un conseil pour les nouveaux",
  "Mon avant / après TENF",
];

const REASSURANCE_CARDS: Array<{ icon: LucideIcon; title: string; text: string; tone: string }> = [
  {
    icon: HeartHandshake,
    title: "Entraide réelle",
    text: "Raids, follows, conseils, partage de plannings : les membres parlent de gestes concrets, pas d'idéaux abstraits.",
    tone: "#a78bfa",
  },
  {
    icon: Trophy,
    title: "Progression Twitch",
    text: "Beaucoup racontent un avant/après TENF — première communauté, premier affilié, premier événement collectif.",
    tone: "#f59e0b",
  },
  {
    icon: Users,
    title: "Ambiance familiale",
    text: "Bienveillance, vannes, rencontres, soirées Discord… les avis montrent un quotidien vivant et chaleureux.",
    tone: "#f43f5e",
  },
  {
    icon: Sparkles,
    title: "Place pour les nouveaux",
    text: "Pas besoin d'être déjà gros streamer : les premiers pas sont accompagnés et plusieurs retours en témoignent.",
    tone: "#38bdf8",
  },
];

const SHARE_TOPICS: Array<{ emoji: string; title: string; desc: string }> = [
  {
    emoji: "👋",
    title: "Ton arrivée dans la communauté",
    desc: "Comment tu es tombé·e sur TENF, ce qui t'a donné envie de rester.",
  },
  {
    emoji: "🚀",
    title: "Un raid qui t'a aidé·e",
    desc: "Un raid réussi, une mise en avant, une chaîne qui a décollé d'un coup.",
  },
  {
    emoji: "💬",
    title: "Une rencontre marquante",
    desc: "Un membre, un staff, un nouveau pote streamer croisé via Discord.",
  },
  {
    emoji: "💡",
    title: "Un conseil reçu",
    desc: "Une astuce technique, un retour bienveillant, une feedback utile.",
  },
  {
    emoji: "📈",
    title: "Une progression Twitch",
    desc: "Premiers followers, premier affilié, premier sub — ce qui a déclenché ton déclic.",
  },
  {
    emoji: "🎉",
    title: "Un événement communautaire",
    desc: "Un live collectif, une réunion, un projet collaboratif, un IRL.",
  },
  {
    emoji: "🌙",
    title: "L'ambiance au quotidien",
    desc: "Les vocaux, les vannes, le ton du Discord, l'énergie globale.",
  },
  {
    emoji: "🤗",
    title: "Te sentir moins seul·e",
    desc: "Le rôle que TENF a joué dans ton parcours, surtout dans les moments difficiles.",
  },
];

const FAQ_ITEMS: Array<{ q: string; a: string }> = [
  {
    q: "Qui peut déposer un témoignage ?",
    a: "Toute personne ayant rejoint TENF ou interagi avec la communauté. Tu peux écrire avec ton pseudo Twitch ou un pseudo de ton choix.",
  },
  {
    q: "Mon témoignage est-il publié directement ?",
    a: "Les avis sont relus par le staff avant publication. Cela permet de garder un espace respectueux et utile aux nouveaux membres — ce n'est pas une censure.",
  },
  {
    q: "Dois-je écrire un long texte ?",
    a: "Pas du tout. Quelques phrases sincères suffisent largement. Si tu veux développer une histoire précise, c'est aussi très bienvenu — chaque format trouve sa place.",
  },
  {
    q: "Puis-je parler d'un moment précis ?",
    a: "Oui : un raid, une rencontre, un événement, un conseil… Les retours concrets aident plus que les textes généraux. Tu peux aussi simplement décrire ton ressenti.",
  },
  {
    q: "Puis-je modifier ou retirer mon avis ensuite ?",
    a: "Oui. Envoie un message au staff via Discord ou la page contact : on retire ou met à jour ton témoignage sans souci.",
  },
];

/** Seuil de longueur au-delà duquel on affiche un extrait + bouton "lire complet". */
const EXCERPT_LENGTH = 240;

// ============================================================
// Wrapper fluide (pleine largeur scalable au zoom)
// ============================================================
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--avis-px": "clamp(0.75rem, 2vw, 2.75rem)",
  paddingLeft: "var(--avis-px)",
  paddingRight: "var(--avis-px)",
  paddingTop: "clamp(1rem, 2vw, 2rem)",
  paddingBottom: "clamp(2rem, 3vw, 3.5rem)",
};

const PAGE_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

// ============================================================
// Utilitaires
// ============================================================
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

function getInitials(pseudo: string): string {
  return pseudo
    .replace(/[^a-zA-ZÀ-ÿ0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("") || pseudo.charAt(0).toUpperCase() || "T";
}

/** Couleur déterministe à partir du pseudo (pour avatar initiales). */
function pseudoColor(pseudo: string): string {
  const palette = ["#a78bfa", "#f43f5e", "#38bdf8", "#22c55e", "#f59e0b", "#ec4899", "#34d399", "#fb923c"];
  let hash = 0;
  for (let i = 0; i < pseudo.length; i += 1) {
    hash = (hash * 31 + pseudo.charCodeAt(i)) % palette.length;
  }
  return palette[Math.abs(hash) % palette.length];
}

function formatLongDate(value: string): string {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortenForExcerpt(message: string, length: number = EXCERPT_LENGTH): { excerpt: string; isTruncated: boolean } {
  // Retire les prompts éventuels en début "Ce que TENF m'a apporté:\n…"
  const trimmed = message.trim();
  if (trimmed.length <= length) return { excerpt: trimmed, isTruncated: false };
  // Coupe sur le dernier espace avant la limite pour éviter de couper un mot
  const sliced = trimmed.slice(0, length);
  const lastSpace = sliced.lastIndexOf(" ");
  const cut = lastSpace > length * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return { excerpt: `${cut}…`, isTruncated: true };
}

// ============================================================
// Page client
// ============================================================
export default function AvisTenfPageClient() {
  // ---- États du formulaire d'avis (modal soumission) ---------
  const [pseudo, setPseudo] = useState("");
  const [message, setMessage] = useState("");
  const [hearts, setHearts] = useState<number>(5);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState("");

  // ---- Liste des avis ----------------------------------------
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ---- Modal de soumission (écriture) ------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalEntered, setModalEntered] = useState(false);
  const [modalOpenedAt, setModalOpenedAt] = useState<number | null>(null);

  // ---- Modal de lecture complète d'un témoignage -------------
  const [readingReview, setReadingReview] = useState<Review | null>(null);
  const [readingEntered, setReadingEntered] = useState(false);

  // ---- Filtres & tri -----------------------------------------
  const [sortMode, setSortMode] = useState<SortMode>("recent");
  const [minimumHearts, setMinimumHearts] = useState<number>(1);
  const [listQuery, setListQuery] = useState("");

  // ---- À la une (rotation) -----------------------------------
  const [featuredRotating, setFeaturedRotating] = useState<Review[]>([]);
  const [featuredVisible, setFeaturedVisible] = useState(true);

  // ---- Scroll-spy + audience selector ------------------------
  const [activeSection, setActiveSection] = useState<string>(SECTION_IDS[0].id);
  const [audience, setAudience] = useState<"public" | "membre">("public");

  // ---- Refs pour focus management ----------------------------
  const pseudoInputRef = useRef<HTMLInputElement | null>(null);
  const closeReadingButtonRef = useRef<HTMLButtonElement | null>(null);

  // ---- Chargement initial -----------------------------------
  useEffect(() => {
    loadReviews();
  }, []);

  // ---- Scroll-spy --------------------------------------------
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

  // ---- Modal d'écriture : ESC, body scroll lock, focus -------
  useEffect(() => {
    if (!isModalOpen) {
      setModalEntered(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      setModalEntered(true);
      pseudoInputRef.current?.focus();
    });
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

  // ---- Modal de lecture : ESC, body scroll lock, focus -------
  useEffect(() => {
    if (!readingReview) {
      setReadingEntered(false);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      setReadingEntered(true);
      closeReadingButtonRef.current?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReadingReview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [readingReview]);

  // ---- Récupération des avis --------------------------------
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

  // ---- Soumission d'un avis ---------------------------------
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!privacyConsent) {
      setConsentError(PRIVACY_CONSENT_ERROR_FORM);
      return;
    }
    setConsentError(null);
    setSubmitting(true);
    try {
      const now = Date.now();
      if (modalOpenedAt && now - modalOpenedAt < 1200) {
        setError("Prends quelques secondes pour rédiger ton retour avant d'envoyer.");
        return;
      }

      const finalMessage = selectedPrompt ? `${selectedPrompt}:\n${message.trim()}` : message.trim();
      if (finalMessage.length > MAX_MESSAGE) {
        setError(`Ton message dépasse la limite de ${MAX_MESSAGE} caractères.`);
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
          privacyConsent: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de l'envoi. Réessaie d'ici un instant.");
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
      }, 1100);
    } catch {
      setError("Erreur réseau. Vérifie ta connexion puis réessaie.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Calculs dérivés --------------------------------------
  const promptPrefixLength = selectedPrompt ? selectedPrompt.length + 2 : 0;
  const maxMessageInputLength = Math.max(0, MAX_MESSAGE - promptPrefixLength);
  const remaining = maxMessageInputLength - message.length;
  const canSubmit =
    pseudo.trim().length >= 2 &&
    message.trim().length >= MIN_MESSAGE &&
    message.length <= maxMessageInputLength &&
    maxMessageInputLength >= MIN_MESSAGE &&
    privacyConsent;

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
    }, 5400);

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

  const filtersActive = listQuery.trim().length > 0 || minimumHearts > 1 || sortMode !== "recent";

  const scrollToId = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function openModal() {
    setError(null);
    setSuccess(false);
    setIsModalOpen(true);
    setModalOpenedAt(Date.now());
  }

  function resetFilters() {
    setListQuery("");
    setMinimumHearts(1);
    setSortMode("recent");
  }

  // ============================================================
  // Rendu
  // ============================================================
  return (
    <div
      className={`${fnStyles.fonctionnementPage} relative min-h-screen text-[var(--color-text)]`}
      style={PAGE_OUTER_STYLE}
    >
      <div className="relative z-10 flex flex-col gap-10 sm:gap-12" style={PAGE_INNER_STYLE}>
        {/* ============ Retour + liens secondaires ============ */}
        <div className="flex flex-wrap items-center justify-between gap-3">
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

        {/* ============ HERO ============ */}
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
              <h1 className={fnStyles.fnHeroTitle}>Les voix de la New Family</h1>
              <p className={fnStyles.fnHeroSubtitle}>
                Des retours sincères de membres TENF — pas une vitrine.{" "}
                <span className="text-[color-mix(in_srgb,#f5d0fe_92%,#fff)]">
                  Tu y trouveras des récits d&apos;intégration, des progressions Twitch et des rencontres
                </span>
                {" "}qui montrent ce que vit vraiment la communauté au quotidien.
              </p>
              <div className={fnStyles.fnHeroActions}>
                <button type="button" onClick={openModal} className={fnStyles.fnBtnPrimary}>
                  <MessageSquare className="h-4 w-4" aria-hidden />
                  Partager mon expérience
                </button>
                <button type="button" onClick={() => scrollToId("avis-temoignages")} className={fnStyles.fnBtnGhost}>
                  Lire les témoignages
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
                <Link
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={fnStyles.fnBtnGhost}
                >
                  Rejoindre le Discord
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              {/* Mini bandeau de réassurance dans le hero */}
              <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { Icon: ShieldCheck, label: "Témoignages relus avant publication" },
                  { Icon: Heart, label: "Vrais retours de membres TENF" },
                  { Icon: Sparkles, label: "Communauté Twitch active" },
                ].map(({ Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold"
                    style={{
                      borderColor: "color-mix(in srgb, var(--fn-purple) 28%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, var(--fn-purple) 8%, transparent)",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: "#d8b4fe" }} aria-hidden />
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </header>

          {/* Nav sticky scroll-spy */}
          <nav className={fnStyles.fnDiscoverJumpNav} aria-label="Sections de la page">
            <div className="flex min-w-min gap-1.5 px-0.5 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
              {SECTION_IDS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToId(id)}
                  aria-current={activeSection === id ? "true" : undefined}
                  className={`${fnStyles.fnDiscoverJumpLink} ${activeSection === id ? fnStyles.fnDiscoverJumpLinkActive : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </nav>

          {/* Audience selector */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAudience("public")}
              aria-pressed={audience === "public"}
              className={`rounded-2xl border px-4 py-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                audience === "public"
                  ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                <Users className="h-4 w-4" aria-hidden />
                Je découvre TENF
              </span>
              <p className="mt-2 text-sm font-bold text-[var(--color-text)]">
                Je compare les communautés avant de me lancer
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Utilise la recherche et le tri pour trouver les retours qui te parlent : ambiance, entraide, progression, premiers pas.
              </p>
            </button>
            <button
              type="button"
              onClick={() => setAudience("membre")}
              aria-pressed={audience === "membre"}
              className={`rounded-2xl border px-4 py-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                audience === "membre"
                  ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_14%,transparent)] shadow-[0_0_32px_color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
                  : "border-[color-mix(in_srgb,var(--color-border)_90%,var(--fn-purple))] bg-[color-mix(in_srgb,var(--color-card)_85%,transparent)] hover:border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]"
              }`}
            >
              <span className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                <HeartHandshake className="h-4 w-4" aria-hidden />
                Je suis membre
              </span>
              <p className="mt-2 text-sm font-bold text-[var(--color-text)]">Je veux partager mon ressenti</p>
              <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-text-secondary)_96%,#c4b5fd)]">
                Quelques phrases sincères suffisent. Tu peux parler d&apos;un raid, d&apos;un conseil, d&apos;une rencontre ou de ton ressenti.
              </p>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard icon={Star} label="Avis publiés" value={String(stats.total)} hint="Témoignages modérés par le staff" />
            <StatCard
              icon={Sparkles}
              label="Note moyenne"
              value={stats.average ? `${stats.average}/5` : "—"}
              hint="Sur les avis avec note"
            />
            <StatCard icon={Heart} label="Avis 5 cœurs" value={`${stats.fiveStarsPercent}%`} hint="Parmi les retours notés" />
          </div>
        </section>

        {/* ============ RÉASSURANCE : 4 CARTES ============ */}
        <section aria-labelledby="avis-reassurance-title" className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="max-w-2xl space-y-2">
              <p className={fnStyles.fnEyebrow}>Ce que ces témoignages montrent</p>
              <h2 id="avis-reassurance-title" className={fnStyles.fnSectionTitle}>
                Pas une vitrine, un vrai vécu
              </h2>
              <p className={fnStyles.fnSectionLead}>
                Quatre choses reviennent souvent dans les retours — voici ce que tu retrouveras en lisant les témoignages.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REASSURANCE_CARDS.map((card) => (
              <ReassuranceCard key={card.title} card={card} />
            ))}
          </div>
        </section>

        {/* ============ POURQUOI ÇA COMPTE ============ */}
        <section id="avis-pourquoi" className="scroll-mt-28 space-y-5">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
            <div className="space-y-3">
              <p className={fnStyles.fnEyebrow}>Pourquoi leurs mots comptent</p>
              <h2 className={fnStyles.fnSectionTitle}>Des récits, pas des slogans</h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                Sur Twitch, beaucoup de communautés se présentent avec de jolies promesses. Ici, on a préféré laisser parler les membres : ce qu&apos;ils ont vécu, ce qui les a aidés, ce qu&apos;ils auraient aimé savoir avant d&apos;arriver.
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                Les témoignages ne sont pas des cases à cocher : ils racontent un parcours. Tu y verras des nouveaux qui décrivent leurs premiers raids, des affiliés qui parlent d&apos;une collaboration née sur le Discord, des membres qui évoquent simplement le fait de se sentir à leur place.
              </p>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                On modère pour rester respectueux, on ne réécrit pas. C&apos;est volontairement humain et imparfait — comme la vraie vie d&apos;une communauté.
              </p>
            </div>
            <aside
              className="rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: "color-mix(in srgb, var(--fn-purple) 30%, var(--color-border))",
                background:
                  "linear-gradient(160deg, color-mix(in srgb, var(--fn-purple) 12%, transparent), rgba(15,17,22,0.9))",
              }}
            >
              <p className={fnStyles.fnEyebrow}>Conseils pour un bon témoignage</p>
              <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {[
                  "Pars d'un moment précis : un raid, une rencontre, un conseil reçu.",
                  "Décris ce que ça a changé pour toi sur Twitch ou au quotidien.",
                  "Tu peux mentionner un pseudo si la personne a marqué ton parcours.",
                  "Pas besoin de tout dire : un détail sincère vaut souvent mieux qu'un texte long.",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" aria-hidden />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openModal}
                className={`${fnStyles.fnBtnPrimary} mt-4 w-full justify-center`}
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                J&apos;écris le mien
              </button>
            </aside>
          </div>
        </section>

        {/* ============ À LA UNE (rotation) ============ */}
        {featuredRotating.length > 0 ? (
          <section
            id="avis-a-la-une"
            className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} scroll-mt-28 border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))]`}
          >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--fn-purple)_22%,transparent)] text-[#e9d5ff]">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className={fnStyles.fnEyebrow}>À la une cette semaine</p>
                  <h2 className={fnStyles.fnSectionTitle}>Quelques voix mises en avant</h2>
                  <p className={fnStyles.fnSectionLead}>
                    Rotation automatique parmi les retours récents et les mieux notés — clique pour lire le témoignage entier.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--fn-purple)_28%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_10%,transparent)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[color-mix(in_srgb,var(--fn-purple)_90%,#fff)]">
                <RefreshCw className="h-3 w-3" aria-hidden />
                Rotation auto
              </span>
            </div>
            <div
              className={`grid grid-cols-1 gap-4 transition-opacity duration-500 sm:grid-cols-2 lg:grid-cols-3 ${
                featuredVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {featuredRotating.map((r) => (
                <FeaturedCard
                  key={`featured-${r.id}`}
                  review={r}
                  onOpen={() => setReadingReview(r)}
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* ============ TÉMOIGNAGES (liste + filtres) ============ */}
        <section id="avis-temoignages" className="scroll-mt-28 space-y-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className={fnStyles.fnEyebrow}>Tous les retours</p>
              <h2 className={fnStyles.fnSectionTitle}>Ce que les membres racontent</h2>
              <p className={fnStyles.fnSectionLead}>
                Cherche par pseudo ou contenu, filtre par note, ou trie pour voir les plus appréciés en premier.
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className={`${fnStyles.fnBtnGhost} self-start md:self-end`}
            >
              <MessageSquare className="h-4 w-4" aria-hidden />
              Ajouter mon témoignage
            </button>
          </div>

          {/* Barre de filtres */}
          <div
            className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center`}
          >
            <div className="relative min-w-[220px] flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]"
                aria-hidden
              />
              <input
                id="avis-search"
                type="search"
                value={listQuery}
                onChange={(e) => setListQuery(e.target.value)}
                placeholder="Rechercher un pseudo, un mot, un sujet…"
                className="w-full rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_92%,transparent)] py-2.5 pl-10 pr-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                aria-label="Rechercher dans les témoignages"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label
                htmlFor="avis-sort"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Trier
                <select
                  id="avis-sort"
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as SortMode)}
                  className="rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_92%,transparent)] px-3 py-2 text-sm font-medium text-[var(--color-text)]"
                >
                  <option value="recent">Plus récents</option>
                  <option value="top">Mieux notés</option>
                </select>
              </label>
              <label
                htmlFor="avis-min"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]"
              >
                Note min.
                <select
                  id="avis-min"
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
              {filtersActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,#fff_4%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--color-text)] transition hover:bg-white/5"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Réinitialiser
                </button>
              ) : null}
            </div>
          </div>

          {/* Liste / grille */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <ReviewCardSkeleton key={`skeleton-${idx}`} />
              ))}
            </div>
          ) : displayedReviews.length === 0 ? (
            <EmptyState filtersActive={filtersActive} onReset={resetFilters} onOpenForm={openModal} />
          ) : (
            <ul
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
              role="list"
              aria-label="Liste des témoignages"
            >
              {displayedReviews.map((r) => (
                <li key={r.id} className="h-full">
                  <ReviewCard review={r} onRead={() => setReadingReview(r)} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ============ CE QUE TU PEUX PARTAGER ============ */}
        <section id="avis-partager" className="scroll-mt-28 space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className={fnStyles.fnEyebrow}>Ce que tu peux partager</p>
            <h2 className={fnStyles.fnSectionTitle}>Partager ton expérience peut aider quelqu&apos;un à oser nous rejoindre</h2>
            <p className={fnStyles.fnSectionLead}>
              Tu n&apos;as pas besoin d&apos;avoir « réussi sur Twitch » pour témoigner. Voici quelques angles que tu peux aborder — choisis-en un, deux, ou inspire-toi librement.
            </p>
          </div>
          <ul
            className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4"
            role="list"
          >
            {SHARE_TOPICS.map((topic) => (
              <li
                key={topic.title}
                className="group h-full rounded-2xl border p-4 transition hover:-translate-y-0.5"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
                }}
              >
                <span aria-hidden className="text-2xl">
                  {topic.emoji}
                </span>
                <p className="mt-2 text-sm font-bold leading-snug text-[var(--color-text)]">
                  {topic.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  {topic.desc}
                </p>
              </li>
            ))}
          </ul>
          <div
            className={`${fnStyles.fnGuidanceSection} flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between`}
          >
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--color-text)] sm:text-lg">
                Prêt·e à raconter ton bout d&apos;histoire ?
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Quelques phrases sincères suffisent. Les retours sont relus avant publication pour garder un espace respectueux.
              </p>
            </div>
            <button type="button" onClick={openModal} className={fnStyles.fnBtnPrimary}>
              <MessageSquare className="h-4 w-4" aria-hidden />
              Partager mon expérience
            </button>
          </div>
        </section>

        {/* ============ FAQ ============ */}
        <section id="avis-faq" className="scroll-mt-28 space-y-5">
          <div className="max-w-2xl space-y-2">
            <p className={fnStyles.fnEyebrow}>FAQ</p>
            <h2 className={fnStyles.fnSectionTitle}>Les questions qui reviennent</h2>
            <p className={fnStyles.fnSectionLead}>
              Tout savoir avant de déposer ton retour — pas de piège, juste de la clarté.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "color-mix(in srgb, var(--color-card) 92%, transparent)",
                }}
              >
                <summary
                  className="flex cursor-pointer items-start justify-between gap-3 text-sm font-bold list-none marker:hidden sm:text-base"
                  style={{ color: "var(--color-text)" }}
                >
                  <span className="inline-flex items-start gap-2">
                    <HelpCircle
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{ color: "#d8b4fe" }}
                      aria-hidden
                    />
                    {item.q}
                  </span>
                  <span
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs transition group-open:rotate-45"
                    style={{
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-secondary)",
                    }}
                    aria-hidden
                  >
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section
          className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10"
          style={{
            borderColor: "color-mix(in srgb, var(--fn-purple) 32%, var(--color-border))",
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--fn-purple) 18%, transparent), color-mix(in srgb, #e12b5b 10%, transparent) 60%, rgba(15,17,22,0.85))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full blur-3xl"
            style={{ backgroundColor: "color-mix(in srgb, #e12b5b 22%, transparent)" }}
            aria-hidden
          />
          <div className="relative space-y-4">
            <p className={fnStyles.fnEyebrow}>On t&apos;attend</p>
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--color-text)" }}>
              Ton retour peut aider un·e futur·e membre à oser nous rejoindre.
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
              Que tu sois là depuis un mois ou trois ans, ton histoire compte. Et si tu débarques sur cette page sans encore connaître TENF — bienvenue, prends le temps de découvrir.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={openModal} className={fnStyles.fnBtnPrimary}>
                <MessageSquare className="h-4 w-4" aria-hidden />
                Partager mon expérience
              </button>
              <Link href="/fonctionnement-tenf/decouvrir" className={fnStyles.fnBtnGhost}>
                <Compass className="h-4 w-4" aria-hidden />
                Découvrir la communauté
              </Link>
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={fnStyles.fnBtnGhost}
              >
                Rejoindre le Discord
                <ExternalLink className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </section>

        {/* ============ Footer minimaliste ============ */}
        <div className={fnStyles.fnFlowFooter}>
          <p className="text-sm text-[var(--color-text-secondary)]">Continue la visite côté fonctionnement, ou retourne sur l&apos;accueil.</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/fonctionnement-tenf/decouvrir" className={`${fnStyles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
              Fonctionnement TENF →
            </Link>
            <Link href="/rejoindre/guide-public" className={`${fnStyles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
              Guide pour rejoindre →
            </Link>
          </div>
        </div>
      </div>

      {/* ============ MODAL : ÉCRIRE UN AVIS ============ */}
      {isModalOpen ? (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${
            modalEntered ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-label="Fermer la fenêtre"
            onClick={() => setIsModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avis-modal-title"
            className={`relative z-10 flex max-h-[min(92dvh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[color-mix(in_srgb,var(--fn-purple)_28%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,#12081f_96%,#000)] shadow-[0_-12px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl ${
              modalEntered ? "translate-y-0 sm:scale-100" : "translate-y-4 sm:scale-95"
            } transition-transform duration-200 ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="shrink-0 border-b border-[color-mix(in_srgb,var(--fn-purple)_22%,transparent)] px-5 py-5"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--fn-purple) 30%, transparent), color-mix(in srgb, #e12b5b 14%, transparent))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
                    Partager mon expérience
                  </p>
                  <h3 id="avis-modal-title" className="mt-1 text-xl font-extrabold text-white sm:text-2xl">
                    Ton retour peut aider un·e futur·e membre
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/85">
                    Pas de pression : quelques phrases sincères suffisent. Tu peux parler d&apos;un raid, d&apos;un conseil, d&apos;une rencontre ou simplement de ton ressenti.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-white/25 bg-black/25 p-2 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Fermer la fenêtre"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label htmlFor="avis-pseudo" className="block sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                    Pseudo affiché
                  </span>
                  <input
                    id="avis-pseudo"
                    ref={pseudoInputRef}
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    placeholder="Ex : ton pseudo Twitch ou Discord"
                    maxLength={50}
                    required
                    aria-required="true"
                    aria-describedby="avis-pseudo-hint"
                    className="w-full rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_25%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_95%,transparent)] px-3 py-2.5 text-sm text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  />
                  <p id="avis-pseudo-hint" className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Sera affiché tel quel sous ton avis.
                  </p>
                </label>

                <div className="sm:col-span-1">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                    Note (cœurs)
                  </span>
                  <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Note du témoignage">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = hearts >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          role="radio"
                          aria-checked={hearts === n}
                          onClick={() => setHearts(n)}
                          className="rounded-xl border p-2.5 transition hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-300"
                          style={{
                            backgroundColor: active ? "color-mix(in srgb, #e12b5b 85%, #000)" : "color-mix(in srgb, #fff 5%, transparent)",
                            borderColor: active ? "#fb7185" : "color-mix(in srgb, var(--fn-purple) 28%, var(--color-border))",
                            color: active ? "white" : "var(--color-text-secondary)",
                          }}
                          aria-label={`${n} cœur${n > 1 ? "s" : ""}`}
                        >
                          <Heart className="h-5 w-5" fill={active ? "currentColor" : "none"} />
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    Optionnel mais aide à mettre en avant ton retour.
                  </p>
                </div>
              </div>

              {/* Prompts */}
              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                  Tu peux choisir un angle (optionnel)
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Angles suggérés">
                  {MESSAGE_PROMPTS.map((prompt) => {
                    const active = selectedPrompt === prompt;
                    return (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setSelectedPrompt(active ? "" : prompt)}
                        aria-pressed={active}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                          active
                            ? "border-[color-mix(in_srgb,var(--fn-purple)_55%,transparent)] bg-[color-mix(in_srgb,var(--fn-purple)_25%,transparent)] text-white"
                            : "border-[color-mix(in_srgb,var(--fn-purple)_18%,var(--color-border))] bg-[color-mix(in_srgb,#fff_4%,transparent)] text-[var(--color-text-secondary)] hover:border-[color-mix(in_srgb,var(--fn-purple)_38%,var(--color-border))]"
                        }`}
                      >
                        {prompt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <label htmlFor="avis-message" className="mt-5 block min-h-0 flex-1">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wide text-[color-mix(in_srgb,var(--fn-purple)_85%,#fff)]">
                    Ton témoignage
                  </span>
                  <span
                    className="text-xs text-[var(--color-text-secondary)]"
                    aria-live="polite"
                  >
                    {Math.max(0, remaining)} caractères restants
                  </span>
                </div>
                <textarea
                  id="avis-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex : Depuis que je suis arrivé·e sur TENF, j'ai vraiment trouvé une communauté qui m'aide à progresser sur Twitch…"
                  maxLength={maxMessageInputLength || MAX_MESSAGE}
                  rows={7}
                  required
                  aria-required="true"
                  aria-describedby="avis-message-hint"
                  className="min-h-[160px] w-full resize-y rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_25%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_95%,transparent)] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                />
                <p id="avis-message-hint" className="mt-1.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  Minimum {MIN_MESSAGE} caractères, maximum {MAX_MESSAGE} au total (l&apos;angle choisi est inclus). Tu peux mettre en forme façon Discord :{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5">**gras**</code>,{" "}
                  <code className="rounded bg-black/30 px-1.5 py-0.5">*italique*</code>, listes, retours à la ligne — tout est conservé à la publication.
                </p>
              </label>

              {/* Garantie modération */}
              <div
                className="mt-3 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs"
                style={{
                  borderColor: "color-mix(in srgb, var(--fn-purple) 30%, var(--color-border))",
                  backgroundColor: "color-mix(in srgb, var(--fn-purple) 8%, transparent)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <ShieldCheck
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: "#d8b4fe" }}
                  aria-hidden
                />
                <span>
                  Les témoignages sont <strong className="text-[var(--color-text)]">relus par le staff</strong> avant publication, uniquement pour garder un espace respectueux. On ne réécrit pas ton message.
                </span>
              </div>

              <RgpdConsentCheckbox
                id="avis-tenf-privacy-consent"
                checked={privacyConsent}
                onChange={(checked) => {
                  setPrivacyConsent(checked);
                  if (checked) setConsentError(null);
                }}
                error={consentError}
                className="mt-4"
              />

              {/* États error / success */}
              {error ? (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-3 rounded-xl border border-rose-400/40 bg-rose-500/10 p-3 text-sm leading-relaxed text-rose-200"
                >
                  {error}
                </div>
              ) : null}
              {success ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm leading-relaxed text-emerald-100"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Merci, ton témoignage est bien arrivé ! Il sera publié après une relecture par l&apos;équipe.
                  </span>
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className={`${fnStyles.fnBtnPrimary} flex-1 justify-center disabled:cursor-not-allowed disabled:opacity-45`}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="h-4 w-4" aria-hidden />
                  )}
                  {submitting ? "Envoi en cours…" : "Envoyer mon témoignage"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`${fnStyles.fnBtnGhost} justify-center`}
                >
                  Continuer plus tard
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* ============ MODAL : LECTURE COMPLÈTE ============ */}
      {readingReview ? (
        <div
          className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${
            readingEntered ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200`}
          role="presentation"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            aria-label="Fermer la lecture du témoignage"
            onClick={() => setReadingReview(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avis-reading-title"
            className={`relative z-10 flex max-h-[min(92dvh,820px)] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-[color-mix(in_srgb,var(--fn-purple)_28%,rgba(255,255,255,0.12))] bg-[color-mix(in_srgb,#12081f_96%,#000)] shadow-[0_-12px_60px_rgba(0,0,0,0.55)] sm:rounded-3xl ${
              readingEntered ? "translate-y-0 sm:scale-100" : "translate-y-4 sm:scale-95"
            } transition-transform duration-200 ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header lecture */}
            <div
              className="shrink-0 border-b border-[color-mix(in_srgb,var(--fn-purple)_22%,transparent)] px-5 py-5 sm:px-6"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--fn-purple) 22%, transparent), rgba(15,17,22,0.85))",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <AvatarInitials pseudo={readingReview.pseudo} size="lg" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                      Témoignage TENF
                    </p>
                    <h3
                      id="avis-reading-title"
                      className="mt-0.5 text-xl font-extrabold text-white sm:text-2xl"
                    >
                      {readingReview.pseudo}
                    </h3>
                    <p className="mt-1 text-xs text-white/70">
                      {formatLongDate(readingReview.created_at)}
                    </p>
                    <div className="mt-2">
                      <HeartsBadge hearts={Number(readingReview.hearts || 0)} size="md" />
                    </div>
                  </div>
                </div>
                <button
                  ref={closeReadingButtonRef}
                  type="button"
                  onClick={() => setReadingReview(null)}
                  className="rounded-xl border border-white/25 bg-black/25 p-2 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  aria-label="Fermer la lecture"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Corps lecture */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-6 sm:px-8">
              <figure className="space-y-4">
                <Quote
                  className="h-10 w-10 text-[color-mix(in_srgb,var(--fn-purple)_55%,transparent)]"
                  aria-hidden
                />
                <blockquote
                  className="rounded-2xl border p-4 sm:p-6"
                  style={{
                    borderColor: "color-mix(in srgb, var(--fn-purple) 24%, var(--color-border))",
                    backgroundColor: "color-mix(in srgb, #0a0612 88%, transparent)",
                  }}
                >
                  <ReviewMessageMarkdown
                    source={readingReview.message}
                    className="text-base leading-7 text-[color-mix(in_srgb,var(--color-text)_98%,#e9d5ff)]"
                  />
                </blockquote>
                <figcaption className="flex flex-wrap items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                    style={{
                      borderColor: "color-mix(in srgb, var(--fn-purple) 30%, var(--color-border))",
                      backgroundColor: "color-mix(in srgb, var(--fn-purple) 10%, transparent)",
                      color: "#e9d5ff",
                    }}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                    Témoignage relu avant publication
                  </span>
                </figcaption>
              </figure>
            </div>

            {/* Footer lecture */}
            <div
              className="shrink-0 border-t px-5 py-4 sm:px-6"
              style={{
                borderColor: "color-mix(in srgb, var(--fn-purple) 18%, transparent)",
                backgroundColor: "color-mix(in srgb, #0a0612 92%, transparent)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Tu veux raconter ton histoire à ton tour ?
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setReadingReview(null)}
                    className={`${fnStyles.fnBtnGhost}`}
                  >
                    Fermer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReadingReview(null);
                      openModal();
                    }}
                    className={fnStyles.fnBtnPrimary}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden />
                    Partager mon expérience
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ============================================================
// Sous-composants
// ============================================================
function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}) {
  return (
    <article
      className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} relative overflow-hidden border-[color-mix(in_srgb,var(--fn-purple)_20%,var(--color-border))]`}
    >
      <Icon
        className="absolute -right-2 -top-2 h-14 w-14 text-[color-mix(in_srgb,var(--fn-purple)_18%,transparent)]"
        aria-hidden
      />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.1em] text-[color-mix(in_srgb,var(--fn-purple)_75%,#fff)]">
        {label}
      </p>
      <p className="relative mt-1 text-2xl font-bold tabular-nums text-[var(--color-text)]">{value}</p>
      <p className="relative mt-2 text-xs leading-snug text-[var(--color-text-secondary)]">{hint}</p>
    </article>
  );
}

function ReassuranceCard({
  card,
}: {
  card: { icon: LucideIcon; title: string; text: string; tone: string };
}) {
  const Icon = card.icon;
  return (
    <article
      className="group h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(0,0,0,0.35)]"
      style={{
        borderColor: `color-mix(in srgb, ${card.tone} 30%, var(--color-border))`,
        background: `linear-gradient(160deg, color-mix(in srgb, ${card.tone} 10%, transparent), var(--color-card))`,
      }}
    >
      <span
        className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl transition group-hover:scale-110"
        style={{
          backgroundColor: `color-mix(in srgb, ${card.tone} 20%, transparent)`,
          color: card.tone,
        }}
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-base font-bold leading-tight sm:text-lg" style={{ color: "var(--color-text)" }}>
        {card.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{card.text}</p>
    </article>
  );
}

function AvatarInitials({ pseudo, size = "md" }: { pseudo: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm";
  const tone = pseudoColor(pseudo);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl font-extrabold ${dim}`}
      style={{
        background: `linear-gradient(160deg, ${tone}, color-mix(in srgb, ${tone} 55%, #000))`,
        color: "white",
        boxShadow: `0 8px 20px color-mix(in srgb, ${tone} 35%, transparent)`,
      }}
      aria-hidden
    >
      {getInitials(pseudo)}
    </span>
  );
}

function ReviewCard({ review, onRead }: { review: Review; onRead: () => void }) {
  const { excerpt, isTruncated } = shortenForExcerpt(review.message);
  return (
    <article
      className={`${fnStyles.fnCard} ${fnStyles.fnCardInteractive} ${fnStyles.fnCardPad} group relative flex h-full flex-col`}
    >
      <Quote
        className="absolute right-3 top-3 h-9 w-9 text-[color-mix(in_srgb,var(--fn-purple)_18%,transparent)] transition group-hover:rotate-6"
        aria-hidden
      />
      <header className="flex items-start gap-3">
        <AvatarInitials pseudo={review.pseudo} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--color-text)] sm:text-base">
            {review.pseudo}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            {formatLongDate(review.created_at)}
          </p>
        </div>
        <HeartsBadge hearts={Number(review.hearts || 0)} size="sm" />
      </header>

      <div className="mt-3 flex-1">
        <ReviewMessageMarkdown
          source={excerpt}
          className="text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-text-secondary)_98%,#e9d5ff)]"
        />
      </div>

      <button
        type="button"
        onClick={onRead}
        className={`${fnStyles.fnFlowLink} mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400`}
        aria-label={`Lire le témoignage complet de ${review.pseudo}`}
      >
        {isTruncated ? "Lire le témoignage complet" : "Voir en grand"}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </button>
    </article>
  );
}

function FeaturedCard({ review, onOpen }: { review: Review; onOpen: () => void }) {
  const { excerpt } = shortenForExcerpt(review.message, 200);
  return (
    <article
      className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} relative flex h-full flex-col overflow-hidden border-[color-mix(in_srgb,var(--fn-purple)_24%,var(--color-border))] bg-[color-mix(in_srgb,#0a0612_88%,transparent)]`}
    >
      <Quote
        className="absolute -right-1 -top-1 h-16 w-16 rotate-12 text-[color-mix(in_srgb,var(--fn-purple)_25%,transparent)]"
        aria-hidden
      />
      <header className="relative mb-3 flex items-start gap-3">
        <AvatarInitials pseudo={review.pseudo} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--color-text)]">{review.pseudo}</p>
          <p className="text-[11px] text-[var(--color-text-secondary)]">
            {formatLongDate(review.created_at)}
          </p>
        </div>
        <HeartsBadge hearts={Number(review.hearts || 0)} size="sm" />
      </header>
      <div className="relative flex-1 text-sm">
        <ReviewMessageMarkdown
          source={excerpt}
          className="text-[color-mix(in_srgb,var(--color-text-secondary)_98%,#ddd6fe)]"
        />
      </div>
      <button
        type="button"
        onClick={onOpen}
        className={`${fnStyles.fnFlowLink} relative mt-3 inline-flex items-center gap-1 self-start text-xs font-semibold text-[var(--color-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400`}
        aria-label={`Lire le témoignage complet de ${review.pseudo}`}
      >
        Lire le témoignage complet
        <ArrowRight className="h-3 w-3" aria-hidden />
      </button>
    </article>
  );
}

function ReviewCardSkeleton() {
  return (
    <div
      className={`${fnStyles.fnCard} ${fnStyles.fnCardPad} flex h-full animate-pulse flex-col gap-3`}
      aria-hidden
    >
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 rounded-2xl bg-white/10" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="h-2.5 w-1/4 rounded bg-white/5" />
        </div>
      </div>
      <div className="h-2 w-full rounded bg-white/5" />
      <div className="h-2 w-11/12 rounded bg-white/5" />
      <div className="h-2 w-10/12 rounded bg-white/5" />
      <div className="h-2 w-9/12 rounded bg-white/5" />
    </div>
  );
}

function EmptyState({
  filtersActive,
  onReset,
  onOpenForm,
}: {
  filtersActive: boolean;
  onReset: () => void;
  onOpenForm: () => void;
}) {
  return (
    <div
      className={`${fnStyles.fnMutedCard} flex flex-col items-start gap-4 px-5 py-10 text-left sm:items-center sm:text-center`}
    >
      <span
        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl"
        style={{
          backgroundColor: "color-mix(in srgb, var(--fn-purple) 18%, transparent)",
          color: "#d8b4fe",
        }}
        aria-hidden
      >
        <MessageSquare className="h-6 w-6" />
      </span>
      <div className="space-y-1">
        <p className="text-base font-bold text-[var(--color-text)]">
          {filtersActive ? "Aucun témoignage ne correspond à ce filtre." : "La page attend ses premiers retours."}
        </p>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
          {filtersActive
            ? "Essaie de relâcher la note minimum ou de changer ta recherche — les retours sont peut-être ailleurs."
            : "Sois la première personne à raconter ton histoire : ton mot peut faire toute la différence pour les prochains arrivants."}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {filtersActive ? (
          <button type="button" onClick={onReset} className={fnStyles.fnBtnGhost}>
            <X className="h-4 w-4" aria-hidden />
            Réinitialiser les filtres
          </button>
        ) : null}
        <button type="button" onClick={onOpenForm} className={fnStyles.fnBtnPrimary}>
          <MessageSquare className="h-4 w-4" aria-hidden />
          Partager mon expérience
        </button>
      </div>
    </div>
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
          aria-hidden
        />
      ))}
    </span>
  );
}
