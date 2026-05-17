"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Calendar,
  CalendarPlus,
  ExternalLink,
  Filter,
  Heart,
  HelpCircle,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircle,
  PartyPopper,
  Send,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react";
import { socialLinks } from "@/lib/socialLinks";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildEventLocationDisplay, type EventLocationLink } from "@/lib/eventLocation";

// ============================================================
// Types
// ============================================================
type EventType =
  | "Soirees jeux communautaires"
  | "Evenements speciaux"
  | "Decouverte de createurs"
  | "Autre";

type PublicEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  location?: string;
};

type CommunityProposal = {
  id: string;
  title: string;
  description: string;
  category: string;
  proposedDate?: string | null;
  status: "pending" | "approved" | "rejected" | "archived";
  votesCount: number;
  hasVoted: boolean;
  createdAt: string;
};

type FeaturedUpcomingEvent = {
  title: string;
  dateLabel: string;
  locationLabel: string;
  locationUrl?: string;
  locationDisplayLabel?: string;
  shortDescription: string;
  eventUrl: string;
  addToCalendarUrl: string;
  category?: string;
};

type CommunityIdeaCard = {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  proposedDate?: string | null;
  votesCount: number;
  potentialParticipants: number;
  hasVoted?: boolean;
};

// ============================================================
// Constantes
// ============================================================
const typeOptions: EventType[] = [
  "Soirees jeux communautaires",
  "Evenements speciaux",
  "Decouverte de createurs",
  "Autre",
];

const fallbackUpcomingEvents: FeaturedUpcomingEvent[] = [
  {
    title: "Karaoké communautaire",
    dateLabel: "Samedi 14 mars · 21h",
    locationLabel: "Discord TENF",
    shortDescription:
      "Une soirée fun pour chanter ensemble et passer un super moment.",
    eventUrl: "/evenements",
    addToCalendarUrl: "/evenements",
  },
  {
    title: "Soirée jeux communautaires",
    dateLabel: "Mercredi 19 mars · 20h30",
    locationLabel: "Vocal Discord TENF",
    shortDescription:
      "Jeux, rires et team play pour renforcer les liens entre membres.",
    eventUrl: "/evenements",
    addToCalendarUrl: "/evenements",
  },
  {
    title: "Découverte de créateurs",
    dateLabel: "Dimanche 23 mars · 18h",
    locationLabel: "Lives + Discord TENF",
    shortDescription:
      "Mise en avant de nouveaux créateurs et partage d'expérience.",
    eventUrl: "/evenements",
    addToCalendarUrl: "/evenements",
  },
];

const vibeModes = [
  {
    title: "Mode chill",
    emoji: "🌙",
    subtitle: "Ambiance détente, discussions et fun vocal.",
    gradient:
      "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(20,20,30,0.6))",
    tone: "#818cf8",
  },
  {
    title: "Mode compétition",
    emoji: "🔥",
    subtitle: "Défis, mini tournois et esprit d'équipe.",
    gradient:
      "linear-gradient(135deg, rgba(244,63,94,0.35), rgba(20,20,30,0.6))",
    tone: "#fb7185",
  },
  {
    title: "Mode créatif",
    emoji: "✨",
    subtitle: "Formats originaux et découvertes de créateurs.",
    gradient:
      "linear-gradient(135deg, rgba(145,70,255,0.38), rgba(20,20,30,0.6))",
    tone: "#a78bfa",
  },
];

const sectionAnchors = [
  { id: "prochains-evenements", label: "À venir" },
  { id: "types-evenements", label: "Formats" },
  { id: "proposer-evenement", label: "Proposer" },
  { id: "idees-communaute", label: "Idées membres" },
  { id: "rejoindre-evenements", label: "Nous rejoindre" },
] as const;

const audienceCards = [
  {
    title: "Je découvre TENF",
    desc:
      "Tu veux commencer simplement ? Regarde les événements ouverts et rejoins le Discord pour les rappels.",
    cta: "Voir le calendrier",
    href: "/evenements",
    emoji: "🌱",
    tone: "#34d399",
  },
  {
    title: "Je suis déjà membre",
    desc:
      "Tu participes déjà ? Trouve la prochaine date, ajoute-la à ton agenda et invite un·e autre membre.",
    cta: "Prochains événements",
    href: "#prochains-evenements",
    emoji: "🚀",
    tone: "#a78bfa",
  },
  {
    title: "J'ai une idée d'event",
    desc:
      "Propose un format qui te ressemble. Les meilleures idées de la communauté prennent vie ici.",
    cta: "Proposer mon idée",
    href: "#proposer-evenement",
    emoji: "💡",
    tone: "#fbbf24",
  },
] as const;

// ============================================================
// Helpers (logique préservée)
// ============================================================
function useAnimatedNumber(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const start = performance.now();
    const initial = value;
    const delta = target - initial;
    if (delta === 0) return;

    let raf = 0;
    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(initial + delta * eased));
      if (progress < 1) {
        raf = requestAnimationFrame(step);
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}

