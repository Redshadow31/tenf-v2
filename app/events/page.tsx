"use client";

import React, { useState, useEffect } from "react";
import EventModal from "@/components/EventModal";

type Event = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: string; // ISO date string
  category: "Spotlight" | "Soirées communautaires" | "Ateliers créateurs" | string;
  location?: string;
};

const categories = [
  "Spotlight",
  "Soirée Film",
  "Formation",
  "Jeux communautaire",
  "Apéro",
  "Organisation Aventura 2026",
];

export default function Page() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Charger les événements depuis l'API
  useEffect(() => {
    async function loadEvents() {
      try {
        setLoading(true);
        const response = await fetch('/api/events', {
          cache: 'no-store',
        });
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (error) {
        console.error('Erreur chargement événements:', error);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const getFilteredEvents = () => {
    if (!activeFilter) return events;
    return events.filter((event) => event.category === activeFilter);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Spotlight":
        return "bg-[#9146ff]";
      case "Soirée Film":
        return "bg-blue-500";
      case "Formation":
        return "bg-green-500";
      case "Jeux communautaire":
        return "bg-amber-500";
      case "Apéro":
        return "bg-purple-500";
      case "Organisation Aventura 2026":
        return "bg-pink-500";
      default:
        return "bg-gray-700";
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleRegister = async () => {
    if (!selectedEvent) return;
    
    try {
      const response = await fetch(`/api/events/${selectedEvent.id}/register`, {
        method: 'POST',
        credentials: 'include', // Important : inclure les cookies de session
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message || 'Inscription réussie !'}`);
        setIsModalOpen(false);
        // Recharger les événements pour mettre à jour les inscriptions
        // (on pourrait ajouter un indicateur visuel d'inscription)
      } else {
        const error = await response.json();
        if (response.status === 409) {
          alert(`ℹ️ ${error.error || 'Vous êtes déjà inscrit à cet événement'}`);
        } else {
          alert(`❌ ${error.error || 'Erreur lors de l\'inscription'}`);
        }
      }
    } catch (error) {
      console.error('Erreur inscription:', error);
      alert('❌ Erreur lors de l\'inscription');
    }
  };

  // Fonction pour générer le calendrier
  const generateCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lundi = 0

    const days: (Date | null)[] = [];
    
    // Ajouter les jours vides du début
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Ajouter les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventForDate = (date: Date | null) => {
    if (!date) return null;
    return getFilteredEvents().find((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Mettre à jour le mois actuel en fonction des événements
  useEffect(() => {
    if (events.length > 0) {
      const firstEventDate = new Date(events[0].date);
      setCurrentMonth(new Date(firstEventDate.getFullYear(), firstEventDate.getMonth(), 1));
    }
  }, [events]);

  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <h1 className="text-3xl font-bold text-white">Événements</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(activeFilter === category ? null : category)}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-all ${
              activeFilter === category
                ? getCategoryColor(category)
                : "bg-[#1a1a1d] border border-gray-700 hover:border-[#9146ff]/50"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Calendrier */}
      <div className="card bg-[#1a1a1d] border border-gray-700 p-6">
        {/* En-tête du calendrier */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="rounded-lg bg-[#0e0e10] p-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-white">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const event = getEventForDate(date);
            return (
              <div
                key={index}
                className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                  date
                    ? event
                      ? "cursor-pointer border-gray-600 bg-[#0e0e10] hover:bg-[#1a1a1d]"
                      : "border-gray-800 bg-[#0e0e10]"
                    : "border-transparent"
                }`}
                onClick={() => event && handleEventClick(event)}
              >
                {date && (
                  <>
                    <div className="mb-1 text-sm text-gray-400">{date.getDate()}</div>
                    {event && (
                      <div
                        className={`rounded px-2 py-1 text-xs font-bold text-white ${getCategoryColor(
                          event.category
                        )}`}
                      >
                        {event.title}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal événement */}
      {selectedEvent && (
        <EventModal
          event={{
            ...selectedEvent,
            date: new Date(selectedEvent.date), // Convertir en Date pour le modal
          }}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegister}
        />
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff]"></div>
          <p className="text-gray-400 mt-4">Chargement des événements...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">Aucun événement disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}
