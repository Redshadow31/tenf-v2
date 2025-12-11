"use client";

import { useState } from "react";

interface MemberToMerge {
  twitchLogin: string;
  displayName: string;
  discordId?: string;
  discordUsername?: string;
  twitchUrl: string;
  role: string;
  isVip: boolean;
  badges?: string[];
  description?: string;
  customBio?: string;
  siteUsername?: string;
  listId?: number;
  avatar?: string;
}

interface MergeMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberToMerge[];
  onMerge: (mergedData: MemberToMerge) => void;
  loading?: boolean;
  allDuplicates?: Array<{ key: string; type: string; members: MemberToMerge[] }>;
  currentDuplicateIndex?: number;
  onNextDuplicate?: () => void;
  onPreviousDuplicate?: () => void;
}

export default function MergeMemberModal({
  isOpen,
  onClose,
  members,
  onMerge,
  loading = false,
  allDuplicates = [],
  currentDuplicateIndex = 0,
  onNextDuplicate,
  onPreviousDuplicate,
}: MergeMemberModalProps) {
  const [selectedFields, setSelectedFields] = useState<Record<string, number>>({});

  if (!isOpen || members.length < 2) return null;

  // Initialiser les sélections par défaut (garder les infos du premier membre)
  if (Object.keys(selectedFields).length === 0) {
    const defaultSelections: Record<string, number> = {};
    const fields = [
      'displayName',
      'twitchLogin',
      'twitchUrl',
      'discordId',
      'discordUsername',
      'role',
      'isVip',
      'badges',
      'description',
      'customBio',
      'siteUsername',
      'listId',
    ];
    fields.forEach(field => {
      defaultSelections[field] = 0; // Par défaut, garder les infos du premier membre
    });
    setSelectedFields(defaultSelections);
  }

  const handleFieldSelection = (field: string, memberIndex: number) => {
    setSelectedFields({
      ...selectedFields,
      [field]: memberIndex,
    });
  };

  const handleMerge = () => {
    // Construire l'objet fusionné avec les sélections
    const merged: MemberToMerge = {
      twitchLogin: members[selectedFields.twitchLogin || 0].twitchLogin,
      displayName: members[selectedFields.displayName || 0].displayName,
      twitchUrl: members[selectedFields.twitchUrl || 0].twitchUrl,
      discordId: members[selectedFields.discordId || 0]?.discordId,
      discordUsername: members[selectedFields.discordUsername || 0]?.discordUsername,
      role: members[selectedFields.role || 0].role,
      isVip: members[selectedFields.isVip || 0]?.isVip || false,
      badges: members[selectedFields.badges || 0]?.badges,
      description: members[selectedFields.description || 0]?.description,
      customBio: members[selectedFields.customBio || 0]?.customBio,
      siteUsername: members[selectedFields.siteUsername || 0]?.siteUsername,
      listId: members[selectedFields.listId || 0]?.listId,
      avatar: members[0]?.avatar, // Garder l'avatar du premier
    };

    onMerge(merged);
  };

  const fieldLabels: Record<string, string> = {
    displayName: "Nom d'affichage",
    twitchLogin: "Login Twitch",
    twitchUrl: "URL Twitch",
    discordId: "ID Discord",
    discordUsername: "Pseudo Discord",
    role: "Rôle",
    isVip: "Statut VIP",
    badges: "Badges",
    description: "Description",
    customBio: "Bio personnalisée",
    siteUsername: "Pseudo site",
    listId: "Liste",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Fusionner les membres en doublon
            </h2>
            {allDuplicates.length > 1 && (
              <p className="text-sm text-gray-400 mt-1">
                Doublon {currentDuplicateIndex + 1} sur {allDuplicates.length}
              </p>
            )}
          </div>
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

        <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-sm text-yellow-300">
            ⚠️ Ces membres ont été détectés comme doublons (même Discord mais chaînes Twitch différentes).
            Sélectionnez les informations à conserver pour chaque champ. Le membre fusionné remplacera les doublons.
          </p>
        </div>

        {/* Liste des membres à fusionner */}
        <div className="space-y-4 mb-6">
          {members.map((member, index) => (
            <div
              key={index}
              className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4"
            >
              <h3 className="font-semibold text-white mb-2">
                Membre {index + 1}: {member.displayName}
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Twitch:</span>{" "}
                  <span className="text-white">{member.twitchLogin}</span>
                </div>
                <div>
                  <span className="text-gray-400">Discord:</span>{" "}
                  <span className="text-white">
                    {member.discordUsername || member.discordId || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Rôle:</span>{" "}
                  <span className="text-white">{member.role}</span>
                </div>
                <div>
                  <span className="text-gray-400">VIP:</span>{" "}
                  <span className="text-white">{member.isVip ? "Oui" : "Non"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sélection des champs */}
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-white">
            Sélectionner les informations à conserver
          </h3>
          {Object.entries(fieldLabels).map(([field, label]) => {
            const values = members.map(m => {
              if (field === 'isVip') return m.isVip ? 'Oui' : 'Non';
              if (field === 'badges') return m.badges?.join(', ') || 'Aucun';
              if (field === 'listId') return m.listId?.toString() || 'Aucune';
              return (m as any)[field] || 'N/A';
            });

            return (
              <div key={field} className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  {label}
                </label>
                <div className="space-y-2">
                  {members.map((member, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                        selectedFields[field] === index
                          ? "bg-purple-500/20 border border-purple-500"
                          : "hover:bg-gray-700/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={field}
                        checked={selectedFields[field] === index}
                        onChange={() => handleFieldSelection(field, index)}
                        className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <span className="text-white font-medium">
                          Membre {index + 1} ({member.displayName}):
                        </span>
                        <span className="text-gray-300 ml-2">
                          {values[index]}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Aperçu du résultat */}
        <div className="mb-6 p-4 bg-[#0e0e10] border border-purple-500/30 rounded-lg">
          <h3 className="text-sm font-semibold text-purple-300 mb-2">
            Aperçu du membre fusionné:
          </h3>
          <div className="text-sm text-gray-300 space-y-1">
            <div>
              <span className="text-gray-400">Nom:</span>{" "}
              {members[selectedFields.displayName || 0]?.displayName}
            </div>
            <div>
              <span className="text-gray-400">Twitch:</span>{" "}
              {members[selectedFields.twitchLogin || 0]?.twitchLogin}
            </div>
            <div>
              <span className="text-gray-400">Discord:</span>{" "}
              {members[selectedFields.discordUsername || 0]?.discordUsername || 
               members[selectedFields.discordId || 0]?.discordId || "N/A"}
            </div>
            <div>
              <span className="text-gray-400">Rôle:</span>{" "}
              {members[selectedFields.role || 0]?.role}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {allDuplicates.length > 1 && (
            <>
              <button
                onClick={onPreviousDuplicate}
                disabled={loading || currentDuplicateIndex === 0}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Précédent
              </button>
              <button
                onClick={onNextDuplicate}
                disabled={loading || currentDuplicateIndex === allDuplicates.length - 1}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Suivant →
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleMerge}
            disabled={loading}
            className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Fusion en cours..." : `Fusionner ${members.length} membre(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

