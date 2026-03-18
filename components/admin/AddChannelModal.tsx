"use client";

import { useEffect, useMemo, useState } from "react";

type MemberRole =
  | "Nouveau"
  | "Affilié"
  | "Développement"
  | "Créateur Junior"
  | "Les P'tits Jeunes"
  | "Communauté"
  | "Modérateur en formation"
  | "Modérateur"
  | "Modérateur en activité réduite"
  | "Modérateur en pause"
  | "Soutien TENF"
  | "Admin"
  | "Admin Coordinateur"
  | "Contributeur TENF du Mois";

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

const INITIAL_FORM = {
  nom: "",
  twitch: "",
  discord: "",
  discordId: "",
  role: "Affilié" as MemberRole,
  statut: "Actif" as "Actif" | "Inactif",
};

function normalizeTwitchLogin(rawValue: string): string {
  let value = rawValue.toLowerCase().trim();
  if (value.includes("twitch.tv/")) {
    const match = value.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
    if (match) {
      value = match[1];
    }
  }
  return value.replace(/[^a-zA-Z0-9_]/g, "");
}

export default function AddChannelModal({ isOpen, onClose, onAdd }: AddChannelModalProps) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFormData(INITIAL_FORM);
    setSubmitError(null);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const normalizedTwitch = useMemo(() => normalizeTwitchLogin(formData.twitch), [formData.twitch]);
  const canSubmit = Boolean(formData.nom.trim()) && Boolean(normalizedTwitch);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!formData.nom.trim() || !normalizedTwitch) {
      setSubmitError("Les champs nom et Twitch sont obligatoires.");
      return;
    }

    const finalStatus = formData.role === "Communauté" ? "Inactif" : formData.statut;

    onAdd({
      nom: formData.nom.trim(),
      twitch: normalizedTwitch,
      discord: formData.discord.trim(),
      discordId: formData.discordId.trim() || undefined,
      role: formData.role,
      statut: finalStatus,
      avatar: `https://placehold.co/64x64?text=${formData.nom.trim().charAt(0).toUpperCase()}`,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Ajouter une chaîne"
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-xl max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-[#141418]">
          <div>
            <h2 className="text-2xl font-bold text-white">Ajouter une chaîne</h2>
            <p className="text-sm text-gray-400 mt-1">
              Crée un membre rapidement avec les informations essentielles.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
            type="button"
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

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Identité & Twitch</h3>

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
                <p className="text-xs text-gray-500 mt-1">
                  Login détecté: <span className="text-gray-300">{normalizedTwitch || "—"}</span>
                </p>
              </div>
            </div>

            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-300">Discord</h3>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Pseudo Discord
                </label>
                <input
                  type="text"
                  value={formData.discord}
                  onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Ex: ClaraStonewall ou @ClaraStonewall"
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
                <p className="text-xs text-gray-500 mt-1">
                  L&apos;ID Discord améliore la synchronisation automatique des données membre.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Rôle & statut</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Rôle
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const nextRole = e.target.value as MemberRole;
                    setFormData((prev) => ({
                      ...prev,
                      role: nextRole,
                      statut: nextRole === "Communauté" ? "Inactif" : prev.statut,
                    }));
                  }}
                  className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Nouveau">Nouveau</option>
                  <option value="Affilié">Affilié</option>
                  <option value="Développement">Développement</option>
                  <option value="Créateur Junior">Créateur Junior</option>
                  <option value="Les P'tits Jeunes">Les P&apos;tits Jeunes</option>
                  <option value="Communauté">Communauté</option>
                  <option value="Modérateur en formation">Modérateur en formation</option>
                  <option value="Modérateur">Modérateur</option>
                  <option value="Modérateur en activité réduite">Modérateur en activité réduite</option>
                  <option value="Modérateur en pause">Modérateur en pause</option>
                  <option value="Soutien TENF">Soutien TENF</option>
                  <option value="Admin">Admin</option>
                  <option value="Admin Coordinateur">Admin Coordinateur</option>
                  <option value="Contributeur TENF du Mois">Contributeur TENF du Mois</option>
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
                  <option value="Actif" disabled={formData.role === "Communauté"}>
                    Actif
                  </option>
                  <option value="Inactif">Inactif</option>
                </select>
                {formData.role === "Communauté" && (
                  <p className="text-xs text-orange-300 mt-1">
                    Le rôle Communauté force le statut Inactif.
                  </p>
                )}
              </div>
            </div>
          </div>

          {submitError && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {submitError}
            </div>
          )}
        </form>

        <div className="flex gap-3 p-6 border-t border-gray-700 bg-[#141418]">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Ajouter le membre
          </button>
        </div>
      </div>
    </div>
  );
}
