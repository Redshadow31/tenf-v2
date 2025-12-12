"use client";

import { useState, useEffect } from "react";

interface RaidEntry {
  targetDiscordId: string;
  timestamp: string;
  source: "discord" | "manual";
  messageId?: string;
}

interface RaidDetails {
  raids: RaidEntry[];
  receivedRaids: RaidEntry[];
}

interface RaidDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberTwitchLogin: string;
  memberDisplayName: string;
  month: string;
  getMemberDisplayName: (twitchLogin: string) => string;
  onRefresh: () => void;
}

export default function RaidDetailsModal({
  isOpen,
  onClose,
  memberTwitchLogin,
  memberDisplayName,
  month,
  getMemberDisplayName,
  onRefresh,
}: RaidDetailsModalProps) {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<RaidDetails | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string>("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen && memberTwitchLogin) {
      loadDetails();
      loadMembers();
    }
  }, [isOpen, memberTwitchLogin, month]);

  async function loadDetails() {
    try {
      setLoading(true);
      const url = `/api/discord/raids/details?member=${encodeURIComponent(memberTwitchLogin)}&month=${encodeURIComponent(month)}`;
      console.log(`[RaidDetailsModal] Chargement des détails: ${url}`);
      
      const response = await fetch(url, {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[RaidDetailsModal] Données reçues:`, {
          hasDetails: !!data.details,
          raidsCount: data.details?.raids?.length || 0,
          receivedRaidsCount: data.details?.receivedRaids?.length || 0,
          fullData: data,
        });
        setDetails(data.details || { raids: [], receivedRaids: [] });
      } else {
        const errorText = await response.text();
        console.error("Erreur lors du chargement des détails:", {
          status: response.status,
          statusText: response.statusText,
          error: errorText,
        });
        setDetails({ raids: [], receivedRaids: [] });
      }
    } catch (error) {
      console.error("Erreur:", error);
      setDetails({ raids: [], receivedRaids: [] });
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    try {
      const response = await fetch("/api/members/public", {
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    }
  }

  async function addManualRaid() {
    if (!selectedTarget) {
      alert("Veuillez sélectionner une cible");
      return;
    }

    setAdding(true);
    try {
      const response = await fetch("/api/discord/raids/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raiderTwitchLogin: memberTwitchLogin,
          targetTwitchLogin: selectedTarget,
          month,
        }),
      });

      if (response.ok) {
        alert("Raid ajouté avec succès");
        setShowAddModal(false);
        setSelectedTarget("");
        await loadDetails();
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de l'ajout du raid");
    } finally {
      setAdding(false);
    }
  }

  async function deleteRaid(raidIndex: number, isReceived: boolean) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce raid ?")) {
      return;
    }

    try {
      const response = await fetch("/api/discord/raids/manual", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raiderTwitchLogin: memberTwitchLogin,
          raidIndex,
          isReceived,
          month,
        }),
      });

      if (response.ok) {
        alert("Raid supprimé avec succès");
        await loadDetails();
        onRefresh();
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la suppression du raid");
    }
  }

  function formatDate(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Détails des raids</h2>
            <p className="text-gray-400 text-sm mt-1">
              {memberDisplayName} ({memberTwitchLogin}) - {month}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
              <p className="text-gray-400">Chargement...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Raids faits */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">
                    Raids faits ({details?.raids.length || 0})
                  </h3>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    ➕ Ajouter un raid
                  </button>
                </div>
                {details?.raids.length === 0 ? (
                  <div className="text-gray-400 text-sm">
                    <p>Aucun raid fait</p>
                    {details && (details as any).hasLegacyData && (
                      <p className="text-yellow-400 text-xs mt-2">
                        ⚠️ Les raids de ce membre ont été enregistrés avant l'ajout du système de détails. 
                        Les dates individuelles ne sont pas disponibles.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0e0e10] border border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Cible</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Source</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details?.raids.map((raid, index) => {
                          const targetMember = members.find(m => m.discordId === raid.targetDiscordId);
                          const targetTwitchLogin = targetMember?.twitchLogin;
                          return (
                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="py-3 px-4 text-white">
                                {targetTwitchLogin ? getMemberDisplayName(targetTwitchLogin) : `ID: ${raid.targetDiscordId}`}
                              </td>
                              <td className="py-3 px-4 text-gray-300 text-sm">
                                {formatDate(raid.timestamp)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  raid.source === "manual"
                                    ? "bg-yellow-900/30 text-yellow-300"
                                    : "bg-blue-900/30 text-blue-300"
                                }`}>
                                  {raid.source === "manual" ? "Manuel" : "Discord"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => deleteRaid(index, false)}
                                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-1 rounded text-xs font-semibold transition-colors"
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Raids reçus */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Raids reçus ({details?.receivedRaids.length || 0})
                </h3>
                {details?.receivedRaids.length === 0 ? (
                  <div className="text-gray-400 text-sm">
                    <p>Aucun raid reçu</p>
                    {details && (details as any).hasLegacyData && (
                      <p className="text-yellow-400 text-xs mt-2">
                        ⚠️ Les raids de ce membre ont été enregistrés avant l'ajout du système de détails. 
                        Les dates individuelles ne sont pas disponibles.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#0e0e10] border border-gray-800 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Raider</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">Source</th>
                          <th className="text-right py-3 px-4 text-sm font-semibold text-gray-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {details?.receivedRaids.map((raid, index) => {
                          // Pour les raids reçus, targetDiscordId contient l'ID du raider
                          const raiderMember = members.find(m => m.discordId === raid.targetDiscordId);
                          const raiderTwitchLogin = raiderMember?.twitchLogin || raid.targetDiscordId;
                          return (
                            <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                              <td className="py-3 px-4 text-white">
                                {raiderMember ? getMemberDisplayName(raiderTwitchLogin) : `ID: ${raid.targetDiscordId}`}
                              </td>
                              <td className="py-3 px-4 text-gray-300 text-sm">
                                {formatDate(raid.timestamp)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  raid.source === "manual"
                                    ? "bg-yellow-900/30 text-yellow-300"
                                    : "bg-blue-900/30 text-blue-300"
                                }`}>
                                  {raid.source === "manual" ? "Manuel" : "Discord"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => deleteRaid(index, true)}
                                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-1 rounded text-xs font-semibold transition-colors"
                                >
                                  Supprimer
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal d'ajout */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-white mb-4">Ajouter un raid manuel</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Cible
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                  >
                    <option value="">Sélectionner une cible...</option>
                    {members
                      .filter(m => m.twitchLogin !== memberTwitchLogin)
                      .map((member) => (
                        <option key={member.twitchLogin} value={member.twitchLogin}>
                          {member.displayName} ({member.twitchLogin})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedTarget("");
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={addManualRaid}
                    disabled={adding || !selectedTarget}
                    className="bg-[#9146ff] hover:bg-[#5a32b4] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    {adding ? "Ajout..." : "Ajouter"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

