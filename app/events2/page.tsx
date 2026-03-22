"use client";

import React, { useEffect, useMemo, useState } from "react";
import EventDateTime from "@/components/EventDateTime";
import { formatEventDateTimeInTimezone, getBrowserTimezone } from "@/lib/timezone";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildEventLocationDisplay, type EventLocationLink } from "@/lib/eventLocation";

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
};

const statusFilters = [
  { id: "all", label: "Tous" },
  { id: "upcoming", label: "A venir" },
  { id: "past", label: "Termines" },
] as const;

const viewModes = [
  { id: "calendar", label: "Calendrier" },
  { id: "list", label: "Liste" },
] as const;

function calendarUrlForEvent(event: EventItem): string {
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
  if (diffDays === 0) return "Debute aujourd'hui";
  if (diffDays === 1) return "Debute demain";
  if (diffDays <= 7) return `Debute dans ${diffDays} jours`;
  return null;
}

function getStatusBadge(eventDate: string): { label: string; className: string } {
  const ts = new Date(eventDate).getTime();
  const now = Date.now();

  if (Number.isNaN(ts)) {
    return {
      label: "Date a confirmer",
      className: "bg-gray-700/30 text-gray-200 border-gray-500/30",
    };
  }

  if (ts < now) {
    return {
      label: "Termine",
      className: "bg-gray-700/40 text-gray-300 border-gray-500/30",
    };
  }

  const diffHours = Math.floor((ts - now) / (1000 * 60 * 60));
  if (diffHours <= 48) {
    return {
      label: "Bientot",
      className: "bg-amber-500/20 text-amber-200 border-amber-400/30",
    };
  }

  return {
    label: "Nouveau",
    className: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  };
}

