"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import Link from "next/link";
import { extractDiscordIds } from "@/lib/raidUtilsClient";

interface UnmatchedRaidMessage {
  id: string;
  content: string;
  timestamp: string;
  reason: "regex_fail" | "unknown_raider" | "unknown_target";
  messageId?: string;
}

interface Member {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  discordUsername?: string;
}

export default function RaidsReviewPage() {
  const [unmatched, setUnmatched] = useState<UnmatchedRaidMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [validating, setValidating] = useState<Set<string>>(new Set());
  const [selectedMembers, setSelectedMembers] = useState<Record<string, { raider?: Member; target?: Member }>>({});
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  // États de recherche séparés pour chaque champ (messageId-field)
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Charger la liste complète des membres
    async function loadAllMembers() {
      try {
        setMembersLoading(true);
        const response = await fetch("/api/admin/members", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const members = (data.members || []).map((m: any) => ({
            discordId: m.discordId || '',
            displayName: m.displayName || m.twitchLogin || '',
            twitchLogin: m.twitchLogin || '',
            discordUsername: m.discordUsername || m.discordName || '',
          }));
          setAllMembers(members);
        } else {
          console.error("[Raids Review] Erreur lors du chargement des membres:", await response.text());
          // Fallback: essayer l'API publique
          try {
            const publicResponse = await fetch("/api/members/public", {
              cache: 'no-store',
            });
            if (publicResponse.ok) {
              const publicData = await publicResponse.json();
              const members = (publicData.members || []).map((m: any) => ({
                discordId: m.discordId || '',
                displayName: m.displayName || m.twitchLogin || '',
                twitchLogin: m.twitchLogin || '',
                discordUsername: m.discordUsername || '',
              }));
              setAllMembers(members);
            }
          } catch (err) {
            console.error("[Raids Review] Erreur fallback membres:", err);
          }
        }
      } catch (error) {
        console.error("[Raids Review] Erreur lors du chargement des membres:", error);
      } finally {
        setMembersLoading(false);
      }
    }
    
    // Initialiser avec le mois en cours
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonthStr = `${year}-${month}`;
    setSelectedMonth(currentMonthStr);
    
    // Générer la liste des mois disponibles (12 derniers mois)
    const months: string[] = [];
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      months.push(`${y}-${m}`);
    }
    setAvailableMonths(months);
    
    // Charger d'abord les membres, puis les données (pour le pré-remplissage)
    loadAllMembers().then(() => {
      loadData(currentMonthStr);
    });
  }, []);

  async function loadData(month?: string) {
    try {
      setLoading(true);
      const monthToLoad = month || selectedMonth;
      
      const response = await fetch(`/api/discord/raids/unmatched?month=${monthToLoad}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const unmatchedData = data.unmatched || [];
        setUnmatched(unmatchedData);
        
        // Pré-remplir automatiquement les champs si des IDs Discord sont trouvés
        // ATTENTION: Cette fonction doit être appelée APRÈS le chargement des membres
        const autoSelections: Record<string, { raider?: Member; target?: Member }> = {};
        
        if (allMembers.length > 0) {
          for (const message of unmatchedData) {
            const discordIds = extractDiscordIds(message.content);
            
            if (discordIds.length >= 2) {
              // Trouver les membres correspondants
              const raiderId = discordIds[0];
              const targetId = discordIds[1];
              
              const raider = allMembers.find(m => m.discordId === raiderId);
              const target = allMembers.find(m => m.discordId === targetId);
              
              if (raider && target) {
                autoSelections[message.id] = { raider, target };
                console.log(`[Raids Review] Pré-remplissage automatique pour ${message.id}: ${raider.displayName} → ${target.displayName}`);
              }
            } else if (discordIds.length === 1) {
              // Un seul ID trouvé, essayer de le placer comme raider
              const raider = allMembers.find(m => m.discordId === discordIds[0]);
              if (raider) {
                autoSelections[message.id] = { raider };
                console.log(`[Raids Review] Pré-remplissage partiel (raider) pour ${message.id}: ${raider.displayName}`);
              }
            }
          }
        }
        
        setSelectedMembers(autoSelections);
        // Initialiser les searchQueries pour les membres pré-remplis
        const initialQueries: Record<string, string> = {};
        for (const [msgId, selection] of Object.entries(autoSelections)) {
          if (selection.raider) {
            initialQueries[`${msgId}-raider`] = selection.raider.displayName || selection.raider.twitchLogin || '';
          }
          if (selection.target) {
            initialQueries[`${msgId}-target`] = selection.target.displayName || selection.target.twitchLogin || '';
          }
        }
        setSearchQueries(initialQueries);
      } else {
        const error = await response.json();
        console.error("[Raids Review] Erreur API:", error);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  }
  
  function handleMonthChange(newMonth: string) {
    setSelectedMonth(newMonth);
    // Recharger les données avec le nouveau mois
    loadData(newMonth);
  }

  // Fonction de normalisation pour la recherche (identique à /admin/membres)
  function normalize(text: string | undefined | null): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD") // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
      .replace(/\s+/g, " ") // Remplace les espaces multiples par un seul
      .trim(); // Supprime les espaces en début/fin
  }

  // Fonction de filtrage des membres (identique à /admin/membres)
  function filterMembers(query: string): Member[] {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const normalizedQuery = normalize(query);
    
    return allMembers.filter((member) => {
      // Recherche dans tous les champs avec normalisation
      const normalizedDisplayName = normalize(member.displayName);
      const normalizedTwitchLogin = normalize(member.twitchLogin);
      const normalizedDiscordUsername = normalize(member.discordUsername);
      const discordId = member.discordId || "";
      
      // Correspondance partielle insensible à la casse et aux accents
      return (
        normalizedDisplayName.includes(normalizedQuery) ||
        normalizedTwitchLogin.includes(normalizedQuery) ||
        normalizedDiscordUsername.includes(normalizedQuery) ||
        // Recherche exacte sur l'ID Discord (sans normalisation pour garder la précision)
        (discordId && discordId.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }

  function selectMember(member: Member, field: 'raider' | 'target', messageId: string) {
    const fieldKey = `${messageId}-${field}`;
    
    // Mettre à jour le membre sélectionné
    setSelectedMembers(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: member,
      },
    }));
    
    // Mettre à jour la valeur de recherche avec le nom du membre sélectionné
    setSearchQueries(prev => ({
      ...prev,
      [fieldKey]: member.displayName || member.twitchLogin || '',
    }));
    
    // Fermer les résultats de recherche
    setShowResults(prev => ({ ...prev, [fieldKey]: false }));
  }

  async function validateRaid(messageId: string) {
    const selection = selectedMembers[messageId];
    
    if (!selection?.raider || !selection?.target) {
      alert("Veuillez sélectionner un raider et une cible");
      return;
    }
    
    if (!selection.raider.discordId || !selection.target.discordId) {
      alert("Erreur: Le raider ou la cible n'a pas d'ID Discord. Veuillez sélectionner des membres valides.");
      console.error("Membres sélectionnés sans Discord ID:", {
        raider: selection.raider,
        target: selection.target,
      });
      return;
    }
    
    if (selection.raider.discordId === selection.target.discordId) {
      alert("Le raider et la cible ne peuvent pas être la même personne");
      return;
    }
    
    setValidating(prev => new Set(prev).add(messageId));
    
    try {
      const response = await fetch("/api/discord/raids/unmatched", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          raiderDiscordId: selection.raider.discordId,
          targetDiscordId: selection.target.discordId,
          month: selectedMonth,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`Raid validé : ${data.raider.displayName} → ${data.target.displayName}`);
        // Recharger les données
        await loadData(selectedMonth);
      } else {
        let errorMessage = "Erreur inconnue";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || JSON.stringify(error);
        } catch (e) {
          const text = await response.text();
          errorMessage = text || `Erreur HTTP ${response.status}`;
        }
        console.error("[Raids Review] Erreur de validation:", {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          requestBody: {
            messageId,
            raiderDiscordId: selection.raider.discordId,
            targetDiscordId: selection.target.discordId,
            month: selectedMonth,
          },
        });
        alert(`Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`Erreur lors de la validation du raid: ${errorMessage}`);
    } finally {
      setValidating(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  }

  async function deleteUnmatched(messageId: string) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce message non reconnu ?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/discord/raids/unmatched?messageId=${messageId}&month=${selectedMonth}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await loadData(selectedMonth);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert("Erreur lors de la suppression");
    }
  }

  function getReasonLabel(reason: string): string {
    switch (reason) {
      case "regex_fail":
        return "Format non reconnu";
      case "unknown_raider":
        return "Raider inconnu";
      case "unknown_target":
        return "Cible inconnue";
      default:
        return reason;
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

  if (loading || membersLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">
            {membersLoading ? "Chargement des membres..." : "Chargement des messages non reconnus..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="text-white">
      <h1 className="text-4xl font-bold text-white mb-8">Vérifier les raids non reconnus</h1>

      {/* En-tête avec sélecteur de mois */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              Messages non reconnus
            </h2>
            <div className="flex items-center gap-4">
              <label className="text-gray-400 text-sm">
                Mois :
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
              >
                {availableMonths.map((month) => {
                  const [year, monthNum] = month.split('-');
                  const monthNames = [
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                  ];
                  const monthName = monthNames[parseInt(monthNum) - 1];
                  return (
                    <option key={month} value={month}>
                      {monthName} {year}
                    </option>
                  );
                })}
              </select>
              <Link
                href={`/admin/raids?month=${selectedMonth}`}
                className="text-[#9146ff] hover:text-[#5a32b4] text-sm"
              >
                ← Retour aux raids
              </Link>
            </div>
          </div>
        </div>

        {/* Avertissement si les membres ne sont pas chargés */}
        {!membersLoading && allMembers.length === 0 && (
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4 mb-4">
            <p className="text-yellow-300 text-sm">
              ⚠️ Impossible de charger la liste des membres. Les champs d'autocomplétion ne fonctionneront pas.
            </p>
          </div>
        )}

        {/* Liste des messages non reconnus */}
        {unmatched.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">
              ✅ Aucun message non reconnu pour ce mois
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {unmatched.map((message) => {
              const selection = selectedMembers[message.id] || {};
              const isValidating = validating.has(message.id);
              
              return (
                <div
                  key={message.id}
                  className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
                >
                  {/* En-tête du message */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-900/30 text-yellow-300">
                          {getReasonLabel(message.reason)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          {formatDate(message.timestamp)}
                        </span>
                      </div>
                      <div className="bg-[#0e0e10] border border-gray-800 rounded p-3 text-sm text-gray-300 font-mono">
                        {message.content}
                      </div>
                    </div>
                  </div>

                  {/* Champs de sélection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Raider */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Raider
                      </label>
                      <input
                        type="text"
                        placeholder={membersLoading ? "Chargement des membres..." : "Rechercher un membre..."}
                        value={searchQueries[`${message.id}-raider`] || ''}
                        onChange={(e) => {
                          const fieldKey = `${message.id}-raider`;
                          const query = e.target.value;
                          
                          // Mettre à jour la valeur de recherche
                          setSearchQueries(prev => ({ ...prev, [fieldKey]: query }));
                          
                          // Afficher les résultats si la requête n'est pas vide
                          setShowResults(prev => ({ ...prev, [fieldKey]: query.trim().length > 0 }));
                          
                          // Si la requête est vide, réinitialiser la sélection
                          if (query.trim().length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], raider: undefined },
                            }));
                          }
                        }}
                        onFocus={() => {
                          const fieldKey = `${message.id}-raider`;
                          const query = searchQueries[fieldKey] || '';
                          if (query.trim().length > 0) {
                            setShowResults(prev => ({ ...prev, [fieldKey]: true }));
                          }
                        }}
                        onBlur={() => {
                          // Délai pour permettre le clic sur un résultat
                          setTimeout(() => {
                            setShowResults(prev => ({ ...prev, [`${message.id}-raider`]: false }));
                          }, 200);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating || membersLoading || allMembers.length === 0}
                      />
                      {showResults[`${message.id}-raider`] && (() => {
                        const query = searchQueries[`${message.id}-raider`] || '';
                        const results = filterMembers(query);
                        return results.length > 0 ? (
                          <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {results.map((member) => (
                              <button
                                key={member.discordId}
                                type="button"
                                onClick={() => selectMember(member, 'raider', message.id)}
                                className="w-full text-left px-4 py-2 hover:bg-[#0e0e10] text-sm transition-colors"
                              >
                                <div className="font-semibold text-white">{member.displayName}</div>
                                <div className="text-gray-400 text-xs">
                                  {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                                  {member.discordId && ` • ID: ${member.discordId}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : query.trim().length > 0 ? (
                          <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg p-4">
                            <div className="text-gray-400 text-sm text-center">Aucun membre trouvé</div>
                          </div>
                        ) : null;
                      })()}
                    </div>

                    {/* Target */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Cible
                      </label>
                      <input
                        type="text"
                        placeholder={membersLoading ? "Chargement des membres..." : "Rechercher un membre..."}
                        value={searchQueries[`${message.id}-target`] || ''}
                        onChange={(e) => {
                          const fieldKey = `${message.id}-target`;
                          const query = e.target.value;
                          
                          // Mettre à jour la valeur de recherche
                          setSearchQueries(prev => ({ ...prev, [fieldKey]: query }));
                          
                          // Afficher les résultats si la requête n'est pas vide
                          setShowResults(prev => ({ ...prev, [fieldKey]: query.trim().length > 0 }));
                          
                          // Si la requête est vide, réinitialiser la sélection
                          if (query.trim().length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], target: undefined },
                            }));
                          }
                        }}
                        onFocus={() => {
                          const fieldKey = `${message.id}-target`;
                          const query = searchQueries[fieldKey] || '';
                          if (query.trim().length > 0) {
                            setShowResults(prev => ({ ...prev, [fieldKey]: true }));
                          }
                        }}
                        onBlur={() => {
                          // Délai pour permettre le clic sur un résultat
                          setTimeout(() => {
                            setShowResults(prev => ({ ...prev, [`${message.id}-target`]: false }));
                          }, 200);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating || membersLoading || allMembers.length === 0}
                      />
                      {showResults[`${message.id}-target`] && (() => {
                        const query = searchQueries[`${message.id}-target`] || '';
                        const results = filterMembers(query);
                        return results.length > 0 ? (
                          <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {results.map((member) => (
                              <button
                                key={member.discordId}
                                type="button"
                                onClick={() => selectMember(member, 'target', message.id)}
                                className="w-full text-left px-4 py-2 hover:bg-[#0e0e10] text-sm transition-colors"
                              >
                                <div className="font-semibold text-white">{member.displayName}</div>
                                <div className="text-gray-400 text-xs">
                                  {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                                  {member.discordId && ` • ID: ${member.discordId}`}
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : query.trim().length > 0 ? (
                          <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg p-4">
                            <div className="text-gray-400 text-sm text-center">Aucun membre trouvé</div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => validateRaid(message.id)}
                      disabled={!selection.raider || !selection.target || isValidating}
                      className="bg-[#9146ff] hover:bg-[#5a32b4] disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      {isValidating ? "Validation..." : "✅ Valider le raid"}
                    </button>
                    <button
                      onClick={() => deleteUnmatched(message.id)}
                      disabled={isValidating}
                      className="bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-700 disabled:cursor-not-allowed text-red-300 font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

