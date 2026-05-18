"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutGrid,
  ListChecks,
  Loader2,
  RefreshCcw,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import EventDateTime from "@/components/EventDateTime";
import { formatEventDateTimeInTimezone, getBrowserTimezone } from "@/lib/timezone";
import EventDetailModal from "@/components/events2/EventDetailModal";
import FormationCategoryBadge from "@/components/events/FormationCategoryBadge";
import type { EventLocationLink } from "@/lib/eventLocation";

// ============================================================
// Types
// ============================================================
type EventItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  isPublished?: boolean;
  ctaLabel?: string;
  ctaUrl?: string;
  isMaskedForAudience?: boolean;
  remainingSeats?: number | null;
  formationCategory?: string | null;
};

const statusFilters = [
  { id: "all", label: "Tous" },
  { id: "upcoming", label: "À venir" },
  { id: "past", label: "Terminés" },
] as const;

const viewModes = [
  { id: "calendar", label: "Vue calendrier", Icon: CalendarDays },
  { id: "list", label: "Vue cartes", Icon: LayoutGrid },
] as const;

// ============================================================
// Helpers (logique préservée)
// ============================================================
function calendarUrlForEvent(event: EventItem): string {
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

function categoryColor(category: string): string {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("spotlight")) {
    return "bg-purple-600/30 text-purple-200 border-purple-500/30";
  }
  if (normalized.includes("film")) {
    return "bg-blue-600/30 text-blue-200 border-blue-500/30";
  }
  if (normalized.includes("formation")) {
    return "bg-emerald-600/30 text-emerald-200 border-emerald-500/30";
  }
  if (normalized.includes("jeu")) {
    return "bg-amber-600/30 text-amber-200 border-amber-500/30";
  }
  if (normalized.includes("apero")) {
    return "bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/30";
  }

  return "bg-gray-700/40 text-gray-200 border-gray-600/40";
}

function categoryDotColor(category: string): string {
  const normalized = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("spotlight")) return "bg-purple-300";
  if (normalized.includes("film")) return "bg-blue-300";
  if (normalized.includes("formation")) return "bg-emerald-300";
  if (normalized.includes("jeu")) return "bg-amber-300";
  if (normalized.includes("apero")) return "bg-fuchsia-300";
  return "bg-gray-300";
}

