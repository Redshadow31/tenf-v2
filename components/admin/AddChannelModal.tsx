"use client";

import { useState } from "react";

type MemberRole = "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" | "Communauté";

interface AddChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: {
    nom: string;
    role: MemberRole;
    statut: "Actif" | "Inactif";
    discord: string;
    discordId?: string;
    twitch: string;
    avatar: string;
  }) => void;
}

export default function AddChannelModal({
  isOpen,
  onClose,
  onAdd,
}: AddChannelModalProps) {
  const [formData, setFormData] = useState({
    nom: "",
    twitch: "",
    discord: "",
    discordId: "",
    role: "Affilié" as MemberRole,
    statut: "Actif" as "Actif" | "Inactif",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.twitch || !formData.discord) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Twitch, Discord)");
      return;
    }

    // Extraire le login Twitch de l'URL si fournie
    let twitchLogin = formData.twitch.toLowerCase().trim();
    if (twitchLogin.includes("twitch.tv/")) {
      const match = twitchLogin.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
      if (match) {
        twitchLogin = match[1];
      }
    }
    // Nettoyer le login Twitch (enlever les caractères spéciaux)
    twitchLogin = twitchLogin.replace(/[^a-zA-Z0-9_]/g, "");

    onAdd({
      nom: formData.nom,
      twitch: twitchLogin,
      discord: formData.discord,
      discordId: formData.discordId.trim() || undefined,
      role: formData.role,
      statut: formData.statut,
      avatar: `https://placehold.co/64x64?text=${formData.nom.charAt(0).toUpperCase()}`,
    });

    // Reset form
    setFormData({
      nom: "",
      twitch: "",
      discord: "",
      discordId: "",
      role: "Affilié",
      statut: "Actif",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Ajouter une chaîne</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Nom du créateur *
            </label>
            <input
              type="text"
              value={formData.nom}
              onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: Clara"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Pseudo Twitch ou URL *
            </label>
            <input
              type="text"
              value={formData.twitch}
              onChange={(e) => setFormData({ ...formData, twitch: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: clarastonewall ou https://www.twitch.tv/clarastonewall"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Pseudo Discord *
            </label>
            <input
              type="text"
              value={formData.discord}
              onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: ClaraStonewall ou @ClaraStonewall"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              ID Discord (optionnel)
            </label>
            <input
              type="text"
              value={formData.discordId}
              onChange={(e) => setFormData({ ...formData, discordId: e.target.value })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              placeholder="Ex: 535244297214361603"
            />
            <p className="text-xs text-gray-500 mt-1">L'ID Discord permet de synchroniser automatiquement les rôles depuis Discord</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Rôle
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as MemberRole })}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Affilié">Affilié</option>
              <option value="Développement">Développement</option>
              <option value="Modérateur Junior">Modérateur Junior</option>
              <option value="Mentor">Mentor</option>
              <option value="Admin">Admin</option>
              <option value="Admin Adjoint">Admin Adjoint</option>
              <option value="Créateur Junior">Créateur Junior</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Statut
            </label>
            <select
              value={formData.statut}
              onChange={(e) =>
                setFormData({ ...formData, statut: e.target.value as "Actif" | "Inactif" })
              }
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
            >
              <option value="Actif">Actif</option>
              <option value="Inactif">Inactif</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Ajouter
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


