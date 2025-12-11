"use client";

import { useState, useEffect } from "react";

interface DiscordMember {
  discordId: string;
  discordUsername: string;
  displayName: string;
  roles: string[];
  siteRole: string;
  twitchLogin?: string;
  isExisting?: boolean;
  hasManualChanges?: boolean;
}

interface DiscordSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (selectedMemberIds: string[]) => void;
  members: DiscordMember[];
  loading?: boolean;
}

export default function DiscordSyncModal({
  isOpen,
  onClose,
  onSync,
  members,
  loading = false,
}: DiscordSyncModalProps) {
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showOnlyNew, setShowOnlyNew] = useState(false);
  const [showOnlyManual, setShowOnlyManual] = useState(false);

  // Sélectionner tous les nouveaux membres par défaut
  useEffect(() => {
    if (isOpen && members.length > 0) {
      const newMembers = members.filter(m => !m.isExisting);
      const newIds = new Set(newMembers.map(m => m.discordId));
      setSelectedMembers(newIds);
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.discordUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.twitchLogin?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === "all" || member.siteRole === filterRole;
    const matchesNew = !showOnlyNew || !member.isExisting;
    const matchesManual = !showOnlyManual || member.hasManualChanges;

    return matchesSearch && matchesRole && matchesNew && matchesManual;
  });

  const toggleMember = (discordId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(discordId)) {
      newSelected.delete(discordId);
    } else {
      newSelected.add(discordId);
    }
    setSelectedMembers(newSelected);
  };

  const selectAll = () => {
    const allIds = new Set(filteredMembers.map(m => m.discordId));
    setSelectedMembers(allIds);
  };

  const deselectAll = () => {
    setSelectedMembers(new Set());
  };

  const handleSync = () => {
    if (selectedMembers.size === 0) {
      alert("Veuillez sélectionner au moins un membre à synchroniser.");
      return;
    }
    onSync(Array.from(selectedMembers));
  };

  const roles = Array.from(new Set(members.map(m => m.siteRole))).sort();
  const selectedCount = selectedMembers.size;
  const newMembersCount = members.filter(m => !m.isExisting).length;
  const manualMembersCount = members.filter(m => m.hasManualChanges).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Synchronisation Discord - Sélection des membres
          </h2>
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

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Total</div>
            <div className="text-lg font-bold text-white">{members.length}</div>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Sélectionnés</div>
            <div className="text-lg font-bold text-[#9146ff]">{selectedCount}</div>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Nouveaux</div>
            <div className="text-lg font-bold text-green-400">{newMembersCount}</div>
          </div>
          <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-400">Modifiés manuellement</div>
            <div className="text-lg font-bold text-yellow-400">{manualMembersCount}</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
          >
            <option value="all">Tous les rôles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyNew}
              onChange={(e) => setShowOnlyNew(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Nouveaux uniquement</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyManual}
              onChange={(e) => setShowOnlyManual(e.target.checked)}
              className="w-4 h-4 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">Modifiés manuellement</span>
          </label>
        </div>

        {/* Actions de sélection */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={selectAll}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Tout sélectionner
          </button>
          <button
            onClick={deselectAll}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
          >
            Tout désélectionner
          </button>
        </div>

        {/* Liste des membres */}
        <div className="flex-1 overflow-y-auto border border-gray-700 rounded-lg bg-[#0e0e10]">
          <div className="divide-y divide-gray-700">
            {filteredMembers.map((member) => {
              const isSelected = selectedMembers.has(member.discordId);
              const isNew = !member.isExisting;
              const hasManual = member.hasManualChanges;

              return (
                <label
                  key={member.discordId}
                  className={`flex items-center gap-4 p-4 hover:bg-[#1a1a1d] cursor-pointer ${
                    isSelected ? "bg-purple-900/20" : ""
                  } ${hasManual ? "border-l-4 border-yellow-500" : ""}`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMember(member.discordId)}
                    className="w-5 h-5 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">
                        {member.displayName}
                      </span>
                      <span className="text-sm text-gray-400">
                        @{member.discordUsername}
                      </span>
                      {isNew && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-semibold">
                          Nouveau
                        </span>
                      )}
                      {hasManual && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold">
                          Modifié manuellement
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                        {member.siteRole}
                      </span>
                      {member.twitchLogin && (
                        <span className="text-xs text-gray-400">
                          Twitch: {member.twitchLogin}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          {filteredMembers.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              Aucun membre trouvé avec ces filtres
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={handleSync}
            disabled={loading || selectedCount === 0}
            className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Synchronisation..."
              : `Synchroniser ${selectedCount} membre(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}