function formatHour(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function getUrgencyLabel(date: string): string | null {
  const eventDate = new Date(date).getTime();
  if (Number.isNaN(eventDate)) return null;

  const diffMs = eventDate - Date.now();
  if (diffMs < 0) return null;

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "C'est aujourd'hui";
  if (diffDays === 1) return "C'est demain";
  if (diffDays <= 7) return `Dans ${diffDays} jours`;
  return null;
}

function getStatusBadge(eventDate: string): { label: string; className: string } {
  const ts = new Date(eventDate).getTime();
  const now = Date.now();

  if (Number.isNaN(ts)) {
    return {
      label: "Date à confirmer",
      className: "bg-gray-700/30 text-gray-200 border-gray-500/30",
    };
  }

  if (ts < now) {
    return {
      label: "Terminé",
      className: "bg-gray-700/40 text-gray-300 border-gray-500/30",
    };
  }

  const diffHours = Math.floor((ts - now) / (1000 * 60 * 60));
  if (diffHours <= 48) {
    return {
      label: "Bientôt",
      className: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    };
  }

  return {
    label: "Nouveau",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  };
}

// ============================================================
// Wrapper fluide (largeur scalable au zoom)
// ============================================================
const PAGE_OUTER_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--ev-px": "clamp(0.75rem, 2vw, 2.5rem)",
  paddingLeft: "var(--ev-px)",
  paddingRight: "var(--ev-px)",
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
// Sous-composants UI (légers)
// ============================================================
type StatPillProps = {
  label: string;
  value: number | string;
  accent: string; // hex/rgba
};

function StatPill({ label, value, accent }: StatPillProps) {
  return (
    <div
      className="rounded-xl border px-3 py-2.5 transition hover:-translate-y-0.5"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 35%, rgba(255,255,255,0.08))`,
        backgroundColor: `color-mix(in srgb, ${accent} 12%, rgba(15,15,18,0.6))`,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white sm:text-xl">{value}</p>
    </div>
  );
}

type HowToCardProps = {
  step: number;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" | "false" }>;
};

function HowToCard({ step, title, description, Icon }: HowToCardProps) {
  return (
    <article
      className="group rounded-2xl border bg-white/[0.02] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/40 sm:p-5"
      style={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 ring-1 ring-violet-400/30 transition group-hover:scale-105"
          aria-hidden
        >
          <Icon className="h-4 w-4 text-violet-200" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300/90">
            Étape {step}
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-white sm:text-base">{title}</h3>
          <p className="mt-1 text-xs leading-snug text-gray-300 sm:text-sm">{description}</p>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// Composant principal
// ============================================================
export default function EvenementsAgendaClient() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"upcoming" | "past" | "all">("all");

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [locationLinks, setLocationLinks] = useState<EventLocationLink[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const browserTimezone = useMemo(() => getBrowserTimezone(), []);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Impossible de charger les événements");
        }
        const data = await response.json();
        setEvents((data.events || []) as EventItem[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [reloadKey]);

  useEffect(() => {
    async function loadMyRegistrations() {
      try {
        const response = await fetch("/api/events/registrations/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!response.ok) {
          if (response.status === 401) {
            setRegisteredEventIds(new Set());
          }
          return;
        }
        const data = await response.json();
        const ids = Array.isArray(data?.registeredEventIds)
          ? data.registeredEventIds.filter((id: unknown): id is string => typeof id === "string")
          : [];
        setRegisteredEventIds(new Set(ids));
      } catch {
        // Best-effort.
      }
    }
    loadMyRegistrations();
  }, []);

  useEffect(() => {
    async function loadLocationLinks() {
      try {
        const response = await fetch("/api/events/location-links", { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json();
        setLocationLinks((data.links || []) as EventLocationLink[]);
      } catch (loadError) {
        console.error("[evenements] Erreur chargement liens de lieux:", loadError);
      }
    }
    loadLocationLinks();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => set.add(event.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [events]);

  const nextEvent = useMemo(() => {
    const now = Date.now();
    return [...events]
      .filter((event) => new Date(event.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
  }, [events]);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((event) => {
        if (selectedCategory !== "all" && event.category !== selectedCategory) return false;
        if (selectedStatus === "upcoming" && new Date(event.date).getTime() < now) return false;
        if (selectedStatus === "past" && new Date(event.date).getTime() >= now) return false;
        if (query.trim()) {
          const q = query.toLowerCase();
          const inTitle = event.title.toLowerCase().includes(q);
          const inDesc = event.description.toLowerCase().includes(q);
          const inCategory = event.category.toLowerCase().includes(q);
          if (!inTitle && !inDesc && !inCategory) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        if (selectedStatus === "past") return db - da;
        return da - db;
      });
  }, [events, selectedCategory, selectedStatus, query]);

  const groupedUpcoming = useMemo(() => {
    const now = Date.now();
    return filteredEvents.filter((event) => new Date(event.date).getTime() >= now);
  }, [filteredEvents]);

  const groupedPast = useMemo(() => {
    const now = Date.now();
    return filteredEvents.filter((event) => new Date(event.date).getTime() < now);
  }, [filteredEvents]);

  const sampledPast = useMemo(() => {
    if (groupedPast.length <= 3) return groupedPast;

    const shuffled = [...groupedPast];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 3);
  }, [groupedPast]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    return days;
  }, [currentMonth]);

  const monthTitle = useMemo(() => {
    return currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [currentMonth]);

  const monthEvents = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    return filteredEvents
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.getFullYear() === year && eventDate.getMonth() === month;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [currentMonth, filteredEvents]);

  const monthStats = useMemo(() => {
    const now = Date.now();
    const upcoming = monthEvents.filter((event) => new Date(event.date).getTime() >= now).length;
    const past = monthEvents.length - upcoming;
    return { total: monthEvents.length, upcoming, past };
  }, [monthEvents]);

  const globalStats = useMemo(() => {
    const now = Date.now();
    const upcoming = events.filter((e) => new Date(e.date).getTime() >= now).length;
    const registeredCount = events.filter((e) => registeredEventIds.has(e.id)).length;
    return {
      upcoming,
      categories: categories.length,
      registered: registeredCount,
    };
  }, [events, registeredEventIds, categories.length]);

  function getEventsForDate(date: Date | null): EventItem[] {
    if (!date) return [];
    return filteredEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  }

  async function handleRegister(eventId: string) {
    try {
      setActionLoading(true);
      setMessage(null);
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (response.ok || response.status === 409) {
        setRegisteredEventIds((prev) => new Set(prev).add(eventId));
        setMessage(
          response.status === 409
            ? "Tu es déjà inscrit·e à cet événement — on se retrouve là-bas !"
            : data.message || "Inscription enregistrée. On compte sur toi !"
        );
        return;
      }
      setMessage(data?.error || "Impossible de finaliser ton inscription pour le moment.");
    } catch {
      setMessage("Petit souci de connexion. Réessaie dans quelques instants.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnregister(eventId: string) {
    try {
      setActionLoading(true);
      setMessage(null);
      const response = await fetch(`/api/events/${eventId}/unregister`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setRegisteredEventIds((prev) => {
          const next = new Set(prev);
          next.delete(eventId);
          return next;
        });
        setMessage(
          data.message ||
            "Désinscription prise en compte. Tu pourras revenir quand tu veux."
        );
        return;
      }
      setMessage(data?.error || "Impossible de finaliser ta désinscription.");
    } catch {
      setMessage("Petit souci de connexion. Réessaie dans quelques instants.");
    } finally {
      setActionLoading(false);
    }
  }

  function openEventModal(event: EventItem) {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setMessage(null);
  }

  function resetFilters() {
    setSelectedStatus("all");
    setSelectedCategory("all");
    setQuery("");
  }

  const hasActiveFilters =
    selectedStatus !== "all" || selectedCategory !== "all" || query.trim() !== "";

  // ============================================================
  // Carte événement (vue liste)
  // ============================================================
  const renderCard = (event: EventItem) => {
    const isRegistered = registeredEventIds.has(event.id);
    const isPast = new Date(event.date).getTime() < Date.now();
    const hasPublicCta = !!event.ctaUrl;
    const hideRegistration = event.isMaskedForAudience === true;
    const categoryLabel = event.isMaskedForAudience ? "Event TENF" : event.category;
    const categoryBadgeClass = event.isMaskedForAudience
      ? "bg-red-600/30 text-red-200 border-red-500/30"
      : categoryColor(event.category);
    const statusBadge = getStatusBadge(event.date);
    const urgency = getUrgencyLabel(event.date);
    const seatsLabel =
      typeof event.remainingSeats === "number"
        ? `${Math.max(0, event.remainingSeats)} place(s) restante(s)`
        : "Places ouvertes";

    return (
      <article
        key={event.id}
        className="group flex flex-col overflow-hidden rounded-2xl border border-gray-700/80 bg-[#17171b] shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all hover:-translate-y-1 hover:border-[#9146ff] hover:shadow-[0_18px_42px_rgba(0,0,0,0.45)]"
      >
        {event.image ? (
          <div className="relative h-36 w-full overflow-hidden bg-[#0e0e10]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.image}
              alt=""
              className="h-full w-full object-contain transition duration-500 group-hover:scale-[1.02]"
            />
            {isRegistered && !isPast ? (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                <ListChecks className="h-3 w-3" aria-hidden />
                Inscrit·e
              </span>
            ) : null}
          </div>
        ) : (
          <div className="relative flex h-36 w-full items-center justify-center bg-gradient-to-br from-[#2a2a2d] to-[#141417]">
            <CalendarDays className="h-10 w-10 text-white/15" aria-hidden />
            {isRegistered && !isPast ? (
              <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/85 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                <ListChecks className="h-3 w-3" aria-hidden />
                Inscrit·e
              </span>
            ) : null}
          </div>
        )}

        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`rounded-full border px-2 py-1 text-xs ${categoryBadgeClass}`}>
              {categoryLabel}
            </span>
            <span className={`rounded-full border px-2 py-1 text-xs ${statusBadge.className}`}>
              {statusBadge.label}
            </span>
          </div>

          <h3 className="line-clamp-2 text-lg font-semibold text-white">{event.title}</h3>
          <EventDateTime startUtc={event.date} className="text-sm text-gray-400" />

          <div className="flex flex-wrap gap-1.5">
            {event.category === "Formation" && event.formationCategory ? (
              <FormationCategoryBadge formationCategory={event.formationCategory} />
            ) : null}
            {urgency ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                <Sparkles className="h-3 w-3" aria-hidden />
                {urgency}
              </span>
            ) : null}
            {!isPast ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-200">
                <Users className="h-3 w-3" aria-hidden />
                {seatsLabel}
              </span>
            ) : null}
          </div>

          <p className="line-clamp-3 whitespace-pre-wrap text-sm text-gray-300">
            {event.description ||
              "L'équipe TENF prépare cette rencontre. Le programme arrive très bientôt — reviens y jeter un œil."}
          </p>

          <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => openEventModal(event)}
              aria-label={`Voir le détail de ${event.title}`}
              className="inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-gray-600 bg-[#2a2a2d] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#9146ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:w-auto"
            >
              Voir le détail
            </button>
            <a
              href={calendarUrlForEvent(event)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg bg-[#9146ff] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#7c3aed] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              Ajouter à mon agenda
            </a>
            {hasPublicCta ? (
              <a
                href={event.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-gray-600 bg-[#2a2a2d] px-3 py-2 text-sm font-semibold text-white transition hover:border-[#9146ff] sm:w-auto"
              >
                {event.ctaLabel || "En savoir plus"}
              </a>
            ) : null}
            {!isPast && !hideRegistration ? (
              <button
                type="button"
                onClick={() => (isRegistered ? handleUnregister(event.id) : handleRegister(event.id))}
                disabled={actionLoading}
                aria-pressed={isRegistered}
                className={`inline-flex w-full min-h-[42px] items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
                  isRegistered
                    ? "bg-red-600/85 hover:bg-red-600"
                    : "bg-emerald-600/90 hover:bg-emerald-600"
                }`}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {isRegistered ? "Je me désinscris" : "Je participe"}
              </button>
            ) : null}
          </div>
        </div>
      </article>
    );
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <main className="min-h-screen text-white" style={PAGE_OUTER_STYLE}>
      <div className="flex flex-col gap-6" style={PAGE_INNER_STYLE}>
        {/* ---------- Hero ---------- */}
        <section
          aria-labelledby="ev-hero-title"
          className="rounded-3xl border border-violet-400/30 bg-[radial-gradient(circle_at_top_right,rgba(145,70,255,0.28),transparent_45%),linear-gradient(145deg,#181821_0%,#121218_100%)] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-100 sm:text-xs">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Agenda communautaire
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-gray-300 sm:text-xs">
                  <CalendarRange className="h-3 w-3" aria-hidden />
                  Mis à jour en continu
                </span>
              </div>

              <h1
                id="ev-hero-title"
                className="max-w-4xl text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
              >
                Les rendez-vous de la family
              </h1>
              <p className="max-w-3xl text-base font-semibold leading-relaxed text-gray-100 sm:text-xl">
                Soirées film, formations, spotlights, apéros, sessions jeux… tous les temps forts TENF, au même endroit.
              </p>
              <p className="max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
                Choisis ce qui te tente, ajoute-le à ton agenda et inscris-toi en deux clics. Tu peux te désinscrire à tout moment — aucune pression, juste l&apos;envie de partager un bon moment.
              </p>

              {/* Prochain event */}
              {nextEvent ? (
                <button
                  type="button"
                  onClick={() => openEventModal(nextEvent)}
                  className="inline-flex max-w-full items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-left text-sm text-gray-100 transition hover:border-violet-300 hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                  aria-label={`Voir le détail du prochain événement : ${nextEvent.title}`}
                >
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-300 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-300" />
                  </span>
                  <span className="truncate">
                    Prochain :{" "}
                    <span className="font-semibold text-white">{nextEvent.title}</span>
                    {" · "}
                    {formatEventDateTimeInTimezone(nextEvent.date, browserTimezone, "fr-FR").fullLabel}
                  </span>
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  Aucun événement à venir pour le moment — repasse vite, le calendrier bouge souvent !
                </p>
              )}

              {/* CTAs */}
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus("upcoming");
                    setSelectedCategory("all");
                    setViewMode("calendar");
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Voir les prochains rendez-vous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus("all");
                    setSelectedCategory("all");
                    setQuery("");
                    setViewMode("list");
                  }}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-100 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Explorer toutes les animations
                </button>
                <a
                  href="/evenements-communautaires"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-white/0 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:border-violet-400/40 hover:text-white"
                >
                  Découvrir l&apos;univers communautaire
                </a>
              </div>
            </div>

            {/* Mini-stats */}
            <aside aria-label="Statistiques de l'agenda" className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
              <StatPill label="À venir" value={globalStats.upcoming} accent="#a78bfa" />
              <StatPill label="Catégories" value={globalStats.categories} accent="#34d399" />
              <StatPill label="Tes inscriptions" value={globalStats.registered} accent="#fb923c" />
            </aside>
          </div>
        </section>

        {/* ---------- Comment ça marche ---------- */}
        <section aria-labelledby="ev-howto-title" className="space-y-3">
          <h2
            id="ev-howto-title"
            className="text-sm font-bold uppercase tracking-[0.14em] text-violet-200/90"
          >
            En trois secondes
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <HowToCard
              step={1}
              Icon={Filter}
              title="Tu filtres"
              description="Catégorie, statut, mots-clés : on affine la vue pour ne voir que ce qui te concerne vraiment."
            />
            <HowToCard
              step={2}
              Icon={CalendarDays}
              title="Tu choisis"
              description="Vue calendrier pour repérer la date, vue cartes pour comparer les programmes. Clique sur un event pour ouvrir le détail."
            />
            <HowToCard
              step={3}
              Icon={CalendarPlus}
              title="Tu participes"
              description="Inscris-toi en un clic, ajoute l'event à Google Calendar, ou repasse plus tard — zéro engagement forcé."
            />
          </div>
        </section>

        {/* ---------- Message inline ---------- */}
        {message ? (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start justify-between gap-3 rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm text-violet-100"
          >
            <p className="leading-relaxed">{message}</p>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Fermer le message"
              className="shrink-0 rounded-md p-1 text-violet-200 transition hover:bg-violet-500/20 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}

        {/* ---------- Barre de filtres ---------- */}
        <section
          aria-label="Filtres et recherche"
          className="sticky top-20 z-20 space-y-3 rounded-2xl border border-white/10 bg-[#111117]/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:space-y-4"
        >
          {/* Statut */}
          <div
            role="tablist"
            aria-label="Filtrer par statut"
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scroll-smooth snap-x snap-mandatory sm:flex-wrap sm:overflow-visible [&>button]:snap-start"
          >
            {statusFilters.map((filter) => {
              const isActive = selectedStatus === filter.id;
              return (
                <button
                  key={filter.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold transition min-h-[42px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                    isActive
                      ? "border-[#9146ff] bg-[#9146ff] text-white shadow-[0_6px_18px_rgba(145,70,255,0.35)]"
                      : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#9146ff] hover:text-white"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>

          {/* Catégories */}
          {categories.length > 0 ? (
            <div
              role="tablist"
              aria-label="Filtrer par catégorie"
              className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scroll-smooth snap-x snap-mandatory sm:flex-wrap sm:overflow-visible [&>button]:snap-start"
            >
              <button
                role="tab"
                aria-selected={selectedCategory === "all"}
                onClick={() => setSelectedCategory("all")}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition min-h-[42px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                  selectedCategory === "all"
                    ? "border-[#9146ff] bg-[#2f1f52] text-white"
                    : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#9146ff] hover:text-white"
                }`}
              >
                Toutes les catégories
              </button>
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-sm transition min-h-[42px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                      isActive
                        ? "border-[#9146ff] bg-[#2f1f52] text-white"
                        : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#9146ff] hover:text-white"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${categoryDotColor(category)}`}
                      aria-hidden
                    />
                    {category}
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Recherche + vues + actions */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
            <label className="relative flex-1 md:max-w-md">
              <span className="sr-only">Rechercher un événement</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher (titre, description, catégorie)…"
                className="w-full rounded-lg border border-gray-700 bg-[#0e0e10] py-2 pl-9 pr-9 text-sm text-white placeholder:text-gray-500 focus-visible:border-violet-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Effacer la recherche"
                  className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-white/5 hover:text-white"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              ) : null}
            </label>

            <div
              role="tablist"
              aria-label="Mode d'affichage"
              className="flex gap-2"
            >
              {viewModes.map((mode) => {
                const isActive = viewMode === mode.id;
                const Icon = mode.Icon;
                return (
                  <button
                    key={mode.id}
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setViewMode(mode.id)}
                    className={`inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
                      isActive
                        ? "border-[#9146ff] bg-[#9146ff] text-white shadow-[0_6px_18px_rgba(145,70,255,0.35)]"
                        : "border-gray-700 bg-[#0e0e10] text-gray-300 hover:border-[#9146ff] hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 md:ml-auto">
              <a
                href="/evenements-communautaires#proposer-evenement"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-[#9146ff] hover:text-white"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Proposer un événement
              </a>
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                aria-label="Réinitialiser les filtres"
                className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-gray-700 bg-[#0e0e10] px-3 py-2 text-sm font-semibold text-gray-300 transition hover:border-violet-400/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            </div>
          </div>
        </section>

        {/* ---------- Vue calendrier ---------- */}
        {viewMode === "calendar" ? (
          <section
            aria-labelledby="ev-calendar-title"
            className="space-y-5 rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(145,70,255,0.08),rgba(15,15,18,0.95)_28%)] p-4 shadow-[0_14px_40px_rgba(0,0,0,0.35)] sm:p-6"
          >
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2
                  id="ev-calendar-title"
                  className="text-2xl font-semibold capitalize tracking-tight sm:text-3xl"
                >
                  {monthTitle}
                </h2>
                <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                  Une vue simple pour repérer rapidement les dates qui comptent.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    )
                  }
                  aria-label="Mois précédent"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-[#0e0e10] text-sm transition hover:border-[#9146ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date())}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-violet-400/50 bg-violet-500/20 px-3 py-2 text-sm text-violet-100 transition hover:bg-violet-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Aujourd&apos;hui
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentMonth(
                      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    )
                  }
                  aria-label="Mois suivant"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-700 bg-[#0e0e10] text-sm transition hover:border-[#9146ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatPill label="Total ce mois" value={monthStats.total} accent="#a78bfa" />
              <StatPill label="À venir" value={monthStats.upcoming} accent="#34d399" />
              <StatPill label="Terminés" value={monthStats.past} accent="#9ca3af" />
            </div>

            {categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 12).map((category) => (
                  <span
                    key={`legend-${category}`}
                    className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-[#0f0f13] px-2.5 py-1 text-xs text-gray-200"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${categoryDotColor(category)}`}
                      aria-hidden
                    />
                    {category}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Grille jours desktop */}
            <div
              className="hidden grid-cols-7 gap-2 text-xs text-gray-400 md:grid md:text-sm"
              aria-hidden
            >
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div
                  key={day}
                  className="rounded-lg border border-white/5 bg-white/[0.02] py-2 text-center font-semibold"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Vue mobile : liste verticale */}
            <div className="space-y-2 md:hidden">
              {monthEvents.length > 0 ? (
                monthEvents.map((event) => {
                  const isRegistered = registeredEventIds.has(event.id);
                  return (
                    <button
                      key={`mobile-month-${event.id}`}
                      type="button"
                      onClick={() => openEventModal(event)}
                      className="w-full rounded-xl border border-gray-700 bg-[#0e0e10] px-3 py-3 text-left transition hover:border-violet-400/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold text-white">
                          {event.title}
                        </p>
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${categoryDotColor(event.category)}`}
                          aria-hidden
                        />
                      </div>
                      <EventDateTime startUtc={event.date} className="text-xs text-gray-300" />
                      {isRegistered ? (
                        <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                          <ListChecks className="h-3 w-3" aria-hidden />
                          Inscrit·e
                        </span>
                      ) : null}
                    </button>
                  );
                })
              ) : (
                <p className="rounded-xl border border-gray-700 bg-[#0e0e10] px-3 py-4 text-center text-sm text-gray-400">
                  Aucun événement prévu ce mois-ci. Profite-en pour explorer les terminés ou propose le tien !
                </p>
              )}
            </div>

            {/* Grille calendrier desktop */}
            <div className="hidden grid-cols-7 gap-2 md:grid">
              {calendarDays.map((date, idx) => {
                const dayEvents = getEventsForDate(date);
                const isToday =
                  !!date &&
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                return (
                  <div
                    key={`${idx}-${date ? date.toISOString() : "empty"}`}
                    className={`min-h-[124px] rounded-xl border p-2.5 transition-all md:min-h-[148px] ${
                      date
                        ? "border-gray-800 bg-[#0d0d12] hover:border-violet-500/50"
                        : "border-transparent bg-transparent"
                    } ${
                      isToday
                        ? "ring-1 ring-violet-400/80 shadow-[0_0_0_1px_rgba(145,70,255,0.25)_inset]"
                        : ""
                    }`}
                  >
                    {date ? (
                      <>
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-xs ${
                              isToday
                                ? "bg-violet-500/20 font-semibold text-violet-200"
                                : "bg-white/5 text-gray-300"
                            }`}
                            aria-label={
                              isToday
                                ? `Aujourd'hui, ${date.toLocaleDateString("fr-FR")}`
                                : date.toLocaleDateString("fr-FR")
                            }
                          >
                            {date.getDate()}
                          </span>
                          {dayEvents.length > 0 ? (
                            <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-200">
                              {dayEvents.length}
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-1.5 pr-0.5">
                          {dayEvents.slice(0, 3).map((event) => {
                            const isRegistered = registeredEventIds.has(event.id);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openEventModal(event)}
                                title={event.title}
                                aria-label={`${event.title} à ${formatHour(event.date)} — voir le détail`}
                                className="block w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left text-[10px] transition hover:bg-white/[0.07] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 md:text-[11px]"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full ${categoryDotColor(event.category)}`}
                                    aria-hidden
                                  />
                                  <span className="tabular-nums text-gray-300">
                                    {formatHour(event.date)}
                                  </span>
                                  {isRegistered ? (
                                    <ListChecks
                                      className="ml-auto h-3 w-3 text-emerald-300"
                                      aria-label="Inscrit·e"
                                    />
                                  ) : null}
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-gray-100">
                                  {event.title}
                                </p>
                              </button>
                            );
                          })}
                          {dayEvents.length > 3 ? (
                            <button
                              type="button"
                              onClick={() => openEventModal(dayEvents[0])}
                              className="w-full text-left text-[10px] text-violet-300 transition hover:text-violet-200 md:text-xs"
                            >
                              +{dayEvents.length - 3} autre(s)
                            </button>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* ---------- Listes / cartes ---------- */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-700 bg-[#1a1a1d]"
              >
                <div className="h-36 animate-pulse bg-[#2a2a2d]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[#2a2a2d]" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-[#2a2a2d]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#2a2a2d]" />
                  <div className="h-4 w-full animate-pulse rounded bg-[#2a2a2d]" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-[#2a2a2d]" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="space-y-3 rounded-2xl border border-red-500/40 bg-red-900/20 px-5 py-5 text-sm text-red-100">
            <p className="font-semibold">
              On n&apos;a pas pu récupérer les événements pour l&apos;instant.
            </p>
            <p className="text-red-200/90">Raison technique : {error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
            >
              <RefreshCcw className="h-4 w-4" aria-hidden />
              Réessayer
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="space-y-3 rounded-2xl border border-gray-700 bg-[#17171b] px-5 py-6 text-sm text-gray-300">
            <p className="font-semibold text-white">
              Aucun événement ne correspond à tes filtres.
            </p>
            <p>
              Essaie de relâcher un peu les critères ou repasse dans quelques jours — le calendrier bouge souvent.
            </p>
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-2 text-sm font-semibold text-violet-100 transition hover:bg-violet-500/25"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden />
                Réinitialiser les filtres
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-8">
            {(selectedStatus === "all" || selectedStatus === "upcoming") &&
            groupedUpcoming.length > 0 ? (
              <section className="space-y-4" aria-labelledby="ev-upcoming-title">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2
                      id="ev-upcoming-title"
                      className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      À venir
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                      {groupedUpcoming.length} rendez-vous prêt(s) à rejoindre.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {groupedUpcoming.map(renderCard)}
                </div>
              </section>
            ) : null}

            {(selectedStatus === "all" || selectedStatus === "past") &&
            sampledPast.length > 0 ? (
              <section className="space-y-4" aria-labelledby="ev-past-title">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <h2
                      id="ev-past-title"
                      className="text-2xl font-semibold tracking-tight sm:text-3xl"
                    >
                      Souvenirs récents
                    </h2>
                    <p className="mt-0.5 text-xs text-gray-400 sm:text-sm">
                      Petit aperçu de ce que la communauté a vécu dernièrement.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {sampledPast.map(renderCard)}
                </div>
              </section>
            ) : null}
          </div>
        )}

        {/* ---------- Modal détail ---------- */}
        {isModalOpen && selectedEvent ? (
          <EventDetailModal
            event={selectedEvent}
            open={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            calendarUrl={calendarUrlForEvent(selectedEvent)}
            locationLinks={locationLinks}
            categoryBadgeClass={
              selectedEvent.isMaskedForAudience
                ? "bg-red-600/30 text-red-200 border-red-500/30"
                : categoryColor(selectedEvent.category)
            }
            categoryLabel={
              selectedEvent.isMaskedForAudience ? "Event TENF" : selectedEvent.category
            }
            statusBadge={getStatusBadge(selectedEvent.date)}
            urgencyLabel={getUrgencyLabel(selectedEvent.date)}
            isRegistered={registeredEventIds.has(selectedEvent.id)}
            isPast={new Date(selectedEvent.date).getTime() < Date.now()}
            hideRegistration={selectedEvent.isMaskedForAudience === true}
            actionLoading={actionLoading}
            onRegister={() => handleRegister(selectedEvent.id)}
            onUnregister={() => handleUnregister(selectedEvent.id)}
            browserTimezone={browserTimezone}
          />
        ) : null}
      </div>
    </main>
  );
}
