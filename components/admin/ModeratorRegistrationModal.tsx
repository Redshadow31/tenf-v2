"use client";

import { useEffect, useState } from "react";

type ModeratorRegistrationModalProps = {
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
  onRegister: (formData: {
    pseudo: string;
    role: string;
    placement: "Animateur" | "Co-animateur" | "Observateur";
  }) => Promise<void>;
  isLoading?: boolean;
};

export default function ModeratorRegistrationModal({
  integration,
  isOpen,
  onClose,
  onRegister,
  isLoading = false,
}: ModeratorRegistrationModalProps) {
  const [formData, setFormData] = useState({
    pseudo: "",
    role: "",
    placement: "Animateur" as "Animateur" | "Co-animateur" | "Observateur",
  });

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

  useEffect(() => {
    // Réinitialiser le formulaire quand le modal s'ouvre
    if (isOpen) {
      setFormData({
        pseudo: "",
        role: "",
        placement: "Animateur",
      });
    }
  }, [isOpen]);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.pseudo || !formData.role || !formData.placement) {
      alert("Veuillez remplir tous les champs obligatoires (Pseudo, Rôle et Placement)");
      return;
    }
    onRegister(formData);
  };

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

          {/* Formulaire d'inscription modérateur */}
          <form onSubmit={handleSubmitForm} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Pseudo * <span className="text-gray-500 text-xs">(obligatoire)</span>
              </label>
              <input
                type="text"
                value={formData.pseudo}
                onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
                placeholder="Votre pseudo"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Rôle * <span className="text-gray-500 text-xs">(obligatoire)</span>
              </label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
                placeholder="Ex: Admin, Admin du site, Administrateur..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Placement * <span className="text-gray-500 text-xs">(obligatoire)</span>
              </label>
              <select
                value={formData.placement}
                onChange={(e) => setFormData({ ...formData, placement: e.target.value as "Animateur" | "Co-animateur" | "Observateur" })}
                className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                required
              >
                <option value="Animateur">Animateur</option>
                <option value="Co-animateur">Co-animateur</option>
                <option value="Observateur">Observateur</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.pseudo || !formData.role || !formData.placement}
              className="w-full rounded-lg bg-[#9146ff] px-6 py-4 text-lg font-semibold text-white transition-colors hover:bg-[#5a32b4] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Inscription..." : "S'inscrire"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

