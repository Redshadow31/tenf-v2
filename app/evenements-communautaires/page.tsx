"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { socialLinks } from "@/lib/socialLinks";

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
  shortDescription: string;
  eventUrl: string;
  addToCalendarUrl: string;
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

const typeOptions: EventType[] = [
  "Soirees jeux communautaires",
  "Evenements speciaux",
  "Decouverte de createurs",
  "Autre",
];

const fallbackUpcomingEvents: FeaturedUpcomingEvent[] = [
  {
    title: "Karaoke communautaire",
    dateLabel: "Samedi 14 mars - 21h",
    locationLabel: "Discord TENF",
    shortDescription: "Une soiree fun pour chanter ensemble et passer un bon moment.",
    eventUrl: "/events2",
    addToCalendarUrl: "/events2",
  },
  {
    title: "Soiree jeux communautaires",
    dateLabel: "Mercredi 19 mars - 20h30",
    locationLabel: "Vocal Discord TENF",
    shortDescription: "Jeux, rires et team play pour renforcer les liens entre membres.",
    eventUrl: "/events2",
    addToCalendarUrl: "/events2",
  },
  {
    title: "Decouverte de createurs",
    dateLabel: "Dimanche 23 mars - 18h",
    locationLabel: "Lives + Discord TENF",
    shortDescription: "Mise en avant de nouveaux createurs et partage d'experience.",
    eventUrl: "/events2",
    addToCalendarUrl: "/events2",
  },
];

const fallbackIdeas: CommunityIdeaCard[] = [
  { title: "Tournoi Fortnite", votesCount: 18, potentialParticipants: 9 },
  { title: "Soiree blind test", votesCount: 14, potentialParticipants: 7 },
  { title: "Challenge Sims", votesCount: 11, potentialParticipants: 5 },
];

const vibeModes = [
  {
    title: "Mode chill",
    emoji: "🌙",
    subtitle: "Ambiance detente, discussions et fun vocal.",
    gradient: "linear-gradient(135deg, rgba(99,102,241,0.35), rgba(20,20,30,0.6))",
  },
  {
    title: "Mode competition",
    emoji: "🔥",
    subtitle: "Defis, mini tournois et esprit d'equipe.",
    gradient: "linear-gradient(135deg, rgba(244,63,94,0.35), rgba(20,20,30,0.6))",
  },
  {
    title: "Mode creatif",
    emoji: "✨",
    subtitle: "Formats originaux et decouvertes de createurs.",
    gradient: "linear-gradient(135deg, rgba(145,70,255,0.38), rgba(20,20,30,0.6))",
  },
];

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
  if (!value) return "Date a confirmer";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date a confirmer";
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
  if (Number.isNaN(start.getTime())) return "/events2";
  const end = new Date(start.getTime() + 90 * 60 * 1000);
  const formatUtc = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const details = `${event.description || "Evenement communautaire TENF"}\n\n${window.location.origin}/events2`;
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

