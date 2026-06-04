"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  ImageOff,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  Pause,
  Play,
  Send,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import RgpdConsentCheckbox from "@/components/legal/RgpdConsentCheckbox";
import { PRIVACY_CONSENT_ERROR_FORM } from "@/lib/legal/privacyConsent";

// ============================================================
// Types & constantes
// ============================================================
type QuickResponse = "interested" | "more_info" | "maybe" | "not_for_me";
type ProfileType = "createur" | "membre" | "autre";

type InspirationItem = {
  id: string;
  title: string;
  category: string;
  description?: string;
  image_url: string;
};

const CONDITIONS_OPTIONS = [
  "Budget accessible",
  "Logement compris",
  "Transport facilité",
  "Dates adaptées",
  "Activités communauté",
  "Parc inclus",
];

const quickButtons: Array<{ key: QuickResponse; label: string; tone: string; emoji: string }> = [
  { key: "interested", label: "Je suis chaud·e", tone: "#22c55e", emoji: "🙌" },
  { key: "more_info", label: "Je veux plus d'infos", tone: "#38bdf8", emoji: "📝" },
  { key: "maybe", label: "Ça me plaît, je réfléchis", tone: "#a78bfa", emoji: "🤔" },
  { key: "not_for_me", label: "Ce n'est pas pour moi", tone: "#94a3b8", emoji: "🙏" },
];

const faqItems = [
  {
    q: "Où se déroulera le projet ?",
    a: "Le projet est imaginé autour de PortAventura et d'un cadre convivial à proximité. Le lieu exact sera confirmé selon l'organisation finale.",
  },
  {
    q: "Le projet est-il déjà confirmé ?",
    a: "Pas encore totalement. Cette page sert justement à mesurer l'intérêt réel de la communauté pour avancer de manière concrète.",
  },
  {
    q: "Qui pourra participer ?",
    a: "L'objectif est d'ouvrir le projet aux membres TENF, créateurs et personnes proches de la communauté, selon le cadre retenu.",
  },
  {
    q: "Faut-il être streamer ?",
    a: "Non, pas obligatoirement. TENF veut garder un esprit communautaire et inclusif — il faut juste être à l'aise avec l'idée de partager un séjour entre membres.",
  },
  {
    q: "Comment recevoir les prochaines informations ?",
    a: "Clique sur « Réponse rapide » et laisse un contact. Tu seras prévenu·e dès qu'une étape importante avance.",
  },
  {
    q: "Le programme est-il définitif ?",
    a: "Non, il est indicatif. Il évoluera selon le nombre de participants, les retours et les contraintes d'organisation.",
  },
];

const anchorLinks = [
  { href: "#concept", label: "Concept" },
  { href: "#experience", label: "Expérience" },
  { href: "#programme", label: "Programme" },
  { href: "#galerie", label: "Galerie" },
  { href: "#participation", label: "Je participe" },
  { href: "#faq", label: "FAQ" },
] as const;

// ============================================================
// Wrapper fluide (pleine largeur scalable)
// ============================================================
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--nfa-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--nfa-px)",
  paddingRight: "var(--nfa-px)",
  paddingTop: "clamp(0.75rem, 1.5vw, 1.5rem)",
  paddingBottom: "clamp(2rem, 3vw, 3rem)",
};

