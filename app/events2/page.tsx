"use client";

import React, { useEffect, useMemo, useState } from "react";

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

const statusFilters = [
  { id: "upcoming", label: "A venir" },
  { id: "past", label: "Termines" },
  { id: "all", label: "Tous" },
] as const;

function formatEventDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"upcoming" | "past" | "all">("upcoming");

  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());

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
          <p className="text-sm text-gray-400">{formatEventDate(event.date)}</p>
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
        <h1 className="text-3xl font-bold mb-2">Events v2</h1>
        <p className="text-gray-400 mb-4">Version test fonctionnelle pour valider une nouvelle UX avant remplacement.</p>
        {nextEvent ? (
          <div className="text-sm text-gray-300">
            Prochain evenement: <span className="font-semibold text-white">{nextEvent.title}</span> - {formatEventDate(nextEvent.date)}
          </div>
        ) : (
          <div className="text-sm text-gray-400">Aucun evenement a venir pour le moment.</div>
        )}
      </div>

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

      {message && (
        <div className="rounded-lg border border-blue-500/40 bg-blue-900/20 text-blue-200 px-4 py-3 text-sm">
          {message}
        </div>
      )}

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
              <p className="text-sm text-gray-300">{formatEventDate(selectedEvent.date)}</p>
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

