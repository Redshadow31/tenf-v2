"use client";

import { useState, useEffect, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getDiscordUser } from "@/lib/discord";
import Link from "next/link";
import { extractDiscordIds } from "@/lib/raidUtils";

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

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/raids", label: "Suivi des Raids" },
  { href: "/admin/raids/review", label: "Vérifier les raids non reconnus", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/logs", label: "Logs" },
];

export default function RaidsReviewPage() {
  const [unmatched, setUnmatched] = useState<UnmatchedRaidMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [validating, setValidating] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<Record<string, Member[]>>({});
  const [selectedMembers, setSelectedMembers] = useState<Record<string, { raider?: Member; target?: Member }>>({});
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const searchTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

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
        setSearchResults({});
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

  // Fonction de normalisation pour la recherche
  function normalize(text: string | undefined | null): string {
    if (!text) return "";
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function searchMembers(query: string, field: 'raider' | 'target', messageId: string) {
    // Annuler la recherche précédente
    if (searchTimeouts.current[`${messageId}-${field}`]) {
      clearTimeout(searchTimeouts.current[`${messageId}-${field}`]);
    }
    
    if (query.length === 0) {
      setSearchResults(prev => ({ ...prev, [`${messageId}-${field}`]: [] }));
      return;
    }
    
    // Délai pour éviter trop de recherches
    searchTimeouts.current[`${messageId}-${field}`] = setTimeout(() => {
      const normalizedQuery = normalize(query);
      
      // Recherche locale dans allMembers
      const matches = allMembers
        .filter(member => {
          const displayName = normalize(member.displayName);
          const twitchLogin = normalize(member.twitchLogin);
          const discordUsername = normalize(member.discordUsername);
          const discordId = member.discordId || '';
          
          return displayName.includes(normalizedQuery) ||
                 twitchLogin.includes(normalizedQuery) ||
                 discordUsername.includes(normalizedQuery) ||
                 discordId.includes(query); // Discord ID sans normalisation
        })
        .slice(0, 20); // Limiter à 20 résultats
      
      setSearchResults(prev => ({ ...prev, [`${messageId}-${field}`]: matches }));
    }, 200);
  }

  function selectMember(member: Member, field: 'raider' | 'target', messageId: string) {
    setSelectedMembers(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: member,
      },
    }));
    // Fermer les résultats de recherche
    setSearchResults(prev => ({ ...prev, [`${messageId}-${field}`]: [] }));
  }

  async function validateRaid(messageId: string) {
    const selection = selectedMembers[messageId];
    
    if (!selection?.raider || !selection?.target) {
      alert("Veuillez sélectionner un raider et une cible");
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
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      alert("Erreur lors de la validation du raid");
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
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Vérifier les raids non reconnus" navLinks={navLinks} />

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
              const raiderResults = searchResults[`${message.id}-raider`] || [];
              const targetResults = searchResults[`${message.id}-target`] || [];
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
                        value={selection.raider?.displayName || selection.raider?.twitchLogin || ''}
                        onChange={(e) => {
                          const query = e.target.value;
                          if (query.length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], raider: undefined },
                            }));
                            setSearchResults(prev => ({ ...prev, [`${message.id}-raider`]: [] }));
                          } else {
                            searchMembers(query, 'raider', message.id);
                          }
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating || membersLoading || allMembers.length === 0}
                      />
                      {raiderResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {raiderResults.map((member) => (
                            <button
                              key={member.discordId}
                              type="button"
                              onClick={() => selectMember(member, 'raider', message.id)}
                              className="w-full text-left px-4 py-2 hover:bg-[#0e0e10] text-sm"
                            >
                              <div className="font-semibold text-white">{member.displayName}</div>
                              <div className="text-gray-400 text-xs">
                                {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                                {member.discordId && ` • ID: ${member.discordId}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Target */}
                    <div className="relative">
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        Cible
                      </label>
                      <input
                        type="text"
                        placeholder={membersLoading ? "Chargement des membres..." : "Rechercher un membre..."}
                        value={selection.target?.displayName || selection.target?.twitchLogin || ''}
                        onChange={(e) => {
                          const query = e.target.value;
                          if (query.length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], target: undefined },
                            }));
                            setSearchResults(prev => ({ ...prev, [`${message.id}-target`]: [] }));
                          } else {
                            searchMembers(query, 'target', message.id);
                          }
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating || membersLoading || allMembers.length === 0}
                      />
                      {targetResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {targetResults.map((member) => (
                            <button
                              key={member.discordId}
                              type="button"
                              onClick={() => selectMember(member, 'target', message.id)}
                              className="w-full text-left px-4 py-2 hover:bg-[#0e0e10] text-sm"
                            >
                              <div className="font-semibold text-white">{member.displayName}</div>
                              <div className="text-gray-400 text-xs">
                                {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                                {member.discordId && ` • ID: ${member.discordId}`}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
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
  );
}

