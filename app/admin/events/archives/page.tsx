"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

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

  return (
    <div className="text-white">
      <div className="mb-8">
        <Link
          href="/admin/events"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux événements
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          Événements Passés
        </h1>
        <p className="text-gray-400">
          Consultez l'historique des événements organisés par mois
        </p>
      </div>

      {/* Sélecteur de mois */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-semibold text-gray-300">Filtrer par mois :</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
        >
          <option value="">Tous les mois</option>
          {groupedEvents.map(([monthKey]) => (
            <option key={monthKey} value={monthKey}>
              {formatMonthKey(monthKey)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des événements...</p>
        </div>
      ) : displayedEvents.length === 0 ? (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
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
                      className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden hover:border-[#9146ff]/50 transition-all hover:shadow-lg hover:shadow-[#9146ff]/20 group"
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