export default function Events2Page() {
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
  const browserTimezone = useMemo(() => getBrowserTimezone(), []);

  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/events", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Impossible de charger les evenements");
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
  }, []);

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
        // Best-effort: garde un état vide si la récupération échoue.
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
        console.error("[events2] Erreur chargement liens de lieux:", loadError);
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
        setMessage(response.status === 409 ? "Tu es deja inscrit a cet evenement." : data.message || "Inscription enregistree.");
        return;
      }
      setMessage(data?.error || "Erreur lors de l'inscription.");
    } catch {
      setMessage("Erreur reseau lors de l'inscription.");
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
        setMessage(data.message || "Desinscription enregistree.");
        return;
      }
      setMessage(data?.error || "Erreur lors de la desinscription.");
    } catch {
      setMessage("Erreur reseau lors de la desinscription.");
    } finally {
      setActionLoading(false);
    }
  }

  function openEventModal(event: EventItem) {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setMessage(null);
  }

  function MarkdownDescription({ value, className }: { value: string; className?: string }) {
    if (!value?.trim()) {
      return <p className={className}>Aucune description.</p>;
    }

    return (
      <div className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      </div>
    );
  }

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
      <div
        key={event.id}
        className="rounded-2xl border border-gray-700/80 bg-[#17171b] overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:border-[#9146ff] transition-all"
      >
        {event.image ? (
          <div className="w-full h-36 bg-[#0e0e10] flex items-center justify-center">
            <img src={event.image} alt={event.title} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-full h-36 bg-gradient-to-br from-[#2a2a2d] to-[#141417]" />
        )}

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${categoryBadgeClass}`}>{categoryLabel}</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${statusBadge.className}`}>{statusBadge.label}</span>
          </div>

          <h3 className="text-lg font-semibold text-white line-clamp-2">{event.title}</h3>
          <EventDateTime startUtc={event.date} className="text-sm text-gray-400" />
          {urgency && <p className="text-xs text-amber-300">{urgency}</p>}
          {!isPast && <p className="text-xs text-emerald-300">{seatsLabel}</p>}
          <p className="text-sm text-gray-300 line-clamp-3 whitespace-pre-wrap">{event.description || "Aucune description."}</p>

          <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap">
            <button
              onClick={() => openEventModal(event)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-semibold bg-[#2a2a2d] border border-gray-600 hover:border-[#9146ff]"
            >
              Voir details
            </button>
            <a
              href={calendarUrlForEvent(event)}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-semibold bg-[#9146ff] hover:bg-[#7c3aed] text-white text-center"
            >
              Ajouter au calendrier
            </a>
            {hasPublicCta && (
              <a
                href={event.ctaUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-semibold bg-[#2a2a2d] border border-gray-600 hover:border-[#9146ff] text-white text-center"
              >
                {event.ctaLabel || "En savoir plus"}
              </a>
            )}
            {!isPast && !hideRegistration && (
              <button
                onClick={() => (isRegistered ? handleUnregister(event.id) : handleRegister(event.id))}
                disabled={actionLoading}
                className={`w-full sm:w-auto px-3 py-2 rounded-lg text-sm font-semibold ${
                  isRegistered ? "bg-red-600/80 hover:bg-red-600 text-white" : "bg-[#9146ff] hover:bg-[#7c3aed] text-white"
                }`}
              >
                {isRegistered ? "Se desinscrire" : "S'inscrire"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white pb-8">
      <div className="rounded-3xl border border-violet-400/30 bg-[radial-gradient(circle_at_top_right,rgba(145,70,255,0.25),transparent_45%),linear-gradient(145deg,#181821_0%,#121218_100%)] p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-2">Calendrier des evenements TENF</h1>
            <p className="text-gray-200/90 mb-3">
              Page action: filtre, trouve un event, inscris-toi et gere tes participations en quelques clics.
            </p>
            {nextEvent ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-sm text-gray-100">
                <span className="h-2 w-2 rounded-full bg-violet-300" />
                Prochain evenement:{" "}
                <span className="font-semibold text-white">{nextEvent.title}</span>
                {" - "}
                {formatEventDateTimeInTimezone(nextEvent.date, browserTimezone, "fr-FR").fullLabel}
              </div>
            ) : (
              <div className="text-sm text-gray-400">Aucun evenement a venir pour le moment.</div>
            )}
          </div>
          <a
            href="/evenements-communautaires"
            className="text-sm px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:text-white hover:border-violet-400/40"
          >
            Decouvrir l'univers communautaire
          </a>
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-900/20 text-blue-200 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      <div className="sticky top-20 z-20 rounded-2xl border border-white/10 bg-[#111117]/90 backdrop-blur-xl p-4 space-y-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>button]:snap-start sm:flex-wrap sm:overflow-visible">
          {statusFilters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setSelectedStatus(filter.id)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold border min-h-[42px] ${
                selectedStatus === filter.id
                  ? "bg-[#9146ff] border-[#9146ff] text-white"
                  : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory [&>button]:snap-start sm:flex-wrap sm:overflow-visible">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm border min-h-[42px] ${
              selectedCategory === "all" ? "bg-[#2f1f52] border-[#9146ff] text-white" : "bg-[#0e0e10] border-gray-700 text-gray-300"
            }`}
          >
            Toutes les categories
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`shrink-0 whitespace-nowrap px-3 py-2 rounded-lg text-sm border min-h-[42px] ${
                selectedCategory === category ? "bg-[#2f1f52] border-[#9146ff] text-white" : "bg-[#0e0e10] border-gray-700 text-gray-300"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un evenement..."
            className="w-full md:w-[420px] bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
          />
          <div className="flex gap-2">
            {viewModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                  viewMode === mode.id
                    ? "bg-[#9146ff] border-[#9146ff] text-white"
                    : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <a
            href="/evenements-communautaires#proposer-evenement"
            className="md:ml-auto text-sm px-3 py-2 rounded-lg border border-gray-700 text-gray-300 hover:border-[#9146ff] hover:text-white"
          >
            Proposer un evenement
          </a>
        </div>
      </div>

      {viewMode === "calendar" && (
        <div className="rounded-3xl border border-white/10 bg-[linear-gradient(160deg,rgba(145,70,255,0.08),rgba(15,15,18,0.95)_28%)] p-4 md:p-6 space-y-5 shadow-[0_14px_40px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-2xl font-semibold capitalize tracking-tight">Calendrier - {monthTitle}</h2>
              <p className="text-xs text-gray-400 mt-1">Vue mensuelle premium pour suivre les temps forts de la communaute.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                className="px-3 py-2 rounded-lg text-sm bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff] transition-colors"
              >
                ← Mois precedent
              </button>
              <button
                onClick={() => setCurrentMonth(new Date())}
                className="px-3 py-2 rounded-lg text-sm bg-violet-500/20 border border-violet-400/50 text-violet-100 hover:bg-violet-500/30 transition-colors"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                className="px-3 py-2 rounded-lg text-sm bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff] transition-colors"
              >
                Mois suivant →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-3">
              <p className="text-xs text-violet-200/80">Total ce mois</p>
              <p className="text-xl font-semibold">{monthStats.total}</p>
            </div>
            <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
              <p className="text-xs text-emerald-200/80">A venir</p>
              <p className="text-xl font-semibold">{monthStats.upcoming}</p>
            </div>
            <div className="rounded-xl border border-gray-500/30 bg-gray-500/10 px-4 py-3">
              <p className="text-xs text-gray-300/90">Termines</p>
              <p className="text-xl font-semibold">{monthStats.past}</p>
            </div>
          </div>

          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.slice(0, 8).map((category) => (
                <span key={`legend-${category}`} className="inline-flex items-center gap-2 rounded-full border border-gray-700 bg-[#0f0f13] px-2.5 py-1 text-xs text-gray-200">
                  <span className={`h-2 w-2 rounded-full ${categoryDotColor(category)}`} />
                  {category}
                </span>
              ))}
            </div>
          )}

          <div className="hidden md:grid grid-cols-7 gap-2 text-xs md:text-sm text-gray-400">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
              <div key={day} className="text-center py-2 rounded-lg border border-white/5 bg-white/[0.02]">
                {day}
              </div>
            ))}
          </div>

          <div className="md:hidden space-y-2">
            {monthEvents.length > 0 ? (
              monthEvents.map((event) => (
                <button
                  key={`mobile-month-${event.id}`}
                  onClick={() => openEventModal(event)}
                  className="w-full rounded-xl border border-gray-700 bg-[#0e0e10] px-3 py-3 text-left"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-white line-clamp-1">{event.title}</p>
                    <span className={`h-2 w-2 rounded-full ${categoryDotColor(event.category)}`} />
                  </div>
                  <EventDateTime startUtc={event.date} className="text-xs text-gray-300" />
                </button>
              ))
            ) : (
              <p className="text-sm text-gray-400">Aucun événement sur ce mois.</p>
            )}
          </div>

          <div className="hidden md:grid grid-cols-7 gap-2">
            {calendarDays.map((date, idx) => {
              const dayEvents = getEventsForDate(date);
              const isToday =
                date &&
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();
              return (
                <div
                  key={`${idx}-${date ? date.toISOString() : "empty"}`}
                  className={`min-h-[124px] md:min-h-[148px] rounded-xl border p-2.5 transition-all ${
                    date ? "bg-[#0d0d12] border-gray-800 hover:border-violet-500/50" : "border-transparent"
                  } ${isToday ? "ring-1 ring-violet-400/80 shadow-[0_0_0_1px_rgba(145,70,255,0.25)_inset]" : ""}`}
                >
                  {date && (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-xs ${
                            isToday ? "bg-violet-500/20 text-violet-200 font-semibold" : "bg-white/5 text-gray-300"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200">
                            {dayEvents.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1.5 pr-0.5">
                        {dayEvents.slice(0, 3).map((event) => (
                          <button
                            key={event.id}
                            onClick={() => openEventModal(event)}
                            className="w-full text-left text-[10px] md:text-[11px] px-2 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                            title={event.title}
                          >
                            <div className="flex items-center gap-1.5">
                              <span className={`h-1.5 w-1.5 rounded-full ${categoryDotColor(event.category)}`} />
                              <span className="text-gray-300 tabular-nums">{formatHour(event.date)}</span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-gray-100">{event.title}</p>
                          </button>
                        ))}
                        {dayEvents.length > 3 && (
                          <button
                            onClick={() => openEventModal(dayEvents[0])}
                            className="w-full text-left text-[10px] md:text-xs text-violet-300 px-1 hover:text-violet-200"
                          >
                            +{dayEvents.length - 3} autre(s)
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-700 bg-[#1a1a1d] overflow-hidden animate-pulse">
              <div className="h-32 bg-[#2a2a2d]" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-2/3 bg-[#2a2a2d] rounded" />
                <div className="h-4 w-1/2 bg-[#2a2a2d] rounded" />
                <div className="h-4 w-full bg-[#2a2a2d] rounded" />
                <div className="h-4 w-5/6 bg-[#2a2a2d] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-900/20 text-red-200 px-4 py-4 text-sm">
          Impossible d'afficher les evenements pour le moment: {error}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-gray-700 bg-[#17171b] px-4 py-6 text-sm text-gray-300">
          Aucun evenement ne correspond a tes filtres. Essaie de supprimer un filtre ou de changer de vue.
        </div>
      ) : (
        <div className="space-y-8">
          {(selectedStatus === "all" || selectedStatus === "upcoming") && groupedUpcoming.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">A venir</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 gap-5">{groupedUpcoming.map(renderCard)}</div>
            </section>
          )}

          {(selectedStatus === "all" || selectedStatus === "past") && sampledPast.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">Termines</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-2 xl:grid-cols-3 gap-5">{sampledPast.map(renderCard)}</div>
            </section>
          )}
        </div>
      )}

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-[#1a1a1d]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image && (
              <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-auto max-h-[260px] object-contain bg-[#0e0e10]" />
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
              <span
                className={`inline-block text-xs px-2 py-1 rounded-full border ${
                  selectedEvent.isMaskedForAudience
                    ? "bg-red-600/30 text-red-200 border-red-500/30"
                    : categoryColor(selectedEvent.category)
                }`}
              >
                {selectedEvent.isMaskedForAudience ? "Event TENF" : selectedEvent.category}
              </span>
              <EventDateTime startUtc={selectedEvent.date} className="text-sm text-gray-300" />
              <MarkdownDescription
                value={selectedEvent.description || ""}
                className="prose prose-invert max-w-none prose-p:my-2 prose-li:my-1 prose-headings:text-white prose-p:text-gray-200 prose-strong:text-white prose-em:text-gray-200 prose-a:text-[#9146ff] prose-a:hover:text-[#7c3aed] prose-ul:text-gray-200 prose-ol:text-gray-200 prose-li:text-gray-200"
              />
              {selectedEvent.location && (
                <p className="text-sm text-gray-300">
                  {(() => {
                    const display = buildEventLocationDisplay(selectedEvent.location, locationLinks);
                    if (!display) return null;
                    return (
                      <>
                        Lieu:{" "}
                        <a className="text-[#9146ff] hover:text-[#7c3aed] break-all" href={display.url} target="_blank" rel="noreferrer">
                          {display.label}
                        </a>
                      </>
                    );
                  })()}
                </p>
              )}

              <div className="pt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <a
                  href={calendarUrlForEvent(selectedEvent)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2a2a2d] border border-gray-600 hover:border-[#9146ff] text-white font-semibold text-center"
                >
                  Ajouter au calendrier
                </a>
                {selectedEvent.ctaUrl && (
                  <a
                    href={selectedEvent.ctaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#2a2a2d] border border-gray-600 hover:border-[#9146ff] text-white font-semibold text-center"
                  >
                    {selectedEvent.ctaLabel || "En savoir plus"}
                  </a>
                )}
                {new Date(selectedEvent.date).getTime() >= Date.now() ? (
                  !selectedEvent.isMaskedForAudience &&
                  (registeredEventIds.has(selectedEvent.id) ? (
                    <button
                      onClick={() => handleUnregister(selectedEvent.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Se desinscrire
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(selectedEvent.id)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold"
                    >
                      S'inscrire
                    </button>
                  ))
                ) : (
                  <span className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg border border-gray-600 bg-[#111116] px-4 py-2 text-sm text-gray-300">
                    Evenement termine
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

