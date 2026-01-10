"use client";

import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

interface Member {
  twitchLogin: string;
  twitchId: string;
  discordId?: string;
  displayName: string;
  isActive: boolean;
}

interface VerifyTwitchNamesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VerifyTwitchNamesModal({
  isOpen,
  onClose,
}: VerifyTwitchNamesModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set()); // Set de twitchId
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Array<{
    twitchId: string;
    oldLogin: string;
    newLogin: string | null;
    updated: boolean;
    error?: string;
  }> | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setSelectedMembers(new Set());
      setResults(null);
      setSearchQuery("");
      setVerifying(false);
    }
  }, [isOpen]);

  async function loadMembers() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/members/verify-twitch-names", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
        return;
      }

      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleSelect = (twitchId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(twitchId)) {
      newSelected.delete(twitchId);
    } else {
      newSelected.add(twitchId);
    }
    setSelectedMembers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredMembers.map(m => m.twitchId)));
    }
  };

  const handleVerify = async () => {
    if (selectedMembers.size === 0) {
      alert("Veuillez sélectionner au moins un membre à vérifier");
      return;
    }

    if (!confirm(`Voulez-vous vérifier et mettre à jour les noms de chaînes pour ${selectedMembers.size} membre(s) sélectionné(s) ?`)) {
      return;
    }

    setVerifying(true);
    try {
      // Préparer les identifiants pour l'API
      const memberIds = Array.from(selectedMembers).map(twitchId => {
        const member = members.find(m => m.twitchId === twitchId);
        return {
          twitchId: member?.twitchId,
          discordId: member?.discordId,
          twitchLogin: member?.twitchLogin,
        };
      }).filter(Boolean) as Array<{ twitchId: string; discordId?: string; twitchLogin: string }>;

      const response = await fetch("/api/admin/members/verify-twitch-names", {
        method: "POST",
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({ memberIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
        return;
      }

      const data = await response.json();
      setResults(data.results || []);

      // Recharger les membres pour obtenir les nouveaux noms
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setVerifying(false);
    }
  };

  // Filtrer les membres par recherche
  const filteredMembers = members.filter((member) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.twitchLogin?.toLowerCase().includes(query) ||
      member.displayName?.toLowerCase().includes(query) ||
      member.discordId?.toLowerCase().includes(query) ||
      member.twitchId?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a1a1d] border border-gray-700 rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Vérifier les noms de chaînes Twitch</h2>
            <p className="text-sm text-gray-400 mt-1">
              Vérifie les noms de chaînes via leur ID Twitch pour détecter les changements de pseudo
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
              <span className="ml-3 text-gray-400">Chargement des membres...</span>
            </div>
          ) : (
            <>
              {/* Barre de recherche et actions */}
              <div className="mb-4 flex items-center gap-4">
                <input
                  type="text"
                  placeholder="Rechercher un membre (pseudo, nom, ID)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg transition-colors text-sm font-semibold border border-purple-500/30"
                >
                  {selectedMembers.size === filteredMembers.length ? "Tout désélectionner" : "Tout sélectionner"}
                </button>
                <button
                  onClick={loadMembers}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-semibold disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 inline ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Statistiques */}
              <div className="mb-4 p-3 bg-[#0e0e10] border border-gray-700 rounded-lg">
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span>
                    <span className="text-white font-semibold">{members.length}</span> membre{members.length > 1 ? 's' : ''} avec ID Twitch
                  </span>
                  <span>
                    <span className="text-purple-400 font-semibold">{selectedMembers.size}</span> sélectionné{selectedMembers.size > 1 ? 's' : ''}
                  </span>
                  {filteredMembers.length < members.length && (
                    <span>
                      <span className="text-blue-400 font-semibold">{filteredMembers.length}</span> filtré{filteredMembers.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {results && results.length > 0 && (
                    <>
                      <span className="text-green-400 font-semibold">
                        {results.filter(r => r.updated).length} mis à jour
                      </span>
                      <span className="text-red-400 font-semibold">
                        {results.filter(r => r.error).length} erreur{results.filter(r => r.error).length > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Section de résultats détaillés */}
              {results && results.length > 0 && (
                <div className="mb-4 space-y-3">
                  {/* Mises à jour */}
                  {results.filter(r => r.updated).length > 0 && (
                    <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                      <h3 className="text-green-300 font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Mises à jour ({results.filter(r => r.updated).length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {results.filter(r => r.updated).map((result) => {
                          const member = members.find(m => m.twitchId === result.twitchId);
                          return (
                            <div key={result.twitchId} className="bg-[#0e0e10] rounded-lg p-3 border border-green-500/20">
                              <div className="text-sm text-white font-medium">
                                {member?.displayName || member?.twitchLogin || "Membre inconnu"}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                <span className="line-through text-gray-500">{result.oldLogin}</span>
                                {" → "}
                                <span className="text-green-400 font-semibold">{result.newLogin}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID Twitch: <code className="bg-[#1a1a1d] px-1 py-0.5 rounded">{result.twitchId}</code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Erreurs */}
                  {results.filter(r => r.error).length > 0 && (
                    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <h3 className="text-red-300 font-semibold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Erreurs ({results.filter(r => r.error).length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {results.filter(r => r.error).map((result) => {
                          const member = members.find(m => m.twitchId === result.twitchId);
                          return (
                            <div key={result.twitchId} className="bg-[#0e0e10] rounded-lg p-3 border border-red-500/20">
                              <div className="text-sm text-white font-medium">
                                {member?.displayName || member?.twitchLogin || "Membre inconnu"}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Twitch: <span className="text-gray-500">{result.oldLogin}</span>
                              </div>
                              <div className="text-xs text-red-400 mt-1 font-medium">
                                ⚠️ {result.error}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ID Twitch: <code className="bg-[#1a1a1d] px-1 py-0.5 rounded">{result.twitchId}</code>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Liste des membres */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    {searchQuery ? "Aucun membre trouvé avec ce critère de recherche" : "Aucun membre avec ID Twitch trouvé"}
                  </div>
                ) : (
                  filteredMembers.map((member) => {
                    const isSelected = selectedMembers.has(member.twitchId);
                    const result = results?.find(r => r.twitchId === member.twitchId);

                    return (
                      <div
                        key={member.twitchId}
                        className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-purple-600/20 border-purple-500/50"
                            : "bg-[#0e0e10] border-gray-700 hover:border-gray-600"
                        }`}
                        onClick={() => handleToggleSelect(member.twitchId)}
                      >
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(member.twitchId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 text-purple-600 bg-[#0e0e10] border-gray-700 rounded focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-white font-semibold">{member.displayName || member.twitchLogin}</span>
                              {!member.isActive && (
                                <span className="px-2 py-0.5 bg-red-600/20 text-red-300 text-xs rounded border border-red-500/30">
                                  Inactif
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400 mt-1">
                              <span>Twitch: </span>
                              <span className={result && result.updated ? "line-through text-gray-500" : ""}>
                                {member.twitchLogin}
                              </span>
                              {result && result.updated && result.newLogin && (
                                <>
                                  {" → "}
                                  <span className="text-green-400 font-semibold">{result.newLogin}</span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              ID Twitch: <code className="bg-[#1a1a1d] px-1 py-0.5 rounded">{member.twitchId}</code>
                              {member.discordId && (
                                <>
                                  {" • "}
                                  ID Discord: <code className="bg-[#1a1a1d] px-1 py-0.5 rounded">{member.discordId}</code>
                                </>
                              )}
                            </div>
                            {result && (
                              <div className="mt-2 flex items-center gap-2">
                                {result.updated ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-600/20 text-green-300 text-xs rounded border border-green-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Mis à jour
                                  </span>
                                ) : result.error ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600/20 text-red-300 text-xs rounded border border-red-500/30">
                                    <AlertCircle className="w-3 h-3" />
                                    {result.error}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-600/20 text-gray-300 text-xs rounded border border-gray-500/30">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Sans changement
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-700 flex-shrink-0">
          <div className="text-sm text-gray-400">
            {selectedMembers.size > 0 && (
              <span>{selectedMembers.size} membre{selectedMembers.size > 1 ? 's' : ''} sélectionné{selectedMembers.size > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={handleVerify}
              disabled={selectedMembers.size === 0 || verifying || loading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {verifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Vérification en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Vérifier les sélectionnés ({selectedMembers.size})
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