const PAGE_INNER_STYLE: CSSProperties = {
  maxWidth: "min(120rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

// ============================================================
// Sous-composants utilitaires
// ============================================================
function SectionTitle({
  id,
  kicker,
  title,
  subtitle,
}: {
  id?: string;
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div id={id} className="space-y-2">
      {kicker ? (
        <p
          className="text-sm font-bold uppercase tracking-[0.14em]"
          style={{ color: "rgba(216,180,254,0.9)" }}
        >
          {kicker}
        </p>
      ) : null}
      <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: "var(--color-text)" }}>
        {title}
      </h2>
      {subtitle ? (
        <p className="max-w-3xl text-sm leading-relaxed sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

type IconType = React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

function ParcoursCard({
  href,
  Icon,
  title,
  desc,
  tone,
  cta,
}: {
  href: string;
  Icon: IconType;
  title: string;
  desc: string;
  tone: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
      style={{
        borderColor: `color-mix(in srgb, ${tone} 35%, var(--color-border))`,
        backgroundColor: "var(--color-bg)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl transition group-hover:scale-105"
          style={{ backgroundColor: `color-mix(in srgb, ${tone} 22%, transparent)` }}
          aria-hidden
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <p className="text-sm font-bold sm:text-base" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
      </div>
      <p className="text-xs leading-snug sm:text-sm" style={{ color: "var(--color-text-secondary)" }}>
        {desc}
      </p>
      <span
        className="mt-3 inline-flex items-center gap-1 text-xs font-semibold transition group-hover:gap-2"
        style={{ color: tone }}
      >
        {cta}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </span>
    </Link>
  );
}

// ============================================================
// Page
// ============================================================
export default function NewFamilyAventuraPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"info" | "success" | "error">("info");
  const [sending, setSending] = useState(false);
  const [inspiration, setInspiration] = useState<InspirationItem[]>([]);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [quickChoice, setQuickChoice] = useState<QuickResponse>("interested");
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [form, setForm] = useState({
    pseudo: "",
    contact: "",
    profileType: "membre" as ProfileType,
    interestReason: "",
    comment: "",
    conditions: [] as string[],
    privacyConsent: false,
  });

  const displayedInspiration = useMemo(() => inspiration.slice(0, 6), [inspiration]);
  const heroPhoto = displayedInspiration[heroSlideIndex] ?? displayedInspiration[0];

  // ---- reduced motion
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setPrefersReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  // ---- garde l'index dans les bornes
  useEffect(() => {
    if (heroSlideIndex >= displayedInspiration.length) {
      setHeroSlideIndex(0);
    }
  }, [heroSlideIndex, displayedInspiration.length]);

  // ---- autoplay du carrousel
  useEffect(() => {
    if (displayedInspiration.length <= 1 || isHeroPaused || prefersReducedMotion) return;
    const interval = window.setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % displayedInspiration.length);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [displayedInspiration.length, isHeroPaused, prefersReducedMotion]);

  // ---- préchargement de la slide suivante
  useEffect(() => {
    if (displayedInspiration.length <= 1) return;
    const next = displayedInspiration[(heroSlideIndex + 1) % displayedInspiration.length];
    if (!next?.image_url) return;
    const img = new window.Image();
    img.src = next.image_url;
  }, [displayedInspiration, heroSlideIndex]);

  // ---- chargement de la galerie d'inspiration
  useEffect(() => {
    async function loadInspiration() {
      try {
        const response = await fetch("/api/new-family-aventura/inspiration", {
          cache: "no-store",
        });
        const data = await response.json();
        setInspiration((data.items || []) as InspirationItem[]);
      } catch (error) {
        console.error(
          "[new-family-aventura] Erreur chargement galerie inspiration:",
          error
        );
      }
    }
    loadInspiration();
  }, []);

  // ---- scroll-spy sur la nav sticky
  useEffect(() => {
    const ids = anchorLinks.map((a) => a.href.replace("#", ""));
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target as HTMLElement)
          .sort(
            (a, b) =>
              a.getBoundingClientRect().top - b.getBoundingClientRect().top
          );
        if (visible.length === 0) return;
        setActiveAnchor(visible[0]?.id || null);
      },
      { rootMargin: "-25% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function showNotice(message: string, tone: "info" | "success" | "error" = "info") {
    setNotice(message);
    setNoticeTone(tone);
  }

  function toggleCondition(condition: string) {
    setForm((prev) => {
      const exists = prev.conditions.includes(condition);
      return {
        ...prev,
        conditions: exists
          ? prev.conditions.filter((item) => item !== condition)
          : [...prev.conditions, condition],
      };
    });
  }

  async function submitInterest(source: string) {
    if (!form.pseudo.trim()) {
      showNotice("Il nous faut au moins ton pseudo pour t'identifier — promis, rien de plus.", "error");
      return;
    }
    if (!form.privacyConsent) {
      setConsentError(PRIVACY_CONSENT_ERROR_FORM);
      showNotice(PRIVACY_CONSENT_ERROR_FORM, "error");
      return;
    }

    setSending(true);
    setNotice(null);
    setConsentError(null);
    try {
      const response = await fetch("/api/new-family-aventura/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pseudo: form.pseudo,
          contact: form.contact,
          profile_type: form.profileType,
          quick_response: quickChoice,
          interest_reason: form.interestReason,
          conditions: form.conditions,
          comment: form.comment,
          privacyConsent: true,
          source,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(data.error || "Impossible d'envoyer ta réponse pour le moment.", "error");
        return;
      }
      showNotice("Merci ! Ta réponse a bien été enregistrée — on te tient au courant. 💜", "success");
      setIsModalOpen(false);
      setForm({
        pseudo: "",
        contact: "",
        profileType: "membre",
        interestReason: "",
        comment: "",
        conditions: [],
        privacyConsent: false,
      });
      setQuickChoice("interested");
    } catch (error) {
      console.error("[new-family-aventura] submit error:", error);
      showNotice("Petit souci réseau. Réessaie dans un instant.", "error");
    } finally {
      setSending(false);
    }
  }

  async function onFormSubmit(event: FormEvent) {
    event.preventDefault();
    await submitInterest("section_participation");
  }

  function handleAnchorClick(href: string) {
    return (event: React.MouseEvent<HTMLAnchorElement>) => {
      const id = href.replace("#", "");
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      if (typeof history !== "undefined") {
        history.replaceState(null, "", href);
      }
    };
  }

  const goPrev = () =>
    setHeroSlideIndex(
      (prev) => (prev - 1 + displayedInspiration.length) % Math.max(1, displayedInspiration.length)
    );
  const goNext = () =>
    setHeroSlideIndex(
      (prev) => (prev + 1) % Math.max(1, displayedInspiration.length)
    );

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-bg)", ...PAGE_OUTER_STYLE }}
    >
      <div className="flex flex-col gap-8 sm:gap-10" style={PAGE_INNER_STYLE}>
        {/* ---------- NAV STICKY (scroll-spy) ---------- */}
        <nav
          aria-label="Sommaire de la page"
          className="sticky top-20 z-30 overflow-x-auto rounded-2xl border p-2 sm:p-3"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor:
              "color-mix(in srgb, var(--color-card) 90%, transparent)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <ul className="-mx-1 flex gap-2 px-1 pb-1 scroll-smooth snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
            {anchorLinks.map((link) => {
              const id = link.href.replace("#", "");
              const isActive = activeAnchor === id;
              return (
                <li key={link.href} className="snap-start">
                  <a
                    href={link.href}
                    onClick={handleAnchorClick(link.href)}
                    aria-current={isActive ? "true" : undefined}
                    className="inline-flex min-h-[36px] items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:text-sm"
                    style={{
                      borderColor: isActive
                        ? "rgba(145,70,255,0.6)"
                        : "var(--color-border)",
                      color: isActive ? "white" : "var(--color-text)",
                      backgroundColor: isActive
                        ? "rgba(145,70,255,0.22)"
                        : "var(--color-card)",
                      boxShadow: isActive
                        ? "0 6px 18px rgba(145,70,255,0.25)"
                        : "none",
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------- PARCOURS IRL RECOMMANDÉ ---------- */}
        <section
          aria-labelledby="nfa-parcours-title"
          className="rounded-2xl border p-4 sm:p-5"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(145,70,255,0.18)" }}
              aria-hidden
            >
              <Sparkles
                className="h-4 w-4"
                style={{ color: "rgba(216,180,254,1)" }}
              />
            </span>
            <p
              id="nfa-parcours-title"
              className="text-sm font-bold sm:text-base"
              style={{ color: "var(--color-text)" }}
            >
              Parcours IRL recommandé
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            <ParcoursCard
              href="/new-family-aventura/infos-pratiques"
              Icon={Info}
              title="Infos pratiques"
              desc="Transport, hébergement, budget et cadre sécurité — tout ce que tu dois savoir avant de candidater."
              tone="rgba(145,70,255,1)"
              cta="Ouvrir les infos"
            />
            <ParcoursCard
              href="/new-family-aventura/faq"
              Icon={HelpCircle}
              title="FAQ IRL"
              desc="Les réponses rapides aux questions les plus posées avant de se lancer."
              tone="rgba(56,189,248,1)"
              cta="Voir la FAQ"
            />
            <ParcoursCard
              href="/new-family-aventura/questions"
              Icon={MessageCircle}
              title="Questions aux admins"
              desc="Pose une question personnelle et reçois une réponse structurée du staff."
              tone="rgba(34,197,94,1)"
              cta="Poser ma question"
            />
          </div>
        </section>

        {/* ---------- HERO ---------- */}
        <section
          aria-labelledby="nfa-hero-title"
          className="grid grid-cols-1 items-stretch gap-4 sm:gap-6 lg:grid-cols-[1.2fr_1fr]"
        >
          <div
            className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10"
            style={{
              borderColor: "rgba(145,70,255,0.35)",
              background:
                "linear-gradient(135deg, rgba(145,70,255,0.22), rgba(145,70,255,0.06) 50%, rgba(15,17,22,0.6))",
            }}
          >
            <div
              className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(236,72,153,0.22)" }}
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 -left-20 h-44 w-44 rounded-full blur-3xl"
              style={{ backgroundColor: "rgba(56,189,248,0.22)" }}
              aria-hidden
            />

            <div className="relative space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] sm:text-xs"
                  style={{
                    backgroundColor: "rgba(145,70,255,0.22)",
                    color: "#d8b4fe",
                  }}
                >
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Expérience IRL TENF
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
                  style={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "var(--color-text-secondary)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                  }}
                >
                  <Calendar className="h-3 w-3" aria-hidden />
                  Mai / Juin 2027
                </span>
              </div>

              <h1
                id="nfa-hero-title"
                className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--color-text)" }}
              >
                New Family Aventura 2027
              </h1>
              <p
                className="text-base font-semibold leading-relaxed sm:text-xl"
                style={{ color: "var(--color-text-secondary)" }}
              >
                On sort du virtuel : quelques jours pour vivre TENF en vrai, ensemble.
              </p>
              <p
                className="max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Le temps d&apos;un séjour, la communauté TENF se retrouve en réel — entre parc, moments chill, soirées et souvenirs qui resteront. Ce n&apos;est pas qu&apos;un voyage : c&apos;est une expérience humaine, pensée pour celles et ceux qui partagent l&apos;esprit New Family.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Link
                  href="/new-family-aventura/infos-pratiques"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
                  }}
                >
                  Je veux participer
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
                <Link
                  href="/new-family-aventura/questions"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Poser une question
                </Link>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "rgba(145,70,255,0.45)",
                    color: "#d8b4fe",
                    backgroundColor: "rgba(145,70,255,0.12)",
                  }}
                >
                  <Send className="h-4 w-4" aria-hidden />
                  Réponse rapide (30 sec)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3">
                {[
                  { label: "Période", value: "Mai / Juin 2027", Icon: Calendar },
                  { label: "Format", value: "IRL communauté", Icon: Users },
                  { label: "Budget cible", value: "200 – 450 €", Icon: Wallet },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5"
                    style={{
                      borderColor: "rgba(255,255,255,0.16)",
                      backgroundColor: "rgba(15,17,22,0.55)",
                    }}
                  >
                    <p
                      className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.1em]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <item.Icon className="h-3 w-3" aria-hidden />
                      {item.label}
                    </p>
                    <p
                      className="mt-0.5 text-sm font-semibold sm:text-base"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carrousel inspiration */}
          <div
            className="relative overflow-hidden rounded-3xl border"
            style={{
              borderColor: "var(--color-border)",
              minHeight: 320,
              backgroundColor: "var(--color-card)",
            }}
            onMouseEnter={() => setIsHeroPaused(true)}
            onMouseLeave={() => setIsHeroPaused(false)}
            onFocus={() => setIsHeroPaused(true)}
            onBlur={() => setIsHeroPaused(false)}
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStartX === null || displayedInspiration.length <= 1) {
                setTouchStartX(null);
                return;
              }
              const endX = event.changedTouches[0]?.clientX ?? touchStartX;
              const diff = endX - touchStartX;
              if (Math.abs(diff) < 30) {
                setTouchStartX(null);
                return;
              }
              if (diff < 0) {
                goNext();
              } else {
                goPrev();
              }
              setTouchStartX(null);
            }}
            role="region"
            aria-roledescription="carousel"
            aria-label="Photos d'inspiration du projet"
          >
            {displayedInspiration.length > 0 ? (
              displayedInspiration.map((photo, index) => (
                <div
                  key={photo.id}
                  className="absolute inset-0 transition-opacity duration-1000"
                  style={{
                    opacity: index === heroSlideIndex ? 1 : 0,
                    backgroundImage: `linear-gradient(180deg, rgba(10,12,16,0.2), rgba(10,12,16,0.8)), url(${photo.image_url})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                  aria-hidden={index !== heroSlideIndex}
                />
              ))
            ) : (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background:
                    "radial-gradient(circle at 20% 20%, rgba(145,70,255,0.32), transparent 45%), radial-gradient(circle at 80% 30%, rgba(56,189,248,0.22), transparent 40%), linear-gradient(135deg, #1a1328, #0f1116)",
                }}
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <Camera className="h-10 w-10 text-white/30" aria-hidden />
                  <p className="text-sm text-white/60">
                    La galerie arrive bientôt. <br className="hidden sm:block" />
                    Reviens d&apos;ici quelques jours !
                  </p>
                </div>
              </div>
            )}

            <div className="absolute inset-0 flex flex-col justify-end p-6">
              <h3 className="mb-2 text-xl font-bold" style={{ color: "var(--color-text)" }}>
                {heroPhoto?.title || "Ambiance voyage & communauté"}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {heroPhoto?.description ||
                  "Une expérience réelle pour prolonger l'esprit TENF."}
              </p>

              {/* Contrôles carrousel */}
              {displayedInspiration.length > 1 ? (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrev}
                    aria-label="Photo précédente"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsHeroPaused((p) => !p)}
                    aria-label={isHeroPaused ? "Reprendre la lecture automatique" : "Mettre en pause la lecture automatique"}
                    aria-pressed={isHeroPaused}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {isHeroPaused ? (
                      <Play className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Pause className="h-3.5 w-3.5" aria-hidden />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    aria-label="Photo suivante"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white transition hover:bg-black/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                  <div
                    className="ml-2 flex items-center gap-1.5"
                    role="tablist"
                    aria-label="Photos"
                  >
                    {displayedInspiration.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        role="tab"
                        onClick={() => setHeroSlideIndex(index)}
                        aria-label={`Afficher la photo ${index + 1} sur ${displayedInspiration.length}`}
                        aria-selected={index === heroSlideIndex}
                        className="h-1.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        style={{
                          width: index === heroSlideIndex ? "1.5rem" : "0.6rem",
                          backgroundColor:
                            index === heroSlideIndex
                              ? "rgba(255,255,255,0.95)"
                              : "rgba(255,255,255,0.35)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* ---------- POURQUOI + TIMELINE ---------- */}
        <section className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <article
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: "rgba(244,63,94,0.18)" }}
                aria-hidden
              >
                💜
              </span>
              <h2
                className="text-lg font-bold sm:text-xl"
                style={{ color: "var(--color-text)" }}
              >
                Pourquoi participer ?
              </h2>
            </div>
            <ul className="grid gap-2" role="list">
              {[
                { icon: "🤝", text: "Rencontrer la communauté en vrai." },
                { icon: "🔗", text: "Créer des liens forts au-delà de Twitch." },
                { icon: "🎥", text: "Vivre une expérience unique entre streamers." },
                { icon: "🎢", text: "Partager des moments fun (PortAventura, soirées…)." },
                { icon: "✨", text: "Repartir avec des souvenirs qui restent." },
              ].map((item) => (
                <li
                  key={item.text}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span aria-hidden className="text-lg leading-none">
                    {item.icon}
                  </span>
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </article>

          <article
            className="rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                style={{ backgroundColor: "rgba(56,189,248,0.18)" }}
                aria-hidden
              >
                🗓️
              </span>
              <h2
                className="text-lg font-bold sm:text-xl"
                style={{ color: "var(--color-text)" }}
              >
                Les étapes du projet
              </h2>
            </div>
            <ol className="grid gap-2" role="list">
              {[
                "Annonce et ouverture des infos.",
                "Pré-inscriptions et organisation.",
                "Validation des participants.",
                "Voyage et expérience IRL.",
              ].map((step, idx) => (
                <li
                  key={step}
                  className="flex items-start gap-3 rounded-lg border px-3 py-2 text-sm transition hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <p
              className="mt-3 text-xs italic"
              style={{ color: "var(--color-text-secondary)" }}
            >
              On est encore à l&apos;étape 1 — l&apos;intérêt que tu exprimes ici aide à faire avancer la 2.
            </p>
          </article>
        </section>

        {/* ---------- CONCEPT ---------- */}
        <section id="concept" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="Le projet"
            title="Le concept en quelques mots"
            subtitle="Un séjour IRL pensé par TENF pour permettre à ses membres et créateurs de partager un vrai moment ensemble — entre détente, fun, découvertes et souvenirs."
          />
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
            {[
              { label: "Communauté", emoji: "👥", tone: "rgba(145,70,255,0.35)" },
              { label: "Voyage", emoji: "✈️", tone: "rgba(56,189,248,0.35)" },
              { label: "Détente", emoji: "🌅", tone: "rgba(34,197,94,0.35)" },
              { label: "Parc", emoji: "🎢", tone: "rgba(245,158,11,0.35)" },
              { label: "Souvenirs", emoji: "📸", tone: "rgba(244,63,94,0.35)" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center rounded-xl border px-3 py-5 text-center transition hover:-translate-y-1 hover:shadow-md"
                style={{
                  borderColor: `color-mix(in srgb, ${item.tone} 40%, var(--color-border))`,
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              >
                <span aria-hidden className="mb-2 text-3xl">
                  {item.emoji}
                </span>
                <span className="text-sm font-bold">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- EXPÉRIENCE ---------- */}
        <section id="experience" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="Le contenu"
            title="Une expérience pensée pour la communauté"
            subtitle="Quatre piliers qui structurent l'aventure : du fun, de la rencontre, du confort et de la chaleur humaine."
          />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Parc d'attraction",
                text: "Une journée fort en sensations à PortAventura pour vivre un moment intense ensemble.",
                emoji: "🎢",
                tone: "rgba(245,158,11,0.35)",
              },
              {
                title: "Hébergement & vie commune",
                text: "Un cadre convivial pour partager des temps de repos, de discussion et de chill collectif.",
                emoji: "🏡",
                tone: "rgba(34,197,94,0.35)",
              },
              {
                title: "Moments communauté",
                text: "Des temps pour se rencontrer, échanger, jouer, rire et créer des souvenirs durables.",
                emoji: "🎉",
                tone: "rgba(145,70,255,0.35)",
              },
              {
                title: "Ambiance New Family",
                text: "Un projet fidèle à l'esprit TENF : humain, accessible, chaleureux et communautaire.",
                emoji: "💜",
                tone: "rgba(244,63,94,0.35)",
              },
            ].map((card) => (
              <article
                key={card.title}
                className="group h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
                style={{
                  borderColor: `color-mix(in srgb, ${card.tone} 30%, var(--color-border))`,
                  backgroundColor: "var(--color-card)",
                }}
              >
                <span
                  className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-2xl transition group-hover:scale-110"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${card.tone} 22%, transparent)`,
                  }}
                  aria-hidden
                >
                  {card.emoji}
                </span>
                <h3
                  className="mb-2 text-base font-bold sm:text-lg"
                  style={{ color: "var(--color-text)" }}
                >
                  {card.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {card.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- PROGRAMME ---------- */}
        <section id="programme" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="Le déroulé"
            title="Un aperçu du séjour"
            subtitle="Programme indicatif — il évoluera selon l'organisation finale et le nombre de participants."
          />
          <ol
            className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4"
            role="list"
          >
            {[
              { day: "Jour 1", label: "Arrivée et installation", emoji: "🛬" },
              { day: "Jour 2", label: "Journée parc", emoji: "🎢" },
              { day: "Jour 3", label: "Moments communauté · détente · activités", emoji: "🎮" },
              { day: "Jour 4", label: "Temps libre et départ", emoji: "👋" },
            ].map((item, idx) => (
              <li
                key={item.day}
                className="group relative rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                  color: "var(--color-text)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "rgba(216,180,254,0.9)" }}
                  >
                    {item.day}
                  </span>
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                </div>
                <p className="mt-2 text-2xl transition-transform group-hover:scale-110" aria-hidden>
                  {item.emoji}
                </p>
                <p className="mt-2 text-sm font-semibold leading-snug">{item.label}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- GALERIE ---------- */}
        <section id="galerie" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="Inspirations"
            title="L'ambiance qu'on imagine pour le projet"
            subtitle="Des photos qui donnent une idée du climat qu'on veut créer ensemble."
          />
          {inspiration.length === 0 ? (
            <div
              className="flex flex-col items-start gap-3 rounded-2xl border p-5 text-sm sm:p-6"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: "rgba(145,70,255,0.15)" }}
                aria-hidden
              >
                <ImageOff
                  className="h-5 w-5"
                  style={{ color: "rgba(216,180,254,1)" }}
                />
              </span>
              <p>
                Aucune photo d&apos;inspiration pour le moment — l&apos;équipe ajoute des visuels au fur et à mesure.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {inspiration.map((item) => (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.45)]"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-card)",
                  }}
                >
                  <div
                    className="h-44 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url(${item.image_url})` }}
                    role="img"
                    aria-label={item.title}
                  />
                  <div className="space-y-1 p-4">
                    <p
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "rgba(216,180,254,0.9)" }}
                    >
                      {item.category}
                    </p>
                    <h3
                      className="text-base font-bold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {item.title}
                    </h3>
                    {item.description ? (
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {item.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* ---------- PARTICIPATION ---------- */}
        <section id="participation" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="Ton mot à dire"
            title="Le projet t'intéresse ?"
            subtitle="Cette page nous sert à mesurer l'intérêt réel de la communauté. Ta réponse — même un simple « peut-être » — fait avancer le projet."
          />

          {/* Choix rapide */}
          <div
            role="tablist"
            aria-label="Choisir une réponse rapide"
            className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2"
          >
            {quickButtons.map((button) => {
              const isActive = quickChoice === button.key;
              return (
                <button
                  key={button.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setQuickChoice(button.key)}
                  className="flex min-h-[56px] items-center gap-2 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: isActive ? button.tone : "var(--color-border)",
                    color: "var(--color-text)",
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${button.tone} 14%, transparent)`
                      : "var(--color-card)",
                    boxShadow: isActive
                      ? `0 6px 18px color-mix(in srgb, ${button.tone} 30%, transparent)`
                      : "none",
                  }}
                >
                  <span aria-hidden className="text-xl">
                    {button.emoji}
                  </span>
                  <span>{button.label}</span>
                </button>
              );
            })}
          </div>

          {/* Formulaire */}
          <form
            onSubmit={onFormSubmit}
            className="space-y-4 rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nfa-pseudo"
                  className="mb-1 block text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Pseudo / nom <span style={{ color: "#f87171" }}>*</span>
                </label>
                <input
                  id="nfa-pseudo"
                  required
                  value={form.pseudo}
                  onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                  placeholder="Ex : MonPseudoTwitch"
                />
              </div>
              <div>
                <label
                  htmlFor="nfa-contact"
                  className="mb-1 block text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Discord ou moyen de contact{" "}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    (optionnel)
                  </span>
                </label>
                <input
                  id="nfa-contact"
                  value={form.contact}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                  placeholder="Ex : monpseudo#0001"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="nfa-profile"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Je suis :
              </label>
              <select
                id="nfa-profile"
                value={form.profileType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, profileType: e.target.value as ProfileType }))
                }
                className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 md:w-72"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
              >
                <option value="createur">Créateur·rice</option>
                <option value="membre">Membre de la communauté</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="nfa-reason"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Ce qui t&apos;intéresse dans le projet
              </label>
              <textarea
                id="nfa-reason"
                value={form.interestReason}
                onChange={(e) => setForm((prev) => ({ ...prev, interestReason: e.target.value }))}
                className="min-h-[110px] w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                placeholder="Rencontrer la communauté, partager une expérience IRL, vivre PortAventura ensemble…"
              />
            </div>

            <fieldset>
              <legend
                className="mb-2 text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Je pourrais venir si…
              </legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {CONDITIONS_OPTIONS.map((condition) => {
                  const isChecked = form.conditions.includes(condition);
                  return (
                    <label
                      key={condition}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition hover:-translate-y-0.5"
                      style={{
                        borderColor: isChecked
                          ? "rgba(145,70,255,0.55)"
                          : "var(--color-border)",
                        backgroundColor: isChecked
                          ? "rgba(145,70,255,0.12)"
                          : "transparent",
                        color: "var(--color-text)",
                      }}
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 cursor-pointer accent-violet-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                        checked={isChecked}
                        onChange={() => toggleCondition(condition)}
                        aria-label={condition}
                      />
                      <span>{condition}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label
                htmlFor="nfa-comment"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Commentaire libre
              </label>
              <textarea
                id="nfa-comment"
                value={form.comment}
                onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="min-h-[90px] w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                placeholder="Une remarque, une suggestion, une crainte ? On t'écoute."
              />
            </div>

            <RgpdConsentCheckbox
              id="nfa-privacy-consent"
              checked={form.privacyConsent}
              onChange={(checked) => {
                setForm((prev) => ({ ...prev, privacyConsent: checked }));
                if (checked) setConsentError(null);
              }}
              disabled={sending}
              error={consentError}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="submit"
                disabled={sending}
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 10px 28px rgba(145,70,255,0.35)",
                }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                )}
                {sending ? "Envoi en cours…" : "Envoyer ma réponse"}
              </button>
              <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                Tes infos restent confidentielles, uniquement consultées par le staff.
              </p>
            </div>
          </form>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" className="scroll-mt-28 space-y-5">
          <SectionTitle
            kicker="On répond à tout"
            title="Les questions qui reviennent"
            subtitle="Une petite FAQ pour lever les doutes avant de candidater. Tu peux toujours poser ta propre question via le formulaire dédié."
          />
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-card)",
                }}
              >
                <summary
                  className="flex cursor-pointer items-start justify-between gap-3 text-sm font-bold list-none marker:hidden sm:text-base"
                  style={{ color: "var(--color-text)" }}
                >
                  <span>{item.q}</span>
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
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
          <div
            className="rounded-2xl border p-4 text-sm sm:p-5"
            style={{
              borderColor: "rgba(56,189,248,0.35)",
              backgroundColor: "rgba(56,189,248,0.08)",
              color: "var(--color-text-secondary)",
            }}
          >
            Tu as une question qui n&apos;est pas dans la liste ?{" "}
            <Link
              href="/new-family-aventura/questions"
              className="font-semibold underline-offset-2 hover:underline"
              style={{ color: "var(--color-primary)" }}
            >
              Pose-la directement aux admins
            </Link>
            .
          </div>
        </section>

        {/* ---------- CTA FINAL ---------- */}
        <section
          className="relative overflow-hidden rounded-2xl border p-6 sm:rounded-3xl sm:p-8 lg:p-10"
          style={{
            borderColor: "rgba(145,70,255,0.4)",
            background:
              "linear-gradient(135deg, rgba(145,70,255,0.18), rgba(145,70,255,0.06))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-20 -right-20 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(236,72,153,0.2)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-16 h-52 w-52 rounded-full blur-3xl"
            style={{ backgroundColor: "rgba(56,189,248,0.18)" }}
            aria-hidden
          />
          <div className="relative space-y-4">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
              style={{
                backgroundColor: "rgba(145,70,255,0.22)",
                color: "#d8b4fe",
              }}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              On se voit bientôt en vrai ?
            </span>
            <h2
              className="text-2xl font-extrabold tracking-tight sm:text-4xl"
              style={{ color: "var(--color-text)" }}
            >
              Envie de suivre le projet ?
            </h2>
            <p
              className="max-w-2xl text-sm leading-relaxed sm:text-base"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Rejoins l&apos;aventure dès maintenant et reste informé·e des prochaines étapes. Plus on est nombreuses et nombreux à montrer notre intérêt, plus le projet devient concret.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link
                href="/new-family-aventura/infos-pratiques"
                className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
                }}
              >
                Je veux participer
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </Link>
              <Link
                href="/new-family-aventura/questions"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Poser une question
              </Link>
            </div>
          </div>
        </section>

        {/* ---------- NOTICE ---------- */}
        {notice ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor:
                noticeTone === "error"
                  ? "rgba(248,113,113,0.4)"
                  : noticeTone === "success"
                  ? "rgba(52,211,153,0.4)"
                  : "rgba(145,70,255,0.4)",
              backgroundColor:
                noticeTone === "error"
                  ? "rgba(248,113,113,0.1)"
                  : noticeTone === "success"
                  ? "rgba(52,211,153,0.08)"
                  : "rgba(145,70,255,0.08)",
              color: "var(--color-text)",
            }}
          >
            <p className="leading-relaxed">{notice}</p>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Fermer le message"
              className="shrink-0 rounded-md p-1 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}
      </div>

      {/* ---------- MODAL RÉPONSE RAPIDE ---------- */}
      {isModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nfa-modal-title"
        >
          <div
            className="w-full max-w-lg space-y-4 rounded-2xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ color: "rgba(216,180,254,0.9)" }}
                >
                  Réponse rapide (30 sec)
                </p>
                <h3
                  id="nfa-modal-title"
                  className="text-xl font-extrabold"
                  style={{ color: "var(--color-text)" }}
                >
                  Partage ton intérêt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Fermer la fenêtre"
                className="rounded-md p-1.5 text-gray-400 transition hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Une réponse rapide, ton pseudo, et c&apos;est tout. Tu pourras toujours compléter le formulaire complet plus tard.
            </p>

            <div
              role="tablist"
              aria-label="Choix rapide"
              className="grid grid-cols-1 gap-2 sm:grid-cols-2"
            >
              {quickButtons.map((button) => {
                const isActive = quickChoice === button.key;
                return (
                  <button
                    key={button.key}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setQuickChoice(button.key)}
                    className="flex min-h-[48px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                    style={{
                      borderColor: isActive ? button.tone : "var(--color-border)",
                      color: "var(--color-text)",
                      backgroundColor: isActive
                        ? `color-mix(in srgb, ${button.tone} 14%, transparent)`
                        : "var(--color-surface)",
                    }}
                  >
                    <span aria-hidden className="text-lg">
                      {button.emoji}
                    </span>
                    <span className="text-sm">{button.label}</span>
                  </button>
                );
              })}
            </div>

            <div>
              <label
                htmlFor="nfa-modal-pseudo"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Ton pseudo <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                id="nfa-modal-pseudo"
                value={form.pseudo}
                onChange={(e) => setForm((prev) => ({ ...prev, pseudo: e.target.value }))}
                placeholder="Ex : MonPseudoTwitch"
                className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                autoFocus
              />
            </div>
            <RgpdConsentCheckbox
              id="nfa-modal-privacy-consent"
              checked={form.privacyConsent}
              onChange={(checked) => {
                setForm((prev) => ({ ...prev, privacyConsent: checked }));
                if (checked) setConsentError(null);
              }}
              disabled={sending}
              error={consentError}
            />

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="inline-flex min-h-[40px] items-center justify-center rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
                style={{
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                }}
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => submitInterest("hero_modal")}
                disabled={sending}
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4" aria-hidden />
                )}
                {sending ? "Envoi…" : "Valider"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
