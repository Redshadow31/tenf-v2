"use client";

import { useEffect } from "react";

type IntegrationModalProps = {
  integration: {
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

export default function IntegrationModal({
  integration,
  isOpen,
  onClose,
  onRegister,
}: IntegrationModalProps) {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Intégration standard":
        return "bg-[#9146ff]";
      case "Intégration rapide":
        return "bg-blue-500";
      case "Intégration spéciale":
        return "bg-green-500";
      default:
        return "bg-gray-700";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="card relative max-h-[90vh] w-full max-w-3xl overflow-y-auto bg-[#1a1a1d] border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg bg-[#0e0e10] p-2 text-gray-400 transition-colors hover:text-white"
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

        {/* Image de l'intégration */}
        {integration.image && (
          <div className="relative h-64 w-full overflow-hidden">
            <img
              src={integration.image}
              alt={integration.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1d] to-transparent"></div>
          </div>
        )}

        {/* Contenu */}
        <div className="p-8">
          {/* Badge catégorie */}
          <div className="mb-4">
            <span
              className={`inline-block rounded-lg px-4 py-2 text-sm font-bold text-white ${getCategoryColor(
                integration.category
              )}`}
            >
              {integration.category}
            </span>
          </div>

          {/* Titre */}
          <h2 className="mb-4 text-3xl font-bold text-white">{integration.title}</h2>

          {/* Date */}
          <div className="mb-6 flex items-center gap-2 text-gray-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(integration.date)}</span>
          </div>

          {/* Description */}
          <div className="mb-8 space-y-4">
            <h3 className="text-xl font-semibold text-white">Description</h3>
            <p className="text-gray-300 leading-relaxed">{integration.description}</p>
          </div>

          {/* Localisation si disponible */}
          {integration.location && (
            <div className="mb-8 flex items-center gap-2 text-gray-300">
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
              {isUrl(integration.location) ? (
                <a
                  href={integration.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9146ff] hover:text-[#7c3aed] underline break-all transition-colors"
                >
                  {integration.location}
                </a>
              ) : (
                <span>{integration.location}</span>
              )}
            </div>
          )}

          {/* Bouton s'inscrire */}
          <button
            onClick={onRegister}
            className="w-full rounded-lg bg-[#9146ff] px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#5a32b4]"
          >
            S'inscrire à l'intégration
          </button>
        </div>
      </div>
    </div>
  );
}

