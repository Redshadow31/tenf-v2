"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  HeartHandshake,
  LayoutGrid,
  ListChecks,
  RefreshCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import EventDateTime from "@/components/EventDateTime";
import { formatEventDateTimeInTimezone, getBrowserTimezone } from "@/lib/timezone";
import EventDetailModal from "@/components/events2/EventDetailModal";
import EvenementsEventCard from "@/components/events2/EvenementsEventCard";
import theme from "@/components/events2/evenements-theme.module.css";
import {
  calendarUrlForEvent,
  categoryColor,
  categoryDotColor,
  formatHour,
  getStatusBadge,
  getUrgencyLabel,
  type EventItem,
} from "@/components/events2/evenementsAgendaUtils";
import type { EventLocationLink } from "@/lib/eventLocation";

const statusFilters = [
  { id: "all", label: "Tous" },
  { id: "upcoming", label: "À venir" },
  { id: "past", label: "Terminés" },
] as const;

const viewModes = [
  { id: "calendar", label: "Calendrier", Icon: CalendarDays },
  { id: "list", label: "Cartes", Icon: LayoutGrid },
] as const;

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

function StatPill({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div
      className={theme.statPill}
      style={{
        borderColor: `color-mix(in srgb, ${accent} 32%, rgba(255,255,255,0.1))`,
        background: `color-mix(in srgb, ${accent} 10%, rgba(255,255,255,0.03))`,
      }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: accent }}>
        {label}
      </p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-white sm:text-xl">{value}</p>
    </div>
  );
}

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
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);
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
        body: JSON.stringify({ privacyConsent: true }),
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

  const selectedDayEvents = useMemo(() => getEventsForDate(selectedCalendarDay), [selectedCalendarDay, filteredEvents]);

  useEffect(() => {
    setSelectedCalendarDay(null);
  }, [currentMonth, selectedCategory, selectedStatus, query]);

  function renderCard(event: EventItem) {
    const isRegistered = registeredEventIds.has(event.id);
    const isPast = new Date(event.date).getTime() < Date.now();
    return (
      <EvenementsEventCard
        key={event.id}
        event={event}
        isRegistered={isRegistered}
        isPast={isPast}
        actionLoading={actionLoading}
        onOpenDetail={openEventModal}
        onRegister={handleRegister}
        onUnregister={handleUnregister}
      />
    );
  }

  function toggleCategoryFilter(category: string) {
    setSelectedCategory((current) => (current === category ? "all" : category));
  }

  // ============================================================
  // Render
  // ============================================================
  return (
    <main className="min-h-screen text-white" style={PAGE_OUTER_STYLE}>
      <div className="flex flex-col gap-6" style={PAGE_INNER_STYLE}>
        {/* Hero */}
        <section className={`${theme.panel} ${theme.panelPaddingLg}`} aria-labelledby="ev-hero-title">
          <div className={theme.panelOrbViolet} aria-hidden />
          <div className={theme.panelOrbPink} aria-hidden />
          <div className={`${theme.panelInner} grid gap-6 lg:grid-cols-[1.45fr_1fr] lg:items-center`}>
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={theme.badgeViolet}>
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Agenda communautaire
                </span>
                <span className={`${theme.badgeViolet} ${theme.badgePink}`}>
                  <CalendarRange className="h-3 w-3" aria-hidden />
                  Mis à jour en continu
                </span>
              </div>
              <h1
                id="ev-hero-title"
                className="max-w-4xl text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
              >
                Les rendez-vous de la{" "}
                <span className={theme.titleGradient}>New Family</span>
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-zinc-200 sm:text-lg">
                Soirées film, formations, spotlights, apéros, jeux… un seul agenda pour retrouver toute la communauté TENF.
              </p>
              <p className="max-w-2xl text-sm text-zinc-400">
                Filtre, explore le calendrier ou les cartes, inscris-toi en deux clics — tu peux te désinscrire quand tu veux.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus("upcoming");
                    setSelectedCategory("all");
                    setViewMode("calendar");
                  }}
                  className={theme.btnPrimary}
                >
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  Prochains rendez-vous
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStatus("all");
                    setQuery("");
                    setViewMode("list");
                  }}
                  className={theme.btnSecondary}
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden />
                  Vue cartes
                </button>
                <a href="/evenements-communautaires" className={theme.btnSecondary}>
                  Proposer un événement
                </a>
              </div>
            </div>
            <aside className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3" aria-label="Statistiques">
              <StatPill label="À venir" value={globalStats.upcoming} accent="#c4b5fd" />
              <StatPill label="Catégories" value={globalStats.categories} accent="#f9a8d4" />
              <StatPill label="Inscriptions" value={globalStats.registered} accent="#fda4af" />
            </aside>
          </div>
        </section>

        {/* Prochain événement — mise en avant */}
        {nextEvent ? (
          <section className={`${theme.panel} ${theme.panelFeatured} ${theme.panelPadding}`}>
            <div className={theme.panelOrbPink} aria-hidden />
            <div className={`${theme.panelInner} grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center`}>
              <div className="space-y-3">
                <p className={`${theme.badgeViolet} ${theme.badgePink}`}>
                  <HeartHandshake className="h-3.5 w-3.5" aria-hidden />
                  Prochain rendez-vous
                </p>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{nextEvent.title}</h2>
                <EventDateTime startUtc={nextEvent.date} className="text-sm text-fuchsia-100/90" />
                <p className="line-clamp-3 text-sm text-zinc-300">
                  {nextEvent.description || "Programme en préparation — ouvre le détail pour t'inscrire ou ajouter l'événement à ton agenda."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openEventModal(nextEvent)} className={theme.btnPrimary}>
                    Voir le détail
                  </button>
                  <a href={calendarUrlForEvent(nextEvent)} target="_blank" rel="noreferrer" className={theme.btnSecondary}>
                    <CalendarPlus className="h-4 w-4" aria-hidden />
                    Google Calendar
                  </a>
                </div>
              </div>
              {nextEvent.image ? (
                <div className={`${theme.glassInset} overflow-hidden p-2`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={nextEvent.image} alt="" className="max-h-48 w-full rounded-lg object-contain" />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Comment ça marche */}
        <section className={`${theme.panel} ${theme.panelPadding}`} aria-labelledby="ev-howto-title">
          <div className={`${theme.panelInner} space-y-3`}>
            <h2 id="ev-howto-title" className="text-sm font-bold uppercase tracking-[0.14em] text-fuchsia-200/90">
              En trois gestes
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { step: 1, Icon: Filter, title: "Filtrer", desc: "Statut, catégorie, recherche — la vue s'adapte à toi." },
                { step: 2, Icon: CalendarDays, title: "Explorer", desc: "Calendrier interactif ou cartes détaillées, au choix." },
                { step: 3, Icon: CalendarPlus, title: "Participer", desc: "Inscription, agenda Google, partage — sans pression." },
              ].map(({ step, Icon, title, desc }) => (
                <article key={step} className={`${theme.glassCard} ${theme.glassCardViolet} p-4`}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-200/80">Étape {step}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-fuchsia-200" aria-hidden />
                    <h3 className="font-bold text-white">{title}</h3>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">{desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {message ? (
          <div role="status" aria-live="polite" className={`${theme.matchBanner} justify-between`}>
            <p className="leading-relaxed text-fuchsia-50">{message}</p>
            <button
              type="button"
              onClick={() => setMessage(null)}
              aria-label="Fermer le message"
              className={`${theme.btnSecondary} !min-h-0 !px-2 !py-1`}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:items-start">
          <div className="min-w-0 space-y-6">
        <section
          aria-label="Filtres et recherche"
          className={`${theme.panel} ${theme.panelPadding} ${theme.stickyFilters} space-y-3 sm:space-y-4`}
        >
          <div className={theme.panelInner}>
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
                  className={`${theme.pill} min-h-[42px] shrink-0 ${isActive ? theme.pillActive : ""}`}
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
                className={`${theme.pill} min-h-[42px] shrink-0 ${selectedCategory === "all" ? theme.pillActive : ""}`}
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
                    className={`${theme.pill} min-h-[42px] shrink-0 ${isActive ? theme.pillActive : ""}`}
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
                className={`${theme.field} py-2 pl-9 pr-9 text-sm placeholder:text-zinc-500`}
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
                    className={`${theme.pill} min-h-[42px] ${isActive ? theme.pillActive : ""}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2 md:ml-auto">
              <button
                type="button"
                onClick={resetFilters}
                disabled={!hasActiveFilters}
                aria-label="Réinitialiser les filtres"
                className={`${theme.btnSecondary} min-h-[42px] !px-3 !py-2`}
              >
                <RefreshCcw className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Réinitialiser</span>
              </button>
            </div>
          </div>
          </div>
        </section>

        {!loading && !error && filteredEvents.length > 0 ? (
          <div className={theme.matchBanner} role="status">
            <span>
              <span className={theme.matchCount}>{filteredEvents.length}</span> événement
              {filteredEvents.length > 1 ? "s" : ""} correspond
              {filteredEvents.length > 1 ? "ent" : ""} à ta sélection
            </span>
            {hasActiveFilters ? (
              <button type="button" onClick={resetFilters} className={theme.btnSecondary}>
                Effacer les filtres
              </button>
            ) : null}
          </div>
        ) : null}

        {viewMode === "calendar" ? (
          <section
            aria-labelledby="ev-calendar-title"
            className={`${theme.panel} ${theme.panelPadding} space-y-5`}
          >
            <div className={theme.panelOrbViolet} aria-hidden />
            <div className={`${theme.panelInner} space-y-5`}>
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="ev-calendar-title" className="text-2xl font-semibold capitalize sm:text-3xl">
                  {monthTitle}
                </h2>
                <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
                  Clique un jour pour voir le détail dans la colonne de droite.
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
                  className={`${theme.btnSecondary} !min-h-0 h-10 w-10 !p-0`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <button type="button" onClick={() => setCurrentMonth(new Date())} className={theme.btnPrimary}>
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
                  className={`${theme.btnSecondary} !min-h-0 h-10 w-10 !p-0`}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </header>

            <hr className={theme.divider} />

            <div className="hidden grid-cols-7 gap-2 text-xs text-zinc-400 md:grid md:text-sm" aria-hidden>
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className={`${theme.glassInset} py-2 text-center font-semibold text-fuchsia-100/80`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="space-y-2 md:hidden">
              {monthEvents.length > 0 ? (
                monthEvents.map((event) => (
                  <button
                    key={`mobile-month-${event.id}`}
                    type="button"
                    onClick={() => openEventModal(event)}
                    className={`${theme.glassCard} ${theme.glassCardPink} ${theme.glassCardInteractive} w-full px-3 py-3`}
                  >
                    <p className="line-clamp-1 text-sm font-semibold text-white">{event.title}</p>
                    <EventDateTime startUtc={event.date} className="text-xs text-zinc-400" />
                  </button>
                ))
              ) : (
                <p className={theme.emptyState}>Aucun événement ce mois-ci avec ces filtres.</p>
              )}
            </div>

            <div className="hidden grid-cols-7 gap-2 md:grid">
              {calendarDays.map((date, idx) => {
                const dayEvents = getEventsForDate(date);
                const isToday =
                  !!date &&
                  date.getDate() === new Date().getDate() &&
                  date.getMonth() === new Date().getMonth() &&
                  date.getFullYear() === new Date().getFullYear();
                const isSelected =
                  !!date &&
                  !!selectedCalendarDay &&
                  date.getDate() === selectedCalendarDay.getDate() &&
                  date.getMonth() === selectedCalendarDay.getMonth() &&
                  date.getFullYear() === selectedCalendarDay.getFullYear();
                return (
                  <div
                    key={`${idx}-${date ? date.toISOString() : "empty"}`}
                    className={
                      date
                        ? `${theme.calendarDay} md:min-h-[148px] ${isToday ? theme.calendarDayToday : ""} ${isSelected ? theme.calendarDaySelected : ""}`
                        : "min-h-[124px] border-transparent bg-transparent md:min-h-[148px]"
                    }
                  >
                    {date ? (
                      <button
                        type="button"
                        className="flex h-full w-full flex-col text-left"
                        onClick={() => setSelectedCalendarDay(date)}
                        aria-pressed={isSelected}
                        aria-label={`${date.toLocaleDateString("fr-FR")}, ${dayEvents.length} événement(s)`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <span
                            className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-md px-1.5 text-xs ${
                              isToday
                                ? "bg-fuchsia-500/25 font-semibold text-fuchsia-100"
                                : "bg-white/5 text-zinc-300"
                            }`}
                          >
                            {date.getDate()}
                          </span>
                          {dayEvents.length > 0 ? (
                            <span className={`${theme.badgeViolet} !py-0.5 !text-[10px]`}>
                              {dayEvents.length}
                            </span>
                          ) : null}
                        </div>
                        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                          {dayEvents.slice(0, 3).map((event) => {
                            const isRegistered = registeredEventIds.has(event.id);
                            return (
                              <button
                                key={event.id}
                                type="button"
                                onClick={() => openEventModal(event)}
                                title={event.title}
                                className={theme.calendarEventChip}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`h-1.5 w-1.5 rounded-full ${categoryDotColor(event.category)}`} aria-hidden />
                                  <span className="tabular-nums text-zinc-400">{formatHour(event.date)}</span>
                                  {isRegistered ? (
                                    <ListChecks className="ml-auto h-3 w-3 text-emerald-300" aria-label="Inscrit·e" />
                                  ) : null}
                                </div>
                                <p className="mt-0.5 line-clamp-1 text-zinc-100">{event.title}</p>
                              </button>
                            );
                          })}
                          {dayEvents.length > 3 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedCalendarDay(date)}
                              className="w-full text-left text-[10px] text-fuchsia-300 hover:text-fuchsia-200"
                            >
                              +{dayEvents.length - 3} autre(s)
                            </button>
                          ) : null}
                        </div>
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            </div>
          </section>
        ) : null}

        {viewMode === "list" ? (
          loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`${theme.eventCard} animate-pulse`}>
                  <div className="h-36 bg-white/5" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-1/3 rounded bg-white/10" />
                    <div className="h-5 w-2/3 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={`${theme.alertError} space-y-3`}>
              <p className="font-semibold">On n&apos;a pas pu charger l&apos;agenda.</p>
              <p className="text-sm opacity-90">{error}</p>
              <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={theme.btnSecondary}>
                <RefreshCcw className="h-4 w-4" aria-hidden />
                Réessayer
              </button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className={`${theme.emptyState} space-y-3 text-left`}>
              <p className="font-semibold text-white">Aucun événement ne correspond.</p>
              <p className="text-sm">Relâche les filtres ou reviens bientôt — le calendrier évolue souvent.</p>
              {hasActiveFilters ? (
                <button type="button" onClick={resetFilters} className={theme.btnPrimary}>
                  Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-8">
              {(selectedStatus === "all" || selectedStatus === "upcoming") && groupedUpcoming.length > 0 ? (
                <section className="space-y-4" aria-labelledby="ev-upcoming-title">
                  <h2 id="ev-upcoming-title" className="text-2xl font-semibold sm:text-3xl">
                    À venir <span className={theme.titleGradient}>· {groupedUpcoming.length}</span>
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groupedUpcoming.map(renderCard)}
                  </div>
                </section>
              ) : null}
              {(selectedStatus === "all" || selectedStatus === "past") && sampledPast.length > 0 ? (
                <section className="space-y-4" aria-labelledby="ev-past-title">
                  <h2 id="ev-past-title" className="text-2xl font-semibold sm:text-3xl">
                    Souvenirs récents
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sampledPast.map(renderCard)}
                  </div>
                </section>
              ) : null}
            </div>
          )
        ) : loading ? (
          <p className={`${theme.emptyState} text-sm`}>Chargement de l&apos;agenda…</p>
        ) : error ? (
          <div className={`${theme.alertError} space-y-3`}>
            <p className="font-semibold">{error}</p>
            <button type="button" onClick={() => setReloadKey((k) => k + 1)} className={theme.btnSecondary}>
              Réessayer
            </button>
          </div>
        ) : null}

          </div>

          <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start" aria-label="Exploration rapide">
            <section className={`${theme.panel} ${theme.panelPadding} space-y-3`}>
              <div className={theme.panelInner}>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fuchsia-200/90">Ce mois</h2>
                <div className="mt-2 grid gap-2">
                  <StatPill label="Total" value={monthStats.total} accent="#c4b5fd" />
                  <StatPill label="À venir" value={monthStats.upcoming} accent="#f9a8d4" />
                  <StatPill label="Terminés" value={monthStats.past} accent="#fda4af" />
                </div>
              </div>
            </section>

            {categories.length > 0 ? (
              <section className={`${theme.panel} ${theme.panelPadding} space-y-3`}>
                <div className={theme.panelInner}>
                  <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-violet-200/90">Catégories</h2>
                  <p className="text-[11px] text-zinc-500">Clique pour filtrer le calendrier et les cartes.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const active = selectedCategory === category;
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategoryFilter(category)}
                          className={`${theme.pill} !text-xs ${active ? theme.pillActive : ""}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${categoryDotColor(category)}`} aria-hidden />
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>
            ) : null}

            {selectedCalendarDay ? (
              <section className={`${theme.panel} ${theme.panelFeatured} ${theme.panelPadding} space-y-3`}>
                <div className={theme.panelOrbPink} aria-hidden />
                <div className={theme.panelInner}>
                  <h2 className="text-sm font-bold capitalize text-white">
                    {selectedCalendarDay.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </h2>
                  {selectedDayEvents.length === 0 ? (
                    <p className="mt-2 text-sm text-zinc-400">Aucun événement ce jour-là.</p>
                  ) : (
                    <ul className="mt-3 space-y-2">
                      {selectedDayEvents.map((event) => (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => openEventModal(event)}
                            className={`${theme.glassCard} ${theme.glassCardViolet} ${theme.glassCardInteractive} w-full p-3`}
                          >
                            <p className="text-sm font-semibold text-white">{event.title}</p>
                            <EventDateTime startUtc={event.date} className="text-xs text-zinc-400" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCalendarDay(null)}
                    className={`${theme.btnSecondary} mt-3 w-full`}
                  >
                    Fermer la sélection
                  </button>
                </div>
              </section>
            ) : null}

            <section className={`${theme.panel} ${theme.panelPadding}`}>
              <div className={`${theme.panelInner} space-y-3`}>
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-fuchsia-200/90">Contribuer</h2>
                <p className="text-sm text-zinc-400">
                  Une idée d&apos;animation ? Propose-la à l&apos;équipe communautaire.
                </p>
                <a href="/evenements-communautaires#proposer-evenement" className={`${theme.btnPrimary} w-full`}>
                  <Sparkles className="h-4 w-4" aria-hidden />
                  Proposer un événement
                </a>
                <a href="/evenements-communautaires" className={`${theme.btnSecondary} w-full`}>
                  Univers communautaire
                </a>
              </div>
            </section>
          </aside>
        </div>

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
