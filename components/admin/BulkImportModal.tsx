"use client";

import { useState } from "react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Array<{ nom: string; discord: string; twitch: string; discordId?: string }>) => void;
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
}: BulkImportModalProps) {
  const [importText, setImportText] = useState("");
  const [parsedMembers, setParsedMembers] = useState<Array<{ nom: string; discord: string; twitch: string; discordId?: string }>>([]);

  if (!isOpen) return null;

  const parseImportText = () => {
    const lines = importText.split("\n").filter(line => line.trim());
    const members: Array<{ nom: string; discord: string; twitch: string; discordId?: string }> = [];

    for (const line of lines) {
      // Format attendu: @PseudoDiscord : https://www.twitch.tv/channel
      // ou: @PseudoDiscord (Nom alternatif) : https://www.twitch.tv/channel
      const match = line.match(/@([^:]+?)\s*(?:\(([^)]+)\))?\s*:\s*(https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i);
      
      if (match) {
        const discordPseudo = match[1].trim();
        const nomAlternatif = match[2]?.trim();
        const twitchChannel = match[4].toLowerCase();
        
        members.push({
          nom: nomAlternatif || discordPseudo,
          discord: discordPseudo.replace(/^@/, ""),
          twitch: twitchChannel,
        });
      }
    }

    setParsedMembers(members);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedMembers.length === 0) {
      alert("Aucun membre valide trouvé. Vérifiez le format.");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir importer ${parsedMembers.length} membre(s) ?`)) {
      return;
    }

    onImport(parsedMembers);
    setImportText("");
    setParsedMembers([]);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Import en masse</h2>
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
              Liste des membres (une ligne par membre)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Format: @PseudoDiscord : https://www.twitch.tv/channel<br />
              ou: @PseudoDiscord (Nom alternatif) : https://www.twitch.tv/channel
            </p>
            <textarea
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                parseImportText();
              }}
              onBlur={parseImportText}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[300px] font-mono text-sm"
              placeholder="@Evan34740 : https://www.twitch.tv/evan34740&#10;@LudraTv : https://www.twitch.tv/ludra_tv&#10;..."
            />
          </div>

          {parsedMembers.length > 0 && (
            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300 mb-2">
                {parsedMembers.length} membre(s) détecté(s) :
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {parsedMembers.slice(0, 20).map((member, index) => (
                  <div key={index} className="text-xs text-gray-400">
                    {member.nom} (@{member.discord}) → {member.twitch}
                  </div>
                ))}
                {parsedMembers.length > 20 && (
                  <div className="text-xs text-gray-500">
                    ... et {parsedMembers.length - 20} autre(s)
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={parsedMembers.length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Importer {parsedMembers.length > 0 ? `${parsedMembers.length} membre(s)` : ""}
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













