"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Event {
  id: string;
  title: string;
  date: string; // ISO date string
  category: string;
  location?: string;
}

export default function NextEventBanner() {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Vérifier prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Charger le prochain événement
  useEffect(() => {
    async function loadNextEvent() {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch("/api/events", {
          cache: "no-store",
        });

        if (!response.ok) {
          setError(true);
          setLoading(false);
          return;
        }

        const data = await response.json();
        const events: Event[] = data.events || [];

        // Filtrer les événements à venir
        const now = new Date();
        const upcomingEvents = events.filter((event) => {
          const eventDate = new Date(event.date);
          return eventDate > now;
        });

        // Trier par date et prendre le plus proche
        if (upcomingEvents.length > 0) {
          upcomingEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setNextEvent(upcomingEvents[0]);
        } else {
          setNextEvent(null);
        }
      } catch (err) {
        console.error("Erreur chargement événements:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadNextEvent();
  }, []);

  // Ne pas afficher pendant le chargement ou en cas d'erreur discrète
  if (loading || error) {
    if (error) {
      // Afficher un message discret en cas d'erreur
      return (
        <div className="w-full bg-[#1a1a1d] border-b border-gray-700/50 py-3 px-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>🗓️</span>
              <span>Événements indisponibles pour le moment</span>
            </div>
            <Link
              href="/events"
              className="text-xs text-[#9146ff] hover:text-[#7c3aed] transition-colors underline"
            >
              Voir /events
            </Link>
          </div>
        </div>
      );
    }
    return null; // Ne rien afficher pendant le chargement
  }

  // Formatage de la date et heure
  const formatEventDate = (dateString: string): { date: string; time: string } => {
    try {
      const date = new Date(dateString);
      const dateStr = date.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const timeStr = date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      });
      return {
        date: dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
        time: timeStr,
      };
    } catch {
      return { date: dateString, time: "" };
    }
  };

  // Vérifier si l'événement est dans moins de 24h
  const isSoon = (dateString: string): boolean => {
    try {
      const eventDate = new Date(dateString);
      const now = new Date();
      const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours > 0 && diffHours <= 24;
    } catch {
      return false;
    }
  };

  // Vérifier si l'événement est en cours (dans les 2 premières heures)
  const isOngoing = (dateString: string): boolean => {
    try {
      const eventDate = new Date(dateString);
      const now = new Date();
      const diffHours = (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 2;
    } catch {
      return false;
    }
  };

  // Aucun événement à venir
  if (!nextEvent) {
    return (
      <div className="w-full bg-gradient-to-r from-[#1a1a1d] to-[#252529] border-b border-[#9146ff]/20 py-3 px-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span className="text-lg">🗓️</span>
            <span className="hidden sm:inline">
              Aucun événement programmé pour le moment — restez connectés
            </span>
            <span className="sm:hidden">
              Aucun événement programmé
            </span>
            <span className="text-[#9146ff]">💜</span>
          </div>
          <Link
            href="/events"
            className="text-xs sm:text-sm text-[#9146ff] hover:text-[#7c3aed] transition-colors underline whitespace-nowrap"
          >
            Voir les événements
          </Link>
        </div>
      </div>
    );
  }

  // Événement à venir trouvé
  const { date: formattedDate, time } = formatEventDate(nextEvent.date);
  const soon = isSoon(nextEvent.date);
  const ongoing = isOngoing(nextEvent.date);

  // Texte du bandeau (pour le marquee)
  const bannerText = `Prochain event : ${nextEvent.title} — ${formattedDate} à ${time}${nextEvent.location ? ` — ${nextEvent.location}` : ""}`;

  return (
    <div className="w-full bg-gradient-to-r from-[#9146ff]/10 via-[#9146ff]/5 to-[#1a1a1d] border-b border-[#9146ff]/30 py-3 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        {/* Badge de statut */}
        {(soon || ongoing) && (
          <div className="flex items-center gap-1 sm:gap-2">
            {ongoing && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-600/20 text-red-400 border border-red-600/30">
                <span>🔴</span>
                <span className="hidden sm:inline">En cours</span>
              </span>
            )}
            {soon && !ongoing && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                <span>⏳</span>
                <span className="hidden sm:inline">Bientôt</span>
              </span>
            )}
          </div>
        )}

        {/* Contenu du bandeau */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <span className="text-lg flex-shrink-0">🗓️</span>
          
          {/* Version desktop avec marquee */}
          <div className="hidden md:block flex-1 min-w-0">
            {prefersReducedMotion ? (
              <div className="truncate text-sm text-gray-200">
                {bannerText}
              </div>
            ) : (
              <div className="relative overflow-hidden" style={{ height: "20px" }}>
                <div
                  className="absolute whitespace-nowrap text-sm text-gray-200 marquee-text"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.animationPlayState = "paused";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.animationPlayState = "running";
                  }}
                >
                  {bannerText}
                  <span className="mx-8">•</span>
                  {bannerText}
                </div>
              </div>
            )}
          </div>

          {/* Version mobile (2 lignes max) */}
          <div className="md:hidden flex-1 min-w-0">
            <div className="text-xs sm:text-sm text-gray-200 line-clamp-2">
              <span className="font-semibold">{nextEvent.title}</span>
              {" — "}
              <span>{formattedDate}</span>
              {" à "}
              <span>{time}</span>
              {nextEvent.location && (
                <>
                  {" — "}
                  <span className="text-gray-400">{nextEvent.location}</span>
                </>
              )}
            </div>
          </div>

          {/* Lien "Voir l'event" */}
          <Link
            href="/events"
            className="text-xs sm:text-sm text-[#9146ff] hover:text-[#7c3aed] transition-colors underline whitespace-nowrap flex-shrink-0"
          >
            Voir l&apos;event
          </Link>
        </div>
      </div>

    </div>
  );
}
