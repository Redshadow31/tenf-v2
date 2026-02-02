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

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "Spotlight":
        return "#9146ff";
      case "Soirée Film":
        return "#3b82f6";
      case "Formation":
        return "#10b981";
      case "Jeux communautaire":
        return "#f59e0b";
      case "Apéro":
        return "#a855f7";
      case "Organisation Aventura 2026":
        return "#ec4899";
      default:
        return "var(--color-primary)";
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

  const getEventsForDate = (date: Date | null): Event[] => {
    if (!date) return [];
    return getFilteredEvents().filter((event) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  // Rester sur le mois en cours à l'arrivée sur la page (ne pas basculer sur le mois du premier/dernier événement)
  const calendarDays = generateCalendar();
  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <div className="space-y-8">
      {/* Titre */}
      <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Événements</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(activeFilter === category ? null : category)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-all border"
            style={{
              backgroundColor: activeFilter === category ? getCategoryColor(category) : 'var(--color-card)',
              borderColor: activeFilter === category ? 'transparent' : 'var(--color-border)',
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== category) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== category) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Calendrier */}
      <div className="card border p-6" style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        {/* En-tête du calendrier */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="rounded-lg p-2 transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="rounded-lg p-2 transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-text)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
              }}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <span className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
          </div>
        </div>

        {/* Jours de la semaine */}
        <div className="mb-4 grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div key={day} className="text-center text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, index) => {
            const eventsForDate = getEventsForDate(date);
            const hasEvents = eventsForDate.length > 0;
            return (
              <div
                key={index}
                className={`min-h-[80px] rounded-lg border p-2 transition-colors ${
                  date && hasEvents ? "cursor-pointer" : ""
                }`}
                style={{
                  backgroundColor: date ? (hasEvents ? 'var(--color-surface)' : 'var(--color-bg)') : 'transparent',
                  borderColor: date ? (hasEvents ? 'var(--color-border)' : 'var(--color-border-light)') : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (date && hasEvents) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (date && hasEvents) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                  }
                }}
                onClick={() => {
                  if (hasEvents && eventsForDate.length === 1) {
                    handleEventClick(eventsForDate[0]);
                  }
                }}
              >
                {date && (
                  <>
                    <div className="mb-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>{date.getDate()}</div>
                    {eventsForDate.length > 0 && (
                      <div className="space-y-1 max-h-[60px] overflow-y-auto">
                        {eventsForDate.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="rounded px-2 py-1 text-xs font-bold text-white"
                            style={{ backgroundColor: getCategoryColor(event.category) }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        {eventsForDate.length > 3 && (
                          <div className="text-xs text-gray-400 px-2">
                            +{eventsForDate.length - 3} autre{eventsForDate.length - 3 > 1 ? 's' : ''}
                          </div>
                        )}
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
          <p className="mt-4" style={{ color: 'var(--color-text-secondary)' }}>Chargement des événements...</p>
        </div>
      )}

      {!loading && events.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-secondary)' }}>Aucun événement disponible pour le moment.</p>
        </div>
      )}
    </div>
  );
}
