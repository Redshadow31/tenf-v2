"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft, Archive, Clock3, Sparkles } from "lucide-react";

interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  category: string;
  location?: string;
  image?: string;
  isPublished: boolean;
}

interface CategoryConfig {
  value: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const categories: CategoryConfig[] = [
  {
    value: "Spotlight",
    label: "Spotlight",
    color: "text-[#9146ff]",
    bgColor: "bg-[#9146ff]/20",
    borderColor: "border-[#9146ff]/30",
  },
  {
    value: "Soirée Film",
    label: "Soirée Film",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    value: "Formation",
    label: "Formation",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/30",
  },
  {
    value: "Jeux communautaire",
    label: "Jeux communautaire",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
  },
  {
    value: "Apéro",
    label: "Apéro",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    value: "Organisation Aventura 2026",
    label: "Organisation Aventura 2026",
    color: "text-pink-400",
    bgColor: "bg-pink-500/20",
    borderColor: "border-pink-500/30",
  },
];

const getCategoryConfig = (categoryValue: string): CategoryConfig => {
  return categories.find(cat => cat.value === categoryValue) || categories[0];
};

const glassCardClass =
  "rounded-2xl border border-indigo-300/20 bg-[linear-gradient(150deg,rgba(99,102,241,0.12),rgba(14,15,23,0.85)_45%,rgba(56,189,248,0.08))] shadow-[0_20px_50px_rgba(2,6,23,0.45)] backdrop-blur";
const sectionCardClass =
  "rounded-2xl border border-[#2f3244] bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.10),_rgba(11,13,20,0.95)_46%)] shadow-[0_16px_40px_rgba(2,6,23,0.45)]";

export default function ArchivesPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/events?admin=true", {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        // Filtrer uniquement les événements passés
        const now = new Date();
        const pastEvents = (data.events || []).filter((event: Event) => {
          const eventDate = new Date(event.date);
          return eventDate < now;
        });
        // Trier par date décroissante (plus récent en premier)
        pastEvents.sort((a: Event, b: Event) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setEvents(pastEvents);
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les événements par mois
  const groupEventsByMonth = () => {
    const grouped: Record<string, Event[]> = {};
    
    events.forEach((event) => {
      const eventDate = new Date(event.date);
      const year = eventDate.getFullYear();
      const month = String(eventDate.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });

    // Trier les mois par ordre décroissant
    return Object.entries(grouped).sort((a, b) => {
      return b[0].localeCompare(a[0]);
    });
  };

  const formatMonthKey = (key: string): string => {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const formatEventDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const groupedEvents = groupEventsByMonth();
  const displayedEvents = selectedMonth
    ? groupedEvents.filter(([monthKey]) => monthKey === selectedMonth)
    : groupedEvents;
  const publishedCount = events.filter((event) => event.isPublished).length;
  const withImageCount = events.filter((event) => Boolean(event.image)).length;
  const latestMonth = groupedEvents.length > 0 ? groupedEvents[0][0] : "";

  return (
    <div className="space-y-6 text-white">
      <section className={`${glassCardClass} p-5 md:p-6`}>
        <Link
          href="/admin/events"
          className="text-gray-300 hover:text-white transition-colors mb-4 inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.14em] text-indigo-200/90">Evenements communautaires</p>
            <h1 className="mt-2 bg-gradient-to-r from-indigo-100 via-sky-200 to-cyan-200 bg-clip-text text-3xl font-semibold text-transparent md:text-4xl">
              Archives des evenements
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Cette page centralise l'historique des evenements passes pour faciliter les analyses, la reutilisation des formats
              qui performent et la preparation des prochaines editions.
            </p>
          </div>
          <div className="rounded-xl border border-indigo-300/25 bg-[#101522]/70 px-4 py-3 text-sm text-indigo-100">
            <p className="text-xs uppercase tracking-[0.1em] text-indigo-200/80">Dernier mois archive</p>
            <p className="mt-1">{latestMonth ? formatMonthKey(latestMonth) : "Aucun"}</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Evenements archives</p>
          <p className="mt-2 text-3xl font-semibold">{events.length}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Publies</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-300">{publishedCount}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Avec visuel</p>
          <p className="mt-2 text-3xl font-semibold text-sky-300">{withImageCount}</p>
        </article>
        <article className={`${sectionCardClass} p-4`}>
          <p className="text-xs uppercase tracking-[0.1em] text-slate-400">Mois disponibles</p>
          <p className="mt-2 text-3xl font-semibold text-amber-300">{groupedEvents.length}</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Filtrage et lecture des archives</h2>
          <p className="mt-1 text-sm text-slate-400">
            Utilise le filtre mois pour analyser une periode precise et comparer les categories.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="text-sm font-semibold text-slate-300">Filtrer par mois :</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-[#353a50] bg-[#0f1424] px-4 py-2 text-sm text-white focus:border-indigo-300/45 focus:outline-none"
            >
              <option value="">Tous les mois</option>
              {groupedEvents.map(([monthKey]) => (
                <option key={monthKey} value={monthKey}>
                  {formatMonthKey(monthKey)}
                </option>
              ))}
            </select>
          </div>
        </article>
        <article className={`${sectionCardClass} p-5`}>
          <h2 className="text-lg font-semibold text-slate-100">Explication de la page</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p className="rounded-lg border border-indigo-300/30 bg-indigo-300/10 px-3 py-2 text-indigo-100">
              <Archive className="mr-1 inline h-4 w-4" />
              Conserver une trace fiable des evenements termines.
            </p>
            <p className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-cyan-100">
              <Clock3 className="mr-1 inline h-4 w-4" />
              Identifier les periodes fortes et les creux d activite.
            </p>
            <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-amber-100">
              <Sparkles className="mr-1 inline h-4 w-4" />
              Reutiliser les formats qui ont donne les meilleurs resultats.
            </p>
          </div>
        </article>
      </section>

      {loading ? (
        <div className={`${sectionCardClass} text-center py-12`}>
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des événements...</p>
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className={`${sectionCardClass} p-8 text-center`}>
          <p className="text-gray-400">
            {selectedMonth ? "Aucun événement pour ce mois" : "Aucun événement passé"}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {displayedEvents.map(([monthKey, monthEvents]) => (
            <div key={monthKey}>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="w-6 h-6 text-amber-400" />
                <h2 className="text-2xl font-bold text-white">
                  {formatMonthKey(monthKey)}
                </h2>
                <span className="text-gray-400 text-sm">
                  ({monthEvents.length} {monthEvents.length > 1 ? "événements" : "événement"})
                </span>
              </div>

              {/* Grille de vignettes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {monthEvents.map((event) => {
                  const catConfig = getCategoryConfig(event.category);
                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-[#353a50] bg-[#121623]/85 overflow-hidden hover:border-indigo-300/45 transition-all hover:shadow-[0_16px_34px_rgba(67,56,202,0.35)] group"
                    >
                      {/* Image de l'événement */}
                      {event.image && (
                        <div className="relative w-full h-48 overflow-hidden bg-gray-800">
                          <img
                            src={event.image}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      
                      {/* Contenu de la vignette */}
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white line-clamp-2 flex-1">
                            {event.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 mb-3">
                          <span className={`text-xs px-2 py-1 rounded border ${catConfig.bgColor} ${catConfig.color} ${catConfig.borderColor}`}>
                            {event.category}
                          </span>
                          {event.isPublished && (
                            <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                              Publié
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{formatEventDate(event.date)}</span>
                          </div>
                          {event.location && (
                            <div className="text-gray-400">
                              📍 {event.location}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-gray-300 mt-3 line-clamp-3">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
