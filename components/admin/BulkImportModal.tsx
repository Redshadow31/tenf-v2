"use client";

import { useState, useEffect } from "react";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (members: Array<{ nom: string; discord: string; twitch: string; discordId?: string }>) => void;
}

interface ParsedMember {
  nom: string;
  discord: string;
  twitch: string;
  discordId?: string;
  isDuplicateInList?: boolean; // Doublon dans la liste d'import
  isExistingMember?: boolean; // Membre existant dans la base
  existingMemberInfo?: { displayName: string; twitchLogin: string; discordUsername?: string }; // Info du membre existant
  duplicateIndex?: number; // Index du doublon dans la liste
}

export default function BulkImportModal({
  isOpen,
  onClose,
  onImport,
}: BulkImportModalProps) {
  const [importText, setImportText] = useState("");
  const [parsedMembers, setParsedMembers] = useState<ParsedMember[]>([]);
  const [existingMembers, setExistingMembers] = useState<any[]>([]);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Charger les membres existants quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadExistingMembers();
    }
  }, [isOpen]);

  const loadExistingMembers = async () => {
    setLoadingExisting(true);
    try {
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExistingMembers(data.members || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres existants:", error);
    } finally {
      setLoadingExisting(false);
    }
  };

  if (!isOpen) return null;

  const parseImportText = () => {
    const lines = importText.split("\n").filter(line => line.trim());
    const members: ParsedMember[] = [];

    // Parser les membres
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

    // Détecter les doublons dans la liste elle-même
    const twitchSet = new Set<string>();
    const discordSet = new Set<string>();
    
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const twitchLower = member.twitch.toLowerCase();
      const discordLower = member.discord.toLowerCase();
      
      // Vérifier si c'est un doublon dans la liste
      if (twitchSet.has(twitchLower)) {
        // Trouver l'index du premier membre avec ce Twitch
        const firstIndex = members.findIndex(m => m.twitch.toLowerCase() === twitchLower);
        members[i].isDuplicateInList = true;
        members[i].duplicateIndex = firstIndex;
        if (firstIndex !== i) {
          members[firstIndex].isDuplicateInList = true;
          members[firstIndex].duplicateIndex = firstIndex;
        }
      } else {
        twitchSet.add(twitchLower);
      }
      
      // Vérifier aussi par Discord si présent
      if (discordLower && discordSet.has(discordLower)) {
        const firstIndex = members.findIndex(m => m.discord.toLowerCase() === discordLower);
        members[i].isDuplicateInList = true;
        if (firstIndex !== i) {
          members[firstIndex].isDuplicateInList = true;
        }
      } else if (discordLower) {
        discordSet.add(discordLower);
      }
    }

    // Comparer avec les membres existants
    const existingTwitchLogins = new Set(
      existingMembers.map(m => (m.twitchLogin || m.twitch || '').toLowerCase())
    );
    const existingDiscordIds = new Set(
      existingMembers.map(m => (m.discordId || '').toLowerCase()).filter(Boolean)
    );
    const existingDiscordUsernames = new Set(
      existingMembers.map(m => (m.discordUsername || m.discord || '').toLowerCase()).filter(Boolean)
    );

    for (const member of members) {
      const twitchLower = member.twitch.toLowerCase();
      const discordLower = member.discord.toLowerCase();
      
      // Vérifier si le membre existe déjà
      if (existingTwitchLogins.has(twitchLower) || 
          existingDiscordUsernames.has(discordLower) ||
          (member.discordId && existingDiscordIds.has(member.discordId.toLowerCase()))) {
        member.isExistingMember = true;
        
        // Trouver les infos du membre existant
        const existing = existingMembers.find(m => 
          (m.twitchLogin || m.twitch || '').toLowerCase() === twitchLower ||
          (m.discordUsername || m.discord || '').toLowerCase() === discordLower ||
          (member.discordId && m.discordId === member.discordId)
        );
        
        if (existing) {
          member.existingMemberInfo = {
            displayName: existing.displayName || existing.nom || '',
            twitchLogin: existing.twitchLogin || existing.twitch || '',
            discordUsername: existing.discordUsername || existing.discord || '',
          };
        }
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

    // Filtrer les membres valides (non doublons dans la liste et non existants)
    const validMembers = parsedMembers.filter(m => 
      !m.isDuplicateInList && !m.isExistingMember
    );

    if (validMembers.length === 0) {
      const duplicateCount = parsedMembers.filter(m => m.isDuplicateInList).length;
      const existingCount = parsedMembers.filter(m => m.isExistingMember).length;
      alert(`Aucun nouveau membre à importer.\n- ${duplicateCount} doublon(s) dans la liste\n- ${existingCount} membre(s) existant(s) déjà`);
      return;
    }

    const duplicateCount = parsedMembers.filter(m => m.isDuplicateInList).length;
    const existingCount = parsedMembers.filter(m => m.isExistingMember).length;
    
    let confirmMessage = `Importer ${validMembers.length} nouveau(x) membre(s) ?`;
    if (duplicateCount > 0 || existingCount > 0) {
      confirmMessage += `\n\n⚠️ ${duplicateCount} doublon(s) dans la liste seront ignorés`;
      if (existingCount > 0) {
        confirmMessage += `\n⚠️ ${existingCount} membre(s) existant(s) seront ignorés`;
      }
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    // Passer uniquement les membres valides
    onImport(validMembers);
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

          {loadingExisting && (
            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-400">Chargement des membres existants...</p>
            </div>
          )}

          {parsedMembers.length > 0 && (
            <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-300">
                  {parsedMembers.length} membre(s) détecté(s)
                </p>
                <div className="flex gap-4 text-xs">
                  {parsedMembers.filter(m => !m.isDuplicateInList && !m.isExistingMember).length > 0 && (
                    <span className="text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {parsedMembers.filter(m => !m.isDuplicateInList && !m.isExistingMember).length} nouveau(x)
                    </span>
                  )}
                  {parsedMembers.filter(m => m.isDuplicateInList).length > 0 && (
                    <span className="text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {parsedMembers.filter(m => m.isDuplicateInList).length} doublon(s) dans la liste
                    </span>
                  )}
                  {parsedMembers.filter(m => m.isExistingMember).length > 0 && (
                    <span className="text-red-400 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {parsedMembers.filter(m => m.isExistingMember).length} existant(s)
                    </span>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {parsedMembers.map((member, index) => {
                  const isValid = !member.isDuplicateInList && !member.isExistingMember;
                  const isDuplicate = member.isDuplicateInList;
                  const isExisting = member.isExistingMember;
                  
                  return (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded border ${
                        isValid
                          ? "text-green-300 border-green-500/30 bg-green-500/10"
                          : isDuplicate
                          ? "text-yellow-300 border-yellow-500/30 bg-yellow-500/10"
                          : "text-red-300 border-red-500/30 bg-red-500/10"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isValid && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                        {isDuplicate && <AlertCircle className="w-3 h-3 text-yellow-400" />}
                        {isExisting && <XCircle className="w-3 h-3 text-red-400" />}
                        <span className="font-medium">{member.nom}</span>
                        <span className="text-gray-500">(@{member.discord})</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-400">{member.twitch}</span>
                      </div>
                      {isDuplicate && (
                        <div className="text-yellow-400/70 mt-1 ml-5 text-xs">
                          ⚠️ Doublon dans la liste (ligne {member.duplicateIndex !== undefined ? member.duplicateIndex + 1 : '?'})
                        </div>
                      )}
                      {isExisting && member.existingMemberInfo && (
                        <div className="text-red-400/70 mt-1 ml-5 text-xs">
                          ⚠️ Existe déjà : {member.existingMemberInfo.displayName} ({member.existingMemberInfo.twitchLogin})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={parsedMembers.length === 0 || parsedMembers.filter(m => !m.isDuplicateInList && !m.isExistingMember).length === 0}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {parsedMembers.length > 0 ? (
                <>
                  Importer {parsedMembers.filter(m => !m.isDuplicateInList && !m.isExistingMember).length} membre(s)
                  {(parsedMembers.filter(m => m.isDuplicateInList || m.isExistingMember).length > 0) && (
                    <span className="text-xs block mt-1 opacity-75">
                      ({parsedMembers.filter(m => m.isDuplicateInList || m.isExistingMember).length} ignoré(s))
                    </span>
                  )}
                </>
              ) : (
                "Aucun membre à importer"
              )}
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


