export default function EvenementsCommunautairesPage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [proposals, setProposals] = useState<CommunityProposal[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeVibe, setActiveVibe] = useState(0);
  const [upcomingFilter, setUpcomingFilter] = useState<string>("all");
  const [spotlightIndex, setSpotlightIndex] = useState(0);
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
        console.error("[evenements-communautaires] Erreur chargement evenements:", error);
      } finally {
        setLoadingEvents(false);
      }
    }
    loadEvents();
  }, []);

  async function loadProposals() {
    try {
      setLoadingProposals(true);
      const response = await fetch("/api/events/proposals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les propositions");
      }
      setProposals((data.proposals || []) as CommunityProposal[]);
    } catch (error) {
      console.error("[evenements-communautaires] Erreur chargement propositions:", error);
    } finally {
      setLoadingProposals(false);
    }
  }

  useEffect(() => {
    loadProposals();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const title = form.title.trim();
    const description = form.description.trim();

    if (!title || !description) {
      setNotice("Merci de remplir les champs obligatoires du formulaire.");
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
        setNotice(data?.error || "Impossible d'envoyer ta proposition.");
        return;
      }
      setForm({
        title: "",
        eventType: typeOptions[0],
        description: "",
        suggestedDate: "",
      });
      setNotice("Proposition envoyee ! Merci pour ton idee.");
      await loadProposals();
    } catch {
      setNotice("Erreur reseau lors de l'envoi de la proposition.");
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
        setNotice(data?.error || "Impossible de voter pour cette idee.");
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
      setNotice("Erreur reseau lors du vote.");
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
    const categories = Array.from(new Set(upcomingEvents.map((item) => item.category).filter(Boolean)));
    return categories;
  }, [upcomingEvents]);

  const filteredUpcomingEvents = useMemo(() => {
    if (upcomingFilter === "all") return upcomingEvents;
    return upcomingEvents.filter((item) => item.category === upcomingFilter);
  }, [upcomingEvents, upcomingFilter]);

  const featuredUpcoming = useMemo(() => {
    const source = filteredUpcomingEvents.length > 0 ? filteredUpcomingEvents : upcomingEvents;
    if (source.length === 0) return fallbackUpcomingEvents;
    return source.map((item) => ({
      title: item.title,
      dateLabel: formatDateTime(item.date),
      locationLabel: item.location || "Discord TENF",
      shortDescription: item.description || "Un nouveau moment communautaire est prevu.",
      eventUrl: "/events2",
      addToCalendarUrl: calendarUrlForEvent(item),
      category: item.category,
    }));
  }, [filteredUpcomingEvents, upcomingEvents]);

  const ideasWithVotes = useMemo<CommunityIdeaCard[]>(() => {
    if (proposals.length === 0) return fallbackIdeas;
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
    }, 3500);
    return () => clearInterval(interval);
  }, [featuredUpcoming.length]);

  const discordLink = socialLinks.find((item) => item.name === "Discord")?.url || "https://discord.gg/ypn6s9XK8t";

  const hoverGlowClass =
    "transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_0_1px_rgba(145,70,255,0.35),0_14px_30px_rgba(145,70,255,0.28)]";

  return (
    <main
      className="min-h-screen dynamic-bg"
      style={{
        backgroundColor: "var(--color-bg)",
        backgroundImage:
          "radial-gradient(circle at 20% 20%, rgba(145,70,255,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(52,211,153,0.08), transparent 35%)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 space-y-10">
        {/* HERO */}
        <section
          className="relative overflow-hidden rounded-2xl border p-6 md:p-10"
          style={{
            borderColor: "rgba(145,70,255,0.3)",
            background:
              "linear-gradient(140deg, rgba(145,70,255,0.22), rgba(145,70,255,0.06) 45%, rgba(18,18,25,0.6))",
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(145,70,255,0.35)" }}
          />
          <div
            className="pointer-events-none absolute -bottom-24 -left-12 h-56 w-56 rounded-full blur-3xl"
            style={{ background: "rgba(52,211,153,0.18)" }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold mb-3" style={{ color: "var(--color-text)" }}>
                Evenements communautaires TENF
              </h1>
              <p className="text-base md:text-xl mb-6" style={{ color: "var(--color-text-secondary)" }}>
                Des moments pour jouer, rire et creer des souvenirs ensemble.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#prochains-evenements"
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  🎮 Voir les prochains evenements
                </a>
                <a
                  href="#proposer-evenement"
                  className="px-4 py-2 rounded-lg text-sm font-semibold border"
                  style={{ borderColor: "rgba(145,70,255,0.5)", color: "var(--color-text)" }}
                >
                  💡 Proposer un evenement
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["🎮 Soiree jeux", "🎤 Karaoke", "⭐ Spotlight createurs"].map((label) => (
                <div
                  key={label}
                  className={`rounded-xl border p-4 text-center ${hoverGlowClass} float-slow`}
                  style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "rgba(20,20,28,0.5)" }}
                >
                  <div className="text-2xl mb-2">{label.split(" ")[0]}</div>
                  <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
                    {label.replace(`${label.split(" ")[0]} `, "")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MODE AMBIANCE */}
        <section
          className="rounded-xl border p-5 md:p-6"
          style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "var(--color-card)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold" style={{ color: "var(--color-text)" }}>
              Choisis l'ambiance du moment
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
              Mini mode ludique TENF
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {vibeModes.map((mode, index) => (
              <button
                key={mode.title}
                type="button"
                onClick={() => setActiveVibe(index)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${hoverGlowClass}`}
                style={{
                  borderColor: index === activeVibe ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: index === activeVibe ? "rgba(145,70,255,0.15)" : "var(--color-surface)",
                }}
              >
                {mode.emoji} {mode.title}
              </button>
            ))}
          </div>
          <div
            className="rounded-xl border p-4 transition-all duration-500"
            style={{
              borderColor: "rgba(145,70,255,0.3)",
              background: vibeModes[activeVibe].gradient,
            }}
          >
            <p className="text-base font-semibold mb-1" style={{ color: "var(--color-text)" }}>
              {vibeModes[activeVibe].emoji} {vibeModes[activeVibe].title}
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {vibeModes[activeVibe].subtitle}
            </p>
          </div>
        </section>

        {/* PROCHAINS EVENEMENTS */}
        <section id="prochains-evenements" className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
              Prochains evenements TENF
            </h2>
            <a href="/events2" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>
              Voir tout le calendrier
            </a>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setUpcomingFilter("all")}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
              style={{
                borderColor: upcomingFilter === "all" ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                color: "var(--color-text)",
                backgroundColor: upcomingFilter === "all" ? "rgba(145,70,255,0.16)" : "var(--color-surface)",
              }}
            >
              Tous
            </button>
            {upcomingCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setUpcomingFilter(category)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                style={{
                  borderColor: upcomingFilter === category ? "rgba(145,70,255,0.55)" : "var(--color-border)",
                  color: "var(--color-text)",
                  backgroundColor: upcomingFilter === category ? "rgba(145,70,255,0.16)" : "var(--color-surface)",
                }}
              >
                {visualForCategory(category)} {category}
              </button>
            ))}
          </div>

          {featuredUpcoming.length > 0 && (
            <div
              className="rounded-xl border p-4 md:p-5 transition-all duration-300"
              style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "rgba(145,70,255,0.08)" }}
            >
              <p className="text-xs mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Spotlight automatique
              </p>
              <p className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>
                {featuredUpcoming[spotlightIndex]?.title}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {featuredUpcoming[spotlightIndex]?.dateLabel} - {featuredUpcoming[spotlightIndex]?.locationLabel}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {featuredUpcoming.map((eventCard) => (
              <article
                key={`${eventCard.title}-${eventCard.dateLabel}`}
                className={`rounded-xl border p-5 ${hoverGlowClass} group`}
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <div className="flex items-center gap-2 mb-2 text-base font-semibold" style={{ color: "var(--color-text)" }}>
                  <span className="transition-transform duration-300 group-hover:rotate-12">
                    {"category" in eventCard && typeof eventCard.category === "string"
                      ? visualForCategory(eventCard.category)
                      : "🎤"}
                  </span>
                  <span>{eventCard.title}</span>
                </div>
                <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  📅 {eventCard.dateLabel}
                </p>
                <p className="text-sm mb-3" style={{ color: "var(--color-text-secondary)" }}>
                  📍 {eventCard.locationLabel}
                </p>
                <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {eventCard.shortDescription}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={eventCard.eventUrl}
                    className="px-3 py-2 rounded-lg text-sm font-semibold border"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
                  >
                    Voir l'evenement
                  </a>
                  <a
                    href={eventCard.addToCalendarUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    Ajouter au calendrier
                  </a>
                </div>
              </article>
            ))}
          </div>
          {loadingEvents && (
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Chargement des prochains evenements...
            </p>
          )}
        </section>

        {/* TYPES D'EVENEMENTS */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Types d&apos;evenements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[
              {
                icon: "🎮",
                title: "Soirees jeux",
                description:
                  "Des sessions conviviales pour jouer ensemble : Fortnite, Gartic Phone, Among Us et bien plus.",
              },
              {
                icon: "🎤",
                title: "Evenements speciaux",
                description:
                  "Karaoke, soirees a theme et moments originaux pour marquer la vie de la communaute.",
              },
              {
                icon: "⭐",
                title: "Decouverte de createurs",
                description:
                  "Mise en avant des talents de la New Family et soutien actif des chaines membres.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`rounded-xl border p-5 h-full ${hoverGlowClass}`}
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-text)" }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* GALERIE MOMENTS PASSES */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold" style={{ color: "var(--color-text)" }}>
            Moments de la communaute
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Soiree jeux", icon: "🎮", tone: "rgba(145,70,255,0.2)" },
              { label: "Vocal Discord", icon: "🎧", tone: "rgba(59,130,246,0.2)" },
              { label: "Lives", icon: "📺", tone: "rgba(16,185,129,0.2)" },
              { label: "Moments fun", icon: "😂", tone: "rgba(245,158,11,0.2)" },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-xl border aspect-[4/3] flex flex-col items-center justify-center text-center p-3 ${hoverGlowClass}`}
                style={{ borderColor: "var(--color-border)", background: `linear-gradient(160deg, ${item.tone}, rgba(20,20,28,0.6))` }}
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <p className="text-sm font-medium" style={{ color: "var(--color-text)" }}>
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PROPOSER UN EVENEMENT */}
        <section
          id="proposer-evenement"
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-primary)" }}>
            Une idee d'evenement ?
          </p>
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Proposer un evenement
          </h2>
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Chez TENF, la communaute peut proposer ses propres evenements.
          </p>
          <p className="text-sm mb-5" style={{ color: "var(--color-text-secondary)" }}>
            Certains des evenements les plus apprecies viennent directement des idees des membres.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Titre de l&apos;evenement *
                </label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                  placeholder="Ex: Soiree mini-jeux du vendredi"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Type d&apos;evenement *
                </label>
                <select
                  value={form.eventType}
                  onChange={(e) => setForm((prev) => ({ ...prev, eventType: e.target.value as EventType }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  Date suggeree (optionnel)
                </label>
                <input
                  type="date"
                  value={form.suggestedDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, suggestedDate: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full min-h-[110px] rounded-lg border px-3 py-2 text-sm"
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
                placeholder="Decris ton idee d'evenement..."
              />
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Proposer l&apos;evenement
              </button>

              {notice ? (
                <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  {notice}
                </span>
              ) : null}
            </div>
          </form>
        </section>

        {/* IDEES + VOTES */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            Idees proposees par la communaute
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {ideasWithVotes.map((idea) => (
              <div
                key={idea.id ?? idea.title}
                className={`rounded-lg border p-4 text-sm ${hoverGlowClass}`}
                style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)", color: "var(--color-text)" }}
              >
                <p className="font-semibold mb-1">{idea.title}</p>
                {"category" in idea && typeof idea.category === "string" ? (
                  <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                    {visualForCategory(idea.category)} {idea.category}
                  </p>
                ) : null}
                {"description" in idea && typeof idea.description === "string" ? (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: "var(--color-text-secondary)" }}>
                    {idea.description}
                  </p>
                ) : null}
                {"proposedDate" in idea ? (
                  <p className="text-xs mb-2" style={{ color: "var(--color-text-secondary)" }}>
                    📅 {formatShortDate(idea.proposedDate)}
                  </p>
                ) : null}
                <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                  👍 {idea.votesCount} interesses
                </p>
                <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>
                  🔥 {idea.potentialParticipants} participants potentiels
                </p>
                {"hasVoted" in idea ? (
                  <button
                    onClick={() => handleToggleVote(idea)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: "var(--color-primary)" }}
                  >
                    {idea.hasVoted ? "Retirer mon vote" : "Ca m'interesse"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          {loadingProposals && (
            <p className="text-xs mt-3" style={{ color: "var(--color-text-secondary)" }}>
              Chargement des idees en cours...
            </p>
          )}
        </section>

        {/* COMPTEUR COMMUNAUTAIRE */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-4" style={{ color: "var(--color-text)" }}>
            La communaute en action
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`rounded-lg border p-4 ${hoverGlowClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                🎮 {animatedEvents}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                evenements organises
              </p>
            </div>
            <div
              className={`rounded-lg border p-4 ${hoverGlowClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                👥 +{animatedParticipants}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                participants
              </p>
            </div>
            <div
              className={`rounded-lg border p-4 ${hoverGlowClass}`}
              style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
            >
              <p className="text-2xl font-bold" style={{ color: "var(--color-text)" }}>
                💬 +{animatedMoments}
              </p>
              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                moments partages
              </p>
            </div>
          </div>
        </section>

        {/* BLOC DISCORD */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Rejoindre les evenements
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Les evenements sont organises directement sur le serveur Discord TENF.
          </p>
          <a
            href={discordLink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Rejoindre le Discord TENF
          </a>
        </section>

        {/* FOOTER D'ENGAGEMENT */}
        <section
          className="rounded-xl border p-6"
          style={{ borderColor: "rgba(145,70,255,0.35)", backgroundColor: "var(--color-card)" }}
        >
          <h2 className="text-2xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>
            Et si le prochain evenement venait de toi ?
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            La communaute TENF grandit grace aux idees de ses membres.
          </p>
          <a
            href="#proposer-evenement"
            className="inline-flex px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            💡 Proposer un evenement
          </a>
          <div className="mt-4 text-xs" style={{ color: "var(--color-text-secondary)" }}>
            Source stats interne: recap admin events + donnees publiques evenements.
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

