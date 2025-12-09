"use client";

import React, { useState } from "react";
import EventModal from "@/components/EventModal";

type Event = {
  id: string;
  title: string;
  description: string;
  image?: string;
  date: Date;
  category: "Spotlight" | "Soirées communautaires" | "Ateliers créateurs";
  location?: string;
};

// Mock data pour les événements
const mockEvents: Event[] = [
  {
    id: "1",
    title: "Spotlight",
    description: "Événement mensuel où les membres de la communauté présentent leurs créations et partagent leurs expériences. Un moment de partage et de découverte pour toute la New Family.",
    image: "/api/placeholder/800/400?text=Spotlight",
    date: new Date(2025, 0, 2), // 2 janvier 2025
    category: "Spotlight",
    location: "Discord TENF",
  },
  {
    id: "2",
    title: "Atelier OBS",
    description: "Apprenez à configurer et utiliser OBS Studio pour améliorer la qualité de vos streams. Nous couvrirons les bases de la configuration, les scènes, les sources et les plugins essentiels.",
    image: "/api/placeholder/800/400?text=Atelier+OBS",
    date: new Date(2025, 0, 10), // 10 janvier 2025
    category: "Ateliers créateurs",
    location: "Discord TENF",
  },
  {
    id: "3",
    title: "Soirée Fortnite",
    description: "Rejoignez-nous pour une soirée gaming conviviale sur Fortnite ! Que vous soyez débutant ou pro, venez passer un bon moment avec la communauté TENF.",
    image: "/api/placeholder/800/400?text=Soirée+Fortnite",
    date: new Date(2025, 0, 12), // 12 janvier 2025
    category: "Soirées communautaires",
    location: "Discord TENF",
  },
  {
    id: "4",
    title: "Réunion Aventura 2026",
    description: "Présentation et discussion autour du projet Aventura 2026. Échangez avec l'équipe et découvrez les nouveautés à venir pour la communauté.",
    image: "/api/placeholder/800/400?text=Aventura+2026",
    date: new Date(2025, 0, 19), // 19 janvier 2025
    category: "Ateliers créateurs",
    location: "Discord TENF",
  },
];

const categories = ["Spotlight", "Soirées communautaires", "Ateliers créateurs"];

export default function Page() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 0, 1)); // Janvier 2025

  const getFilteredEvents = () => {
    if (!activeFilter) return mockEvents;
    return mockEvents.filter((event) => event.category === activeFilter);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Spotlight":
        return "bg-[#9146ff]";
      case "Soirées communautaires":
        return "bg-blue-600";
      case "Ateliers créateurs":
        return "bg-amber-700";
      default:
        return "bg-gray-700";
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleRegister = () => {
    // TODO: Implémenter l'inscription à l'événement
    alert(`Inscription à "${selectedEvent?.title}" enregistrée !`);
    setIsModalOpen(false);
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
          event={selectedEvent}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          onRegister={handleRegister}
        />
      )}
    </div>
  );
}