function formatShortDate(value?: string | null): string {
  if (!value) return "Date à confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date à confirmer";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function calendarUrlForEvent(event: PublicEvent): string {
  const start = new Date(event.date);
  if (Number.isNaN(start.getTime())) return "/evenements";
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const formatUtc = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = `${event.description || "Evenement communautaire TENF"}\n\n${window.location.origin}/evenements`;
  const location = event.location || "Discord TENF";
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details,
    location,
  });
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

function visualForCategory(category: string): string {
  const value = category.toLowerCase();
  if (value.includes("jeu")) return "🎮";
  if (value.includes("film")) return "🎬";
  if (value.includes("spotlight")) return "🌟";
  if (value.includes("apero")) return "🍹";
  if (value.includes("formation")) return "📚";
  if (value.includes("decouverte")) return "⭐";
  return "🎉";
}

function normalizeMarkdownForCards(value?: string): string {
  if (!value) return "";
  return value.replace(/\r\n/g, "\n").replace(/\n/g, "  \n");
}

// ============================================================
// Wrapper fluide (scalable au zoom)
// ============================================================
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--evc-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--evc-px)",
  paddingRight: "var(--evc-px)",
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
// Page
// ============================================================
export default function EvenementsCommunautairesPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [proposals, setProposals] = useState<CommunityProposal[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<"info" | "success" | "error">(
    "info"
  );
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [locationLinks, setLocationLinks] = useState<EventLocationLink[]>([]);
  const [activeVibe, setActiveVibe] = useState(0);
  const [upcomingFilter, setUpcomingFilter] = useState<string>("all");
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [activeAnchor, setActiveAnchor] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    eventType: typeOptions[0],
    description: "",
    suggestedDate: "",
  });

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoadingEvents(true);
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) throw new Error("Impossible de charger les evenements");
        const data = await response.json();
        setEvents((data.events || []) as PublicEvent[]);
      } catch (error) {
        console.error(
          "[evenements-communautaires] Erreur chargement evenements:",
          error
        );
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      setLoadingProposals(true);
      const response = await fetch("/api/events/proposals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les propositions");
      }
      setProposals((data.proposals || []) as CommunityProposal[]);
    } catch (error) {
      console.error(
        "[evenements-communautaires] Erreur chargement propositions:",
        error
      );
    } finally {
      setLoadingProposals(false);
    }
  }, []);

  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  useEffect(() => {
    async function loadLocationLinks() {
      try {
        const response = await fetch("/api/events/location-links", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = await response.json();
        setLocationLinks((data.links || []) as EventLocationLink[]);
      } catch (error) {
        console.error(
          "[evenements-communautaires] Erreur chargement liens de lieux:",
          error
        );
      }
    }
    loadLocationLinks();
  }, []);

  // Scroll-spy de la nav sticky.
  useEffect(() => {
    const ids = sectionAnchors.map((a) => a.id);
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
      { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  function showNotice(message: string, tone: "info" | "success" | "error" = "info") {
    setNotice(message);
    setNoticeTone(tone);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) {
      showNotice(
        "Il manque encore le titre ou la description — ajoute-les pour qu'on découvre ton idée.",
        "error"
      );
      return;
    }

    try {
      setActionLoading(true);
      setNotice(null);
      const response = await fetch("/api/events/proposals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category: form.eventType,
          proposedDate: form.suggestedDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(
          data?.error || "Impossible d'envoyer ta proposition pour le moment.",
          "error"
        );
        return;
      }
      setForm({
        title: "",
        eventType: typeOptions[0],
        description: "",
        suggestedDate: "",
      });
      showNotice(
        "Idée envoyée ! Merci, on la regarde au plus vite avec le staff.",
        "success"
      );
      await loadProposals();
    } catch {
      showNotice("Petit souci réseau pendant l'envoi. Réessaie dans un instant.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleVote(proposal: CommunityIdeaCard) {
    if (!proposal.id) return;
    try {
      setActionLoading(true);
      setNotice(null);
      const method = proposal.hasVoted ? "DELETE" : "POST";
      const response = await fetch(`/api/events/proposals/${proposal.id}/vote`, {
        method,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        showNotice(
          data?.error || "Impossible de mettre à jour ton vote pour cette idée.",
          "error"
        );
        return;
      }
      setProposals((prev) =>
        prev.map((item) =>
          item.id === proposal.id
            ? {
                ...item,
                hasVoted: data.hasVoted,
                votesCount: data.votesCount,
              }
            : item
        )
      );
    } catch {
      showNotice("Petit souci réseau pendant le vote. Réessaie dans un instant.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  const nowTs = Date.now();

  const upcomingEvents = useMemo(() => {
    return events
      .filter((item) => new Date(item.date).getTime() >= nowTs)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);
  }, [events, nowTs]);

  const upcomingCategories = useMemo(() => {
    const categories = Array.from(
      new Set(upcomingEvents.map((item) => item.category).filter(Boolean))
    );
    return categories;
  }, [upcomingEvents]);

  const filteredUpcomingEvents = useMemo(() => {
    if (upcomingFilter === "all") return upcomingEvents;
    return upcomingEvents.filter((item) => item.category === upcomingFilter);
  }, [upcomingEvents, upcomingFilter]);

  const featuredUpcoming = useMemo<FeaturedUpcomingEvent[]>(() => {
    const source = filteredUpcomingEvents.length > 0 ? filteredUpcomingEvents : upcomingEvents;
    if (source.length === 0) return fallbackUpcomingEvents;
    return source.map((item) => ({
      title: item.title,
      dateLabel: formatDateTime(item.date),
      locationLabel: item.location || "Discord TENF",
      locationDisplayLabel: item.location
        ? buildEventLocationDisplay(item.location, locationLinks)?.label ||
          (item.location || "Discord TENF")
        : "Discord TENF",
      locationUrl: item.location,
      shortDescription:
        item.description || "Un nouveau moment communautaire est prévu — on en reparle vite.",
      eventUrl: "/evenements",
      addToCalendarUrl: calendarUrlForEvent(item),
      category: item.category,
    }));
  }, [filteredUpcomingEvents, upcomingEvents, locationLinks]);

  const ideasWithVotes = useMemo<CommunityIdeaCard[]>(() => {
    return proposals.slice(0, 6).map((proposal) => {
      const votes = proposal.votesCount || 0;
      return {
        id: proposal.id,
        title: proposal.title,
        category: proposal.category,
        description: proposal.description,
        proposedDate: proposal.proposedDate,
        votesCount: votes,
        potentialParticipants: Math.max(1, Math.round(votes * 0.5)),
        hasVoted: proposal.hasVoted,
      };
    });
  }, [proposals]);

  const estimatedEvents = Math.max(events.length, 32);
  const estimatedParticipants = Math.max(200, events.length * 14 + proposals.length * 5);
  const estimatedMoments = Math.max(300, estimatedParticipants * 2);
  const animatedEvents = useAnimatedNumber(estimatedEvents);
  const animatedParticipants = useAnimatedNumber(estimatedParticipants);
  const animatedMoments = useAnimatedNumber(estimatedMoments);

  useEffect(() => {
    if (featuredUpcoming.length <= 1) return;
    const interval = setInterval(() => {
      setSpotlightIndex((prev) => (prev + 1) % featuredUpcoming.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredUpcoming.length]);

  const discordLink =
    socialLinks.find((item) => item.name === "Discord")?.url ?? "https://discord.com/invite/ypn6s9XK8t";

  return (
    <main
      className="min-h-screen dynamic-bg"
      style={{
        backgroundColor: "var(--color-bg)",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(145,70,255,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(52,211,153,0.08), transparent 35%)",
        ...PAGE_OUTER_STYLE,
      }}
    >
      <div className="flex flex-col gap-8" style={PAGE_INNER_STYLE}>
        {/* ---------- HERO ---------- */}
        <section
          aria-labelledby="evc-hero-title"
          className="relative overflow-hidden rounded-3xl border p-5 sm:p-8 lg:p-12"
          style={{
            borderColor: "rgba(145,70,255,0.3)",
            background:
              "linear-gradient(140deg, rgba(145,70,255,0.22), rgba(145,70,255,0.06) 45%, rgba(18,18,25,0.6))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(145,70,255,0.35)" }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(52,211,153,0.18)" }}
            aria-hidden
          />

          <div className="relative grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] sm:text-xs"
                  style={{
                    borderColor: "rgba(145,70,255,0.5)",
                    backgroundColor: "rgba(145,70,255,0.18)",
                    color: "rgba(216,180,254,1)",
                  }}
                >
                  <PartyPopper className="h-3.5 w-3.5" aria-hidden />
                  Vie communautaire
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:text-xs"
                  style={{
                    borderColor: "rgba(255,255,255,0.12)",
                    backgroundColor: "rgba(255,255,255,0.04)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <Heart className="h-3 w-3" aria-hidden />
                  100 % membres TENF
                </span>
              </div>

              <h1
                id="evc-hero-title"
                className="text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
                style={{ color: "var(--color-text)" }}
              >
                Les moments qui font la family
              </h1>
              <p
                className="text-base font-semibold leading-relaxed sm:text-xl"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Soirées jeux, karaokés, spotlights créateurs… des rendez-vous pensés <em>par</em> et <em>pour</em> les membres, pour jouer, partager et vivre TENF ensemble.
              </p>
              <p
                className="max-w-2xl text-sm leading-relaxed sm:text-base"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Découvre les prochains rendez-vous, vote pour les idées qui te tentent, ou propose la tienne. Tout part de la communauté — aucun calendrier imposé, juste l&apos;envie de partager.
              </p>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href="/evenements"
                  className="group inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
                  }}
                >
                  <Calendar className="h-4 w-4" aria-hidden />
                  Voir le calendrier complet
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
                <a
                  href="#proposer-evenement"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "rgba(145,70,255,0.5)",
                    color: "var(--color-text)",
                  }}
                >
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  Proposer une idée
                </a>
                <a
                  href={discordLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "rgba(255,255,255,0.15)",
                    color: "var(--color-text-secondary)",
                  }}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  Rejoindre le Discord
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {[
                { label: "Soirées jeux", emoji: "🎮", tone: "rgba(245,158,11,0.35)" },
                { label: "Karaoké", emoji: "🎤", tone: "rgba(244,63,94,0.35)" },
                { label: "Spotlight créateurs", emoji: "⭐", tone: "rgba(145,70,255,0.35)" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="float-slow rounded-xl border p-4 text-center transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(145,70,255,0.28)]"
                  style={{
                    borderColor: `color-mix(in srgb, ${item.tone} 60%, rgba(145,70,255,0.25))`,
                    backgroundColor: "rgba(20,20,28,0.55)",
                  }}
                >
                  <div className="mb-2 text-3xl">{item.emoji}</div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text)" }}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------- NAV STICKY (scroll-spy) ---------- */}
        <nav
          aria-label="Sections de la page"
          className="sticky top-20 z-30 rounded-2xl border p-2 sm:p-3"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "color-mix(in srgb, var(--color-card) 90%, transparent)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scroll-smooth snap-x snap-mandatory sm:flex-wrap sm:overflow-visible">
            {sectionAnchors.map((item) => {
              const isActive = activeAnchor === item.id;
              return (
                <li key={item.id} className="snap-start">
                  <a
                    href={`#${item.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                    style={{
                      borderColor: isActive
                        ? "rgba(145,70,255,0.6)"
                        : "var(--color-border)",
                      color: isActive ? "white" : "var(--color-text)",
                      backgroundColor: isActive
                        ? "rgba(145,70,255,0.25)"
                        : "var(--color-surface)",
                      boxShadow: isActive
                        ? "0 6px 18px rgba(145,70,255,0.25)"
                        : "none",
                    }}
                  >
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---------- AUDIENCE CARDS ---------- */}
        <section
          aria-labelledby="evc-audience-title"
          className="space-y-3"
        >
          <h2
            id="evc-audience-title"
            className="text-sm font-bold uppercase tracking-[0.14em]"
            style={{ color: "rgba(216,180,254,0.9)" }}
          >
            Tu es au bon endroit si…
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {audienceCards.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: `color-mix(in srgb, ${card.tone} 35%, var(--color-border))`,
                  backgroundColor: "var(--color-card)",
                }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-xl transition group-hover:scale-105"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${card.tone} 22%, transparent)`,
                    }}
                    aria-hidden
                  >
                    {card.emoji}
                  </span>
                  <h3
                    className="text-base font-bold sm:text-lg"
                    style={{ color: "var(--color-text)" }}
                  >
                    {card.title}
                  </h3>
                </div>
                <p
                  className="mb-4 flex-1 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {card.desc}
                </p>
                <span
                  className="inline-flex items-center gap-1 text-sm font-semibold transition group-hover:gap-2"
                  style={{ color: card.tone }}
                >
                  {card.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </span>
              </a>
            ))}
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

        {/* ---------- MODE AMBIANCE ---------- */}
        <section
          aria-labelledby="evc-vibe-title"
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2
                id="evc-vibe-title"
                className="text-xl font-bold sm:text-2xl"
                style={{ color: "var(--color-text)" }}
              >
                Choisis l&apos;ambiance du moment
              </h2>
              <p
                className="mt-0.5 text-xs sm:text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Mini exercice : à quoi tu as envie de participer cette semaine ?
              </p>
            </div>
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
              style={{
                borderColor: "rgba(145,70,255,0.35)",
                color: "rgba(216,180,254,0.9)",
                backgroundColor: "rgba(145,70,255,0.08)",
              }}
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              Mode ludique
            </span>
          </div>
          <div
            role="tablist"
            aria-label="Choisir un mode d'ambiance"
            className="-mx-1 mb-4 flex flex-wrap gap-2 overflow-x-auto px-1 pb-1 sm:overflow-visible"
          >
            {vibeModes.map((mode, index) => {
              const isActive = index === activeVibe;
              return (
                <button
                  key={mode.title}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveVibe(index)}
                  className="inline-flex min-h-[42px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: isActive ? mode.tone : "var(--color-border)",
                    color: "var(--color-text)",
                    backgroundColor: isActive
                      ? `color-mix(in srgb, ${mode.tone} 18%, transparent)`
                      : "var(--color-surface)",
                    boxShadow: isActive
                      ? `0 6px 18px color-mix(in srgb, ${mode.tone} 30%, transparent)`
                      : "none",
                  }}
                >
                  <span aria-hidden>{mode.emoji}</span>
                  {mode.title}
                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            aria-label={vibeModes[activeVibe].title}
            className="rounded-xl border p-4 transition-all duration-500 sm:p-5"
            style={{
              borderColor: "rgba(145,70,255,0.3)",
              background: vibeModes[activeVibe].gradient,
            }}
          >
            <p
              className="mb-1 text-base font-bold sm:text-lg"
              style={{ color: "var(--color-text)" }}
            >
              <span aria-hidden className="mr-1">{vibeModes[activeVibe].emoji}</span>
              {vibeModes[activeVibe].title}
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {vibeModes[activeVibe].subtitle}
            </p>
          </div>
        </section>

        {/* ---------- PROCHAINS ÉVÉNEMENTS ---------- */}
        <section
          id="prochains-evenements"
          aria-labelledby="evc-upcoming-title"
          className="scroll-mt-28 space-y-4"
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(216,180,254,0.9)" }}
              >
                À venir
              </p>
              <h2
                id="evc-upcoming-title"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--color-text)" }}
              >
                Les prochains rendez-vous
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Sélection des trois prochains événements ouverts à la communauté.
              </p>
            </div>
            <a
              href="/evenements"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-white/5"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <Calendar className="h-4 w-4" aria-hidden />
              Gérer mes inscriptions
            </a>
          </div>

          {/* Filtres catégorie */}
          {upcomingCategories.length > 0 ? (
            <div
              role="tablist"
              aria-label="Filtrer les prochains événements"
              className="flex flex-wrap items-center gap-2"
            >
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold"
                style={{ color: "var(--color-text-secondary)" }}
              >
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Filtrer :
              </span>
              <button
                type="button"
                role="tab"
                aria-selected={upcomingFilter === "all"}
                onClick={() => setUpcomingFilter("all")}
                className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor:
                    upcomingFilter === "all"
                      ? "rgba(145,70,255,0.55)"
                      : "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor:
                    upcomingFilter === "all"
                      ? "rgba(145,70,255,0.16)"
                      : "var(--color-surface)",
                }}
              >
                Tous
              </button>
              {upcomingCategories.map((category) => {
                const isActive = upcomingFilter === category;
                return (
                  <button
                    key={category}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setUpcomingFilter(category)}
                    className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                    style={{
                      borderColor: isActive
                        ? "rgba(145,70,255,0.55)"
                        : "var(--color-border)",
                      color: "var(--color-text)",
                      backgroundColor: isActive
                        ? "rgba(145,70,255,0.16)"
                        : "var(--color-surface)",
                    }}
                  >
                    <span aria-hidden>{visualForCategory(category)}</span>
                    {category}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Spotlight rotatif */}
          {featuredUpcoming.length > 0 ? (
            <div
              className="rounded-2xl border p-4 transition-all duration-300 sm:p-5"
              style={{
                borderColor: "rgba(145,70,255,0.35)",
                backgroundColor: "rgba(145,70,255,0.08)",
              }}
            >
              <p
                className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "rgba(216,180,254,0.9)" }}
              >
                <Sparkles className="h-3 w-3" aria-hidden />
                À la une
              </p>
              <p
                className="text-lg font-bold sm:text-xl"
                style={{ color: "var(--color-text)" }}
              >
                {featuredUpcoming[spotlightIndex]?.title}
              </p>
              <p
                className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {featuredUpcoming[spotlightIndex]?.dateLabel} ·{" "}
                {featuredUpcoming[spotlightIndex]?.locationDisplayLabel ||
                  featuredUpcoming[spotlightIndex]?.locationLabel}
              </p>
              {featuredUpcoming.length > 1 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {featuredUpcoming.map((event, index) => {
                    const isActive = index === spotlightIndex;
                    return (
                      <button
                        key={`${event.title}-${index}`}
                        type="button"
                        onClick={() => setSpotlightIndex(index)}
                        aria-label={`Mettre en avant ${event.title}`}
                        aria-pressed={isActive}
                        className="inline-flex items-center rounded-md border px-2.5 py-1 text-xs transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                        style={{
                          borderColor: isActive
                            ? "rgba(145,70,255,0.6)"
                            : "var(--color-border)",
                          color: "var(--color-text)",
                          backgroundColor: isActive
                            ? "rgba(145,70,255,0.16)"
                            : "transparent",
                        }}
                      >
                        {event.title}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Cartes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingEvents && featuredUpcoming.length === 0
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={`skeleton-up-${i}`}
                    className="rounded-2xl border p-5"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                    }}
                  >
                    <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
                    <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-white/10" />
                    <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-white/10" />
                    <div className="mt-4 h-12 w-full animate-pulse rounded bg-white/10" />
                  </div>
                ))
              : featuredUpcoming.map((eventCard) => (
                  <article
                    key={`${eventCard.title}-${eventCard.dateLabel}`}
                    className="group flex h-full flex-col rounded-2xl border p-5 transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgba(0,0,0,0.35)]"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                    }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110"
                        style={{
                          backgroundColor: "rgba(145,70,255,0.12)",
                        }}
                        aria-hidden
                      >
                        {eventCard.category
                          ? visualForCategory(eventCard.category)
                          : "🎤"}
                      </span>
                      <h3
                        className="text-base font-bold sm:text-lg"
                        style={{ color: "var(--color-text)" }}
                      >
                        {eventCard.title}
                      </h3>
                    </div>
                    <p
                      className="mb-1 inline-flex items-start gap-1.5 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {eventCard.dateLabel}
                    </p>
                    <p
                      className="mb-3 inline-flex items-start gap-1.5 text-sm"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      {(() => {
                        const locationDisplay = eventCard.locationUrl
                          ? buildEventLocationDisplay(eventCard.locationUrl, locationLinks)
                          : null;
                        if (!locationDisplay) return <span>{eventCard.locationLabel}</span>;
                        return (
                          <a
                            href={locationDisplay.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:no-underline"
                            style={{ color: "var(--color-primary)" }}
                          >
                            {locationDisplay.label}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </a>
                        );
                      })()}
                    </p>
                    <div
                      className="prose prose-invert mb-4 max-w-none grow text-sm leading-relaxed prose-p:my-1 prose-strong:text-white prose-em:text-gray-200 prose-a:text-[#9146ff]"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {normalizeMarkdownForCards(eventCard.shortDescription)}
                      </ReactMarkdown>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                      <a
                        href={eventCard.eventUrl}
                        className="inline-flex min-h-[40px] items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                        style={{
                          borderColor: "var(--color-border)",
                          color: "var(--color-text)",
                        }}
                      >
                        Voir l&apos;événement
                      </a>
                      <a
                        href={eventCard.addToCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                        style={{ backgroundColor: "var(--color-primary)" }}
                      >
                        <CalendarPlus className="h-4 w-4" aria-hidden />
                        Ajouter à mon agenda
                      </a>
                    </div>
                  </article>
                ))}
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section
          aria-labelledby="evc-faq-title"
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="mb-4 flex items-center gap-2">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(145,70,255,0.15)" }}
              aria-hidden
            >
              <HelpCircle
                className="h-5 w-5"
                style={{ color: "rgba(216,180,254,1)" }}
                aria-hidden
              />
            </span>
            <h2
              id="evc-faq-title"
              className="text-xl font-bold sm:text-2xl"
              style={{ color: "var(--color-text)" }}
            >
              Les questions qu&apos;on te pose souvent
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            {[
              {
                q: "Comment participer à un événement ?",
                a: "Ouvre le calendrier, choisis une date qui te tente, et inscris-toi en un clic. Tu reçois ensuite les rappels Discord.",
              },
              {
                q: "C'est gratuit ?",
                a: "Oui, tous les rendez-vous communautaires sont accessibles aux membres TENF, sans frais cachés.",
              },
              {
                q: "Puis-je annuler mon inscription ?",
                a: "Bien sûr — tu peux te désinscrire avant le début de l'événement, en deux clics. Aucune pression, jamais.",
              },
              {
                q: "Où se déroulent les événements ?",
                a: "Principalement sur Discord TENF (vocal ou texte). Le lieu exact est indiqué sur la fiche de chaque événement.",
              },
            ].map((item) => (
              <article
                key={item.q}
                className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                }}
              >
                <h3
                  className="mb-1 text-sm font-bold sm:text-base"
                  style={{ color: "var(--color-text)" }}
                >
                  {item.q}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item.a}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- TYPES D'ÉVÉNEMENTS ---------- */}
        <section
          id="types-evenements"
          aria-labelledby="evc-types-title"
          className="scroll-mt-28 space-y-4"
        >
          <div>
            <p
              className="text-sm font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(216,180,254,0.9)" }}
            >
              Les formats
            </p>
            <h2
              id="evc-types-title"
              className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Ce que tu retrouves le plus souvent
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🎮",
                title: "Soirées jeux",
                description:
                  "Sessions conviviales où on joue ensemble : Fortnite, Gartic Phone, Among Us et compagnie.",
                tone: "rgba(245,158,11,0.35)",
              },
              {
                icon: "🎤",
                title: "Événements spéciaux",
                description:
                  "Karaoké, soirées à thème et moments originaux qui marquent la vie de la communauté.",
                tone: "rgba(244,63,94,0.35)",
              },
              {
                icon: "⭐",
                title: "Découverte de créateurs",
                description:
                  "Mise en avant des talents de la New Family et soutien actif des chaînes membres.",
                tone: "rgba(145,70,255,0.35)",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="group h-full rounded-2xl border p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
                style={{
                  borderColor: `color-mix(in srgb, ${item.tone} 30%, var(--color-border))`,
                  backgroundColor: "var(--color-card)",
                }}
              >
                <div
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl text-2xl transition group-hover:scale-110"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${item.tone} 18%, transparent)`,
                  }}
                  aria-hidden
                >
                  {item.icon}
                </div>
                <h3
                  className="mb-2 text-lg font-bold"
                  style={{ color: "var(--color-text)" }}
                >
                  {item.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ---------- GALERIE MOMENTS ---------- */}
        <section aria-labelledby="evc-moments-title" className="space-y-4">
          <div>
            <p
              className="text-sm font-bold uppercase tracking-[0.14em]"
              style={{ color: "rgba(216,180,254,0.9)" }}
            >
              Les rendez-vous récurrents
            </p>
            <h2
              id="evc-moments-title"
              className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--color-text)" }}
            >
              Les moments qui rythment la communauté
            </h2>
          </div>
          <ul
            role="list"
            className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4"
          >
            {[
              { label: "Soirées jeux", icon: "🎮", tone: "rgba(145,70,255,0.2)" },
              { label: "Vocal Discord", icon: "🎧", tone: "rgba(59,130,246,0.2)" },
              { label: "Lives", icon: "📺", tone: "rgba(16,185,129,0.2)" },
              { label: "Moments fun", icon: "😂", tone: "rgba(245,158,11,0.2)" },
            ].map((item) => (
              <li
                key={item.label}
                className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border p-3 text-center transition hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(0,0,0,0.35)]"
                style={{
                  borderColor: "var(--color-border)",
                  background: `linear-gradient(160deg, ${item.tone}, rgba(20,20,28,0.6))`,
                }}
              >
                <div className="mb-2 text-3xl" aria-hidden>
                  {item.icon}
                </div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  {item.label}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- PROPOSER UN ÉVÉNEMENT ---------- */}
        <section
          id="proposer-evenement"
          aria-labelledby="evc-propose-title"
          className="scroll-mt-28 rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="mb-4 flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(145,70,255,0.18)" }}
              aria-hidden
            >
              <Lightbulb
                className="h-5 w-5"
                style={{ color: "rgba(216,180,254,1)" }}
              />
            </span>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                Une idée d&apos;événement ?
              </p>
              <h2
                id="evc-propose-title"
                className="text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--color-text)" }}
              >
                Propose ton événement
              </h2>
              <p
                className="mt-2 max-w-2xl text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Chez TENF, les meilleurs formats sortent souvent de la communauté. Si tu as une idée — soirée, format original, mini-tournoi — partage-la, on en discute avec toi.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="evc-title"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Titre de l&apos;événement <span style={{ color: "#f87171" }}>*</span>
              </label>
              <input
                id="evc-title"
                required
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                placeholder="Ex : Soirée mini-jeux du vendredi"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="evc-type"
                  className="mb-1 block text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Type d&apos;événement <span style={{ color: "#f87171" }}>*</span>
                </label>
                <select
                  id="evc-type"
                  value={form.eventType}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, eventType: e.target.value as EventType }))
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="evc-date"
                  className="mb-1 block text-sm font-semibold"
                  style={{ color: "var(--color-text)" }}
                >
                  Date suggérée{" "}
                  <span
                    className="text-xs font-normal"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    (optionnel)
                  </span>
                </label>
                <input
                  id="evc-date"
                  type="date"
                  value={form.suggestedDate}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, suggestedDate: e.target.value }))
                  }
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-text)",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="evc-desc"
                className="mb-1 block text-sm font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                Description <span style={{ color: "#f87171" }}>*</span>
              </label>
              <textarea
                id="evc-desc"
                required
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                className="min-h-[120px] w-full rounded-lg border px-3 py-2.5 text-sm transition focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                style={{
                  borderColor: "var(--color-border)",
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text)",
                }}
                placeholder="Raconte ton idée : ambiance, format, durée, public visé… on se laisse guider."
              />
              <p
                className="mt-1 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Astuce : plus tu donnes de détails, plus on peut t&apos;aider à concrétiser l&apos;idée.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={actionLoading}
                className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  backgroundColor: "var(--color-primary)",
                  boxShadow: "0 10px 28px rgba(145,70,255,0.35)",
                }}
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                )}
                Envoyer mon idée
              </button>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                On répond à toutes les idées, même celles qu&apos;on ne retient pas — promis.
              </p>
            </div>
          </form>
        </section>

        {/* ---------- IDÉES MEMBRES ---------- */}
        <section
          id="idees-communaute"
          aria-labelledby="evc-ideas-title"
          className="scroll-mt-28 rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(216,180,254,0.9)" }}
              >
                Idées de la communauté
              </p>
              <h2
                id="evc-ideas-title"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--color-text)" }}
              >
                Vote pour ce qui te tente
              </h2>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Les idées les plus plébiscitées passent en priorité quand le staff prépare le calendrier.
              </p>
            </div>
            <a
              href="#proposer-evenement"
              className="inline-flex items-center gap-1 text-sm font-semibold transition hover:gap-2"
              style={{ color: "var(--color-primary)" }}
            >
              Ou propose la tienne
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          {loadingProposals ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skel-idea-${i}`}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--color-border)",
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  <div className="h-5 w-2/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-12 w-full animate-pulse rounded bg-white/10" />
                  <div className="mt-3 h-8 w-1/2 animate-pulse rounded bg-white/10" />
                </div>
              ))}
            </div>
          ) : ideasWithVotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ideasWithVotes.map((idea) => {
                const isHot = idea.votesCount >= 5;
                return (
                  <article
                    key={idea.id ?? idea.title}
                    className="group flex h-full flex-col rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                    style={{
                      borderColor: "var(--color-border)",
                      backgroundColor: "var(--color-surface)",
                      color: "var(--color-text)",
                    }}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold">{idea.title}</h3>
                      {isHot ? (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            borderColor: "rgba(244,63,94,0.4)",
                            backgroundColor: "rgba(244,63,94,0.12)",
                            color: "rgba(252,165,165,1)",
                          }}
                        >
                          🔥 Tendance
                        </span>
                      ) : null}
                    </div>
                    {idea.category ? (
                      <p
                        className="mb-2 inline-flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <span aria-hidden>{visualForCategory(idea.category)}</span>
                        {idea.category}
                      </p>
                    ) : null}
                    {idea.description ? (
                      <p
                        className="mb-3 line-clamp-3 text-xs leading-relaxed"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {idea.description}
                      </p>
                    ) : null}
                    <div
                      className="mb-3 flex flex-wrap gap-1.5 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <Calendar className="h-3 w-3" aria-hidden />
                        {formatShortDate(idea.proposedDate)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <ThumbsUp className="h-3 w-3" aria-hidden />
                        {idea.votesCount} intéressé(s)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5">
                        <Users className="h-3 w-3" aria-hidden />
                        {idea.potentialParticipants} potentiel(s)
                      </span>
                    </div>
                    {typeof idea.hasVoted === "boolean" ? (
                      <button
                        type="button"
                        onClick={() => handleToggleVote(idea)}
                        disabled={actionLoading}
                        aria-pressed={idea.hasVoted}
                        className="mt-auto inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          backgroundColor: idea.hasVoted ? "#475569" : "var(--color-primary)",
                        }}
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <ThumbsUp className="h-4 w-4" aria-hidden />
                        )}
                        {idea.hasVoted ? "Retirer mon vote" : "Ça me tente !"}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className="flex flex-col items-start gap-3 rounded-xl border p-5 text-sm"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
              }}
            >
              <p>
                <span style={{ color: "var(--color-text)" }} className="font-semibold">
                  Aucune idée publique pour l&apos;instant.
                </span>{" "}
                Sois la première personne à proposer quelque chose !
              </p>
              <a
                href="#proposer-evenement"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Lightbulb className="h-4 w-4" aria-hidden />
                Proposer une idée
              </a>
            </div>
          )}
        </section>

        {/* ---------- COMPTEUR COMMUNAUTAIRE ---------- */}
        <section
          aria-labelledby="evc-counters-title"
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <h2
            id="evc-counters-title"
            className="mb-4 text-xl font-bold sm:text-2xl"
            style={{ color: "var(--color-text)" }}
          >
            La communauté en action
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
            {[
              {
                icon: "🎮",
                value: animatedEvents,
                label: "événements organisés",
                tone: "rgba(245,158,11,0.35)",
              },
              {
                icon: "👥",
                value: `+${animatedParticipants}`,
                label: "participations cumulées",
                tone: "rgba(52,211,153,0.35)",
              },
              {
                icon: "💬",
                value: `+${animatedMoments}`,
                label: "moments partagés",
                tone: "rgba(145,70,255,0.35)",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border p-5 transition hover:-translate-y-0.5"
                style={{
                  borderColor: `color-mix(in srgb, ${stat.tone} 35%, var(--color-border))`,
                  background: `linear-gradient(160deg, color-mix(in srgb, ${stat.tone} 14%, transparent), var(--color-surface))`,
                }}
              >
                <p
                  className="text-3xl font-extrabold tabular-nums"
                  style={{ color: "var(--color-text)" }}
                >
                  <span aria-hidden className="mr-1.5">
                    {stat.icon}
                  </span>
                  {stat.value}
                </p>
                <p
                  className="mt-1 text-sm font-medium"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------- DISCORD ---------- */}
        <section
          id="rejoindre-evenements"
          aria-labelledby="evc-discord-title"
          className="scroll-mt-28 overflow-hidden rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className="text-sm font-bold uppercase tracking-[0.14em]"
                style={{ color: "rgba(216,180,254,0.9)" }}
              >
                On se retrouve sur Discord
              </p>
              <h2
                id="evc-discord-title"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
                style={{ color: "var(--color-text)" }}
              >
                Rejoindre les événements
              </h2>
              <p
                className="mt-2 max-w-2xl text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Les événements se vivent surtout sur le Discord TENF : annonces, rappels, salons vocaux dédiés et discussion après coup.
              </p>
            </div>
            <a
              href={discordLink}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex min-h-[48px] shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              style={{
                backgroundColor: "var(--color-primary)",
                boxShadow: "0 12px 30px rgba(145,70,255,0.35)",
              }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Rejoindre le Discord TENF
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </a>
          </div>
        </section>

        {/* ---------- FOOTER D'ENGAGEMENT ---------- */}
        <section
          aria-labelledby="evc-footer-title"
          className="rounded-2xl border p-5 sm:p-6"
          style={{
            borderColor: "rgba(145,70,255,0.35)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <div className="flex items-start gap-3">
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: "rgba(145,70,255,0.18)" }}
              aria-hidden
            >
              <Heart className="h-5 w-5" style={{ color: "rgba(216,180,254,1)" }} />
            </span>
            <div className="space-y-3">
              <h2
                id="evc-footer-title"
                className="text-xl font-bold sm:text-2xl"
                style={{ color: "var(--color-text)" }}
              >
                Et si le prochain événement venait de toi ?
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                La communauté TENF grandit grâce aux idées de ses membres. Si tu te dis « tiens, ça serait cool de faire ça » — c&apos;est exactement le moment de nous le partager.
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="/evenements"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  <Calendar className="h-4 w-4" aria-hidden />
                  Voir le calendrier complet
                </a>
                <a
                  href="#proposer-evenement"
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:bg-white/5"
                  style={{
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                >
                  <Lightbulb className="h-4 w-4" aria-hidden />
                  Proposer un événement
                </a>
              </div>
              <p
                className="text-xs italic"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Merci à chaque personne qui participe, propose, et fait vivre ces moments. C&apos;est vous, la family. 💜
              </p>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .dynamic-bg {
          animation: bgMove 12s ease-in-out infinite;
        }
        .float-slow {
          animation: floatSlow 6s ease-in-out infinite;
        }
        @keyframes floatSlow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes bgMove {
          0%,
          100% {
            background-position: 0% 0%;
          }
          50% {
            background-position: 100% 20%;
          }
        }
      `}</style>
    </main>
  );
}
