"use client";

import React, { useEffect, useMemo, useState } from "react";
import EventDateTime from "@/components/EventDateTime";
import { formatEventDateTimeInTimezone, getBrowserTimezone } from "@/lib/timezone";

type EventItem = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string;
  category: string;
  location?: string;
  isPublished?: boolean;
};

type ProposalItem = {
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

const statusFilters = [
  { id: "upcoming", label: "A venir" },
  { id: "past", label: "Termines" },
  { id: "all", label: "Tous" },
] as const;

function categoryColor(category: string): string {
  switch (category) {
    case "Spotlight":
      return "bg-purple-600/30 text-purple-200 border-purple-500/30";
    case "Soirée Film":
      return "bg-blue-600/30 text-blue-200 border-blue-500/30";
    case "Formation":
      return "bg-emerald-600/30 text-emerald-200 border-emerald-500/30";
    case "Jeux communautaire":
      return "bg-amber-600/30 text-amber-200 border-amber-500/30";
    case "Apéro":
      return "bg-fuchsia-600/30 text-fuchsia-200 border-fuchsia-500/30";
    default:
      return "bg-gray-700/40 text-gray-200 border-gray-600/40";
  }
}

export default function Events2Page() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState<"calendar" | "propose">("calendar");

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"upcoming" | "past" | "all">("upcoming");

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [proposalCategory, setProposalCategory] = useState("");
  const [proposalDate, setProposalDate] = useState("");
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

  async function loadProposals() {
    try {
      setProposalLoading(true);
      const response = await fetch("/api/events/proposals", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Impossible de charger les propositions");
      }
      setProposals((data.proposals || []) as ProposalItem[]);
    } catch (error) {
      console.error("[events2] Erreur chargement propositions:", error);
    } finally {
      setProposalLoading(false);
    }
  }

  useEffect(() => {
    loadProposals();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    events.forEach((event) => set.add(event.category));
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [events]);

  const proposalCategoryOptions = useMemo(() => {
    if (categories.length > 0) return categories;
    return [
      "Spotlight",
      "Soirées communautaires",
      "Soirée Film",
      "Apéro",
      "Formation",
      "Jeux communautaire",
      "Ateliers créateurs",
      "Aventura 2025",
      "Organisation Aventura 2026",
    ];
  }, [categories]);

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

  async function handleSubmitProposal(e: React.FormEvent) {
    e.preventDefault();
    if (!proposalTitle.trim() || !proposalDescription.trim() || !proposalCategory.trim()) {
      setMessage("Merci de remplir titre, description et catégorie pour proposer un événement.");
      return;
    }

    try {
      setActionLoading(true);
      setMessage(null);
      const response = await fetch("/api/events/proposals", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: proposalTitle,
          description: proposalDescription,
          category: proposalCategory,
          proposedDate: proposalDate || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Impossible d'envoyer la proposition.");
        return;
      }

      setProposalTitle("");
      setProposalDescription("");
      setProposalDate("");
      setMessage("✅ Proposition envoyée avec succès. Elle est visible anonymement dans la liste.");
      await loadProposals();
    } catch {
      setMessage("Erreur réseau lors de l'envoi de la proposition.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleInterest(proposal: ProposalItem) {
    try {
      setActionLoading(true);
      setMessage(null);
      const method = proposal.hasVoted ? "DELETE" : "POST";
      const response = await fetch(`/api/events/proposals/${proposal.id}/vote`, {
        method,
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage(data?.error || "Impossible de voter pour cette proposition.");
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
      setMessage("Erreur réseau lors du vote.");
    } finally {
      setActionLoading(false);
    }
  }

  function openEventModal(event: EventItem) {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setMessage(null);
  }

  const renderCard = (event: EventItem) => {
    const isRegistered = registeredEventIds.has(event.id);
    const isPast = new Date(event.date).getTime() < Date.now();

    return (
      <div
        key={event.id}
        className="rounded-xl border border-gray-700 bg-[#1a1a1d] overflow-hidden hover:border-[#9146ff] transition-colors"
      >
        {event.image ? (
          <img src={event.image} alt={event.title} className="w-full h-44 object-cover" />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-[#2a2a2d] to-[#141417]" />
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${categoryColor(event.category)}`}>{event.category}</span>
            <span className={`text-xs ${isPast ? "text-gray-400" : "text-green-300"}`}>{isPast ? "Termine" : "A venir"}</span>
          </div>

          <h3 className="text-lg font-semibold text-white line-clamp-2">{event.title}</h3>
          <EventDateTime startUtc={event.date} className="text-sm text-gray-400" />
          <p className="text-sm text-gray-300 line-clamp-3">{event.description || "Aucune description."}</p>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => openEventModal(event)}
              className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#2a2a2d] border border-gray-600 hover:border-[#9146ff]"
            >
              Voir details
            </button>
            {!isPast && (
              <button
                onClick={() => (isRegistered ? handleUnregister(event.id) : handleRegister(event.id))}
                disabled={actionLoading}
                className={`px-3 py-2 rounded-lg text-sm font-semibold ${
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
    <div className="space-y-8 text-white">
      <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-6">
        <h1 className="text-3xl font-bold mb-2">Événements communautaires</h1>
        <p className="text-gray-400 mb-4">Retrouve les prochains événements, inscris-toi et propose tes idées à la communauté.</p>
        {nextEvent ? (
          <div className="text-sm text-gray-300">
            Prochain evenement:{" "}
            <span className="font-semibold text-white">{nextEvent.title}</span>
            {" - "}
            {formatEventDateTimeInTimezone(nextEvent.date, browserTimezone, "fr-FR").fullLabel}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Aucun evenement a venir pour le moment.</div>
        )}
      </div>

      <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-3 flex gap-2 w-fit">
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === "calendar" ? "bg-[#9146ff] text-white" : "bg-[#0e0e10] text-gray-300 border border-gray-700"
          }`}
        >
          Calendrier
        </button>
        <button
          onClick={() => setActiveTab("propose")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            activeTab === "propose" ? "bg-[#9146ff] text-white" : "bg-[#0e0e10] text-gray-300 border border-gray-700"
          }`}
        >
          Proposer un event
        </button>
      </div>

      {message && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-900/20 text-blue-200 px-4 py-3 text-sm">
          {message}
        </div>
      )}

      {activeTab === "calendar" ? (
        <>
          <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedStatus(filter.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                    selectedStatus === filter.id
                      ? "bg-[#9146ff] border-[#9146ff] text-white"
                      : "bg-[#0e0e10] border-gray-700 text-gray-300 hover:border-[#9146ff]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  selectedCategory === "all" ? "bg-[#2f1f52] border-[#9146ff] text-white" : "bg-[#0e0e10] border-gray-700 text-gray-300"
                }`}
              >
                Toutes les categories
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    selectedCategory === category ? "bg-[#2f1f52] border-[#9146ff] text-white" : "bg-[#0e0e10] border-gray-700 text-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un evenement..."
              className="w-full md:w-[420px] bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
            />
          </div>

          <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4 md:p-6 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <h2 className="text-xl font-semibold capitalize">Calendrier - {monthTitle}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                  className="px-3 py-2 rounded-lg text-sm bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
                >
                  ← Mois precedent
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3 py-2 rounded-lg text-sm bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
                >
                  Aujourd'hui
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                  className="px-3 py-2 rounded-lg text-sm bg-[#0e0e10] border border-gray-700 hover:border-[#9146ff]"
                >
                  Mois suivant →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 text-xs md:text-sm text-gray-400">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                <div key={day} className="text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
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
                    className={`min-h-[90px] md:min-h-[110px] rounded-lg border p-2 ${
                      date ? "bg-[#0e0e10] border-gray-700" : "border-transparent"
                    } ${isToday ? "ring-1 ring-[#9146ff]" : ""}`}
                  >
                    {date && (
                      <>
                        <div className={`text-xs md:text-sm mb-1 ${isToday ? "text-[#c7a4ff] font-semibold" : "text-gray-400"}`}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-1 max-h-[72px] md:max-h-[84px] overflow-y-auto">
                          {dayEvents.slice(0, 3).map((event) => (
                            <button
                              key={event.id}
                              onClick={() => openEventModal(event)}
                              className={`w-full text-left text-[10px] md:text-xs px-2 py-1 rounded border ${categoryColor(event.category)}`}
                              title={event.title}
                            >
                              {event.title}
                            </button>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] md:text-xs text-gray-500 px-1">+{dayEvents.length - 3} autre(s)</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-700 bg-[#1a1a1d] overflow-hidden animate-pulse">
                  <div className="h-44 bg-[#2a2a2d]" />
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
            <div className="rounded-lg border border-red-500/40 bg-red-900/20 text-red-200 px-4 py-3 text-sm">{error}</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-gray-400">Aucun evenement ne correspond a tes filtres.</div>
          ) : (
            <div className="space-y-8">
              {(selectedStatus === "all" || selectedStatus === "upcoming") && groupedUpcoming.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">A venir</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{groupedUpcoming.map(renderCard)}</div>
                </section>
              )}

              {(selectedStatus === "all" || selectedStatus === "past") && groupedPast.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-2xl font-semibold">Termines</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">{groupedPast.map(renderCard)}</div>
                </section>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-5">
            <h2 className="text-2xl font-semibold mb-3">Proposer un event</h2>
            <p className="text-sm text-gray-400 mb-4">
              Ta proposition apparaît anonymement pour la communauté. Les membres connectés peuvent voter “ça m’intéresse”.
            </p>
            <form onSubmit={handleSubmitProposal} className="space-y-3">
              <input
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="Titre de l'event"
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
              />
              <textarea
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                placeholder="Décris ton idée d'event"
                className="w-full min-h-[110px] bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  value={proposalCategory}
                  onChange={(e) => setProposalCategory(e.target.value)}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
                >
                  <option value="">Choisir une catégorie</option>
                  {proposalCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <input
                  type="datetime-local"
                  value={proposalDate}
                  onChange={(e) => setProposalDate(e.target.value)}
                  className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold disabled:opacity-50"
              >
                Envoyer la proposition
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold">Propositions de la communauté</h3>
            {proposalLoading ? (
              <p className="text-gray-400 text-sm">Chargement des propositions...</p>
            ) : proposals.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucune proposition pour le moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="rounded-xl border border-gray-700 bg-[#1a1a1d] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-lg font-semibold">{proposal.title}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full border ${
                          proposal.status === "approved"
                            ? "bg-green-600/20 text-green-300 border-green-500/30"
                            : proposal.status === "pending"
                              ? "bg-yellow-600/20 text-yellow-300 border-yellow-500/30"
                              : "bg-gray-600/20 text-gray-300 border-gray-500/30"
                        }`}
                      >
                        {proposal.status === "approved" ? "Validée" : proposal.status === "pending" ? "En étude" : "Classée"}
                      </span>
                    </div>
                    <span className={`inline-block text-xs px-2 py-1 rounded-full border ${categoryColor(proposal.category)}`}>
                      {proposal.category}
                    </span>
                    {proposal.proposedDate && (
                      <div className="text-xs text-gray-400">
                        Date suggérée: <EventDateTime startUtc={proposal.proposedDate} showTimezoneLabel={false} />
                      </div>
                    )}
                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{proposal.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-400">{proposal.votesCount} membre(s) intéressé(s)</p>
                      <button
                        onClick={() => handleToggleInterest(proposal)}
                        disabled={actionLoading}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold ${
                          proposal.hasVoted ? "bg-red-600/80 hover:bg-red-700 text-white" : "bg-[#9146ff] hover:bg-[#7c3aed] text-white"
                        } disabled:opacity-50`}
                      >
                        {proposal.hasVoted ? "Retirer mon intérêt" : "Ça m'intéresse"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-[#1a1a1d]"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedEvent.image && <img src={selectedEvent.image} alt={selectedEvent.title} className="w-full h-56 object-cover" />}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                  ✕
                </button>
              </div>
              <span className={`inline-block text-xs px-2 py-1 rounded-full border ${categoryColor(selectedEvent.category)}`}>
                {selectedEvent.category}
              </span>
              <EventDateTime startUtc={selectedEvent.date} className="text-sm text-gray-300" />
              <p className="text-gray-200 whitespace-pre-wrap">{selectedEvent.description || "Aucune description."}</p>
              {selectedEvent.location && (
                <p className="text-sm text-gray-300">
                  Lieu:{" "}
                  <a className="text-[#9146ff] hover:text-[#7c3aed] break-all" href={selectedEvent.location} target="_blank" rel="noreferrer">
                    {selectedEvent.location}
                  </a>
                </p>
              )}

              {new Date(selectedEvent.date).getTime() >= Date.now() && (
                <div className="pt-2 flex gap-2">
                  {registeredEventIds.has(selectedEvent.id) ? (
                    <button
                      onClick={() => handleUnregister(selectedEvent.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
                    >
                      Se desinscrire
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(selectedEvent.id)}
                      disabled={actionLoading}
                      className="px-4 py-2 rounded-lg bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold"
                    >
                      S'inscrire
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

