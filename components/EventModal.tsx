"use client";

import { useEffect } from "react";

type EventModalProps = {
  event: {
    id: string;
    title: string;
    description: string;
    image?: string;
    date: Date;
    category: string;
    location?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
};

export default function EventModal({
  event,
  isOpen,
  onClose,
  onRegister,
}: EventModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Vérifier si location est une URL
  const isUrl = (str: string): boolean => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-3xl overflow-y-auto border"
        style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-2 transition-colors"
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
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Image de l'événement */}
        {event.image && (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t" style={{ background: `linear-gradient(to top, var(--color-card), transparent)` }}></div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-8">
          {/* Badge catégorie */}
          <div className="mb-4">
            <span
              className="inline-block rounded-lg px-4 py-2 text-sm font-bold text-white"
              style={{ backgroundColor: getCategoryColor(event.category) }}
            >
              {event.category}
            </span>
          </div>

          {/* Titre */}
          <h2 className="mb-4 text-3xl font-bold" style={{ color: 'var(--color-text)' }}>{event.title}</h2>

          {/* Date */}
          <div className="mb-6 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(event.date)}</span>
          </div>

          {/* Description */}
          <div className="mb-8 space-y-4">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>Description</h3>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{event.description}</p>
          </div>

          {/* Localisation si disponible */}
          {event.location && (
            <div className="mb-8 flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
              <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {isUrl(event.location) ? (
                <a
                  href={event.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--color-primary-dark)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  {event.location}
                </a>
              ) : (
                <span>{event.location}</span>
              )}
            </div>
          )}

          {/* Bouton s'inscrire */}
          <button
            onClick={onRegister}
            className="w-full rounded-lg px-6 py-4 text-lg font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            S'inscrire à l'événement
          </button>
        </div>
      </div>
    </div>
  );
}

