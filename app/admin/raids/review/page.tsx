"use client";

import React, { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import Link from "next/link";

interface UnmatchedRaidMessage {
  id: string;
  content: string;
  timestamp: string;
  reason: "regex_fail" | "unknown_raider" | "unknown_target";
  messageId?: string;
}

interface ParsedRaid {
  raider: string;
  target: string;
  isValid: boolean;
}

interface Member {
  discordId: string;
  displayName: string;
  twitchLogin: string;
  discordUsername?: string;
}

interface SelectedMembers {
  raider?: Member;
  target?: Member;
}

export default function RaidsReviewPage() {
  const [unmatched, setUnmatched] = useState<UnmatchedRaidMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [validating, setValidating] = useState<Set<string>>(new Set());
  const [parsedRaids, setParsedRaids] = useState<Record<string, ParsedRaid>>({});
  const [textInputs, setTextInputs] = useState<Record<string, string>>({});
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<Record<string, SelectedMembers>>({});
  const [searchQueries, setSearchQueries] = useState<Record<string, { raider: string; target: string }>>({});
  const [showResults, setShowResults] = useState<Record<string, { raider: boolean; target: boolean }>>({});

  // Regex pour détecter les raids : @Raider a raid @Cible ou @Raider à raid @Cible
  // Capture les pseudos avec espaces, Unicode, et ignore les annotations entre parenthèses
  const RAID_PATTERN = /@(.+?)\s+(?:a|à)\s+raid\s+@([^\n(]+)/giu;
  
  // Fonction pour nettoyer un pseudo en supprimant les annotations entre parenthèses
  function cleanPseudo(pseudo: string): string {
    // Supprimer le contenu entre parenthèses (y compris les parenthèses)
    return pseudo.replace(/\s*\([^)]*\)/g, '').trim();
  }

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
    
    // Charger d'abord les membres, puis les données
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
        
        // Initialiser les textareas avec le contenu original
        const initialInputs: Record<string, string> = {};
        const initialParsed: Record<string, ParsedRaid> = {};
        const initialSearches: Record<string, { raider: string; target: string }> = {};
        const initialSelections: Record<string, SelectedMembers> = {};
        
        for (const message of unmatchedData) {
          initialInputs[message.id] = message.content;
          // Essayer de parser automatiquement
          const parsed = parseRaidFromText(message.content);
          if (parsed) {
            initialParsed[message.id] = parsed;
            // Essayer de trouver automatiquement les membres
            const raiderMember = allMembers.find(m => 
              m.twitchLogin?.toLowerCase() === parsed.raider.toLowerCase() ||
              m.discordId === parsed.raider
            );
            const targetMember = allMembers.find(m => 
              m.twitchLogin?.toLowerCase() === parsed.target.toLowerCase() ||
              m.discordId === parsed.target
            );
            
            if (raiderMember) {
              initialSelections[message.id] = { ...initialSelections[message.id], raider: raiderMember };
              initialSearches[message.id] = { ...initialSearches[message.id], raider: raiderMember.displayName || raiderMember.twitchLogin };
            } else {
              initialSearches[message.id] = { ...initialSearches[message.id], raider: parsed.raider };
            }
            
            if (targetMember) {
              initialSelections[message.id] = { ...initialSelections[message.id], target: targetMember };
              initialSearches[message.id] = { ...initialSearches[message.id], target: targetMember.displayName || targetMember.twitchLogin };
            } else {
              initialSearches[message.id] = { ...initialSearches[message.id], target: parsed.target };
            }
          }
        }
        
        setTextInputs(initialInputs);
        setParsedRaids(initialParsed);
        setSearchQueries(initialSearches);
        setSelectedMembers(initialSelections);
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
    loadData(newMonth);
  }

  function parseRaidFromText(text: string): ParsedRaid | null {
    if (!text || !text.trim()) return null;
    
    // Réinitialiser lastIndex pour éviter les problèmes avec exec en boucle
    RAID_PATTERN.lastIndex = 0;
    const match = RAID_PATTERN.exec(text.trim());
    
    if (match) {
      // Nettoyer les pseudos capturés en supprimant les annotations entre parenthèses
      const raider = cleanPseudo(match[1].trim());
      const target = cleanPseudo(match[2].trim());
      
      if (raider && target && raider.length > 0 && target.length > 0 && raider.toLowerCase() !== target.toLowerCase()) {
        return {
          raider,
          target,
          isValid: true,
        };
      }
    }
    
    return null;
  }

  function handleTextChange(messageId: string, text: string) {
    // Mettre à jour le texte
    setTextInputs(prev => ({
      ...prev,
      [messageId]: text,
    }));
    
    // Parser le texte
    const parsed = parseRaidFromText(text);
    if (parsed) {
      setParsedRaids(prev => ({
        ...prev,
        [messageId]: parsed,
      }));
      
      // Essayer de trouver automatiquement les membres
      const raiderMember = allMembers.find(m => 
        m.twitchLogin?.toLowerCase() === parsed.raider.toLowerCase() ||
        m.discordId === parsed.raider
      );
      const targetMember = allMembers.find(m => 
        m.twitchLogin?.toLowerCase() === parsed.target.toLowerCase() ||
        m.discordId === parsed.target
      );
      
      setSelectedMembers(prev => ({
        ...prev,
        [messageId]: {
          raider: raiderMember,
          target: targetMember,
        },
      }));
      
      setSearchQueries(prev => ({
        ...prev,
        [messageId]: {
          raider: raiderMember ? (raiderMember.displayName || raiderMember.twitchLogin) : parsed.raider,
          target: targetMember ? (targetMember.displayName || targetMember.twitchLogin) : parsed.target,
        },
      }));
    } else {
      // Supprimer le parsing si invalide
      setParsedRaids(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }
  }

  // Fonction de normalisation pour la recherche
  function normalize(text: string | undefined | null): string {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Fonction de filtrage des membres
  function filterMembers(query: string): Member[] {
    if (!query || query.trim().length === 0) {
      return [];
    }
    
    const normalizedQuery = normalize(query);
    
    return allMembers.filter((member) => {
      const normalizedDisplayName = normalize(member.displayName);
      const normalizedTwitchLogin = normalize(member.twitchLogin);
      const normalizedDiscordUsername = normalize(member.discordUsername);
      const discordId = member.discordId || "";
      
      return (
        normalizedDisplayName.includes(normalizedQuery) ||
        normalizedTwitchLogin.includes(normalizedQuery) ||
        normalizedDiscordUsername.includes(normalizedQuery) ||
        (discordId && discordId.toLowerCase().includes(query.toLowerCase()))
      );
    });
  }

  function selectMember(member: Member, field: 'raider' | 'target', messageId: string) {
    setSelectedMembers(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: member,
      },
    }));
    
    setSearchQueries(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: member.displayName || member.twitchLogin || '',
      },
    }));
    
    setShowResults(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: false,
      },
    }));
  }

  function clearMember(field: 'raider' | 'target', messageId: string) {
    setSelectedMembers(prev => ({
      ...prev,
      [messageId]: {
        ...prev[messageId],
        [field]: undefined,
      },
    }));
    
    const parsed = parsedRaids[messageId];
    if (parsed) {
      setSearchQueries(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          [field]: field === 'raider' ? parsed.raider : parsed.target,
        },
      }));
    }
  }

  async function validateRaid(messageId: string) {
    const parsed = parsedRaids[messageId];
    const selection = selectedMembers[messageId];
    
    if (!parsed || !parsed.isValid) {
      alert("Veuillez coller un message de raid au format : @Raider a raid @Cible");
      return;
    }
    
    if (!selection?.raider || !selection?.target) {
      alert("Veuillez sélectionner un raider et une cible depuis la liste des membres");
      return;
    }
    
    if (!selection.raider.discordId || !selection.target.discordId) {
      alert("Erreur: Le raider ou la cible n'a pas d'ID Discord. Veuillez sélectionner des membres valides.");
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
        alert(`✅ Raid validé : ${data.raider.displayName} → ${data.target.displayName}`);
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
        alert(`❌ Erreur: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error);
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      alert(`❌ Erreur lors de la validation du raid: ${errorMessage}`);
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

  function renderMemberSelector(field: 'raider' | 'target', messageId: string, parsed: ParsedRaid | null, isValidating: boolean) {
    const selection = selectedMembers[messageId];
    const searchQuery = searchQueries[messageId]?.[field] || '';
    const showResult = showResults[messageId]?.[field] || false;
    const selectedMember = selection?.[field];
    const fieldLabel = field === 'raider' ? 'Raider' : 'Cible';
    const placeholder = parsed ? (field === 'raider' ? parsed.raider : parsed.target) : `Rechercher un membre...`;
    
    return (
      <div className="relative">
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {fieldLabel}
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => {
                const query = e.target.value;
                setSearchQueries(prev => ({
                  ...prev,
                  [messageId]: {
                    ...prev[messageId],
                    [field]: query,
                  },
                }));
                
                if (query.trim().length > 0) {
                  setShowResults(prev => ({
                    ...prev,
                    [messageId]: {
                      ...prev[messageId],
                      [field]: true,
                    },
                  }));
                } else {
                  clearMember(field, messageId);
                }
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowResults(prev => ({
                    ...prev,
                    [messageId]: {
                      ...prev[messageId],
                      [field]: true,
                    },
                  }));
                }
              }}
              onBlur={() => {
                setTimeout(() => {
                  setShowResults(prev => ({
                    ...prev,
                    [messageId]: {
                      ...prev[messageId],
                      [field]: false,
                    },
                  }));
                }, 200);
              }}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
              disabled={isValidating || membersLoading || !parsed}
            />
            {showResult && (() => {
              const results = filterMembers(searchQuery);
              return results.length > 0 ? (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {results.map((member) => (
                    <button
                      key={member.discordId}
                      type="button"
                      onClick={() => selectMember(member, field, messageId)}
                      className="w-full text-left px-4 py-2 hover:bg-[#0e0e10] text-sm transition-colors"
                    >
                      <div className="font-semibold text-white">{member.displayName}</div>
                      <div className="text-gray-400 text-xs">
                        {member.twitchLogin} {member.discordUsername && `• ${member.discordUsername}`}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchQuery.trim().length > 0 ? (
                <div className="absolute z-10 w-full mt-1 bg-[#1a1a1d] border border-gray-700 rounded-lg shadow-lg p-4">
                  <div className="text-gray-400 text-sm text-center">Aucun membre trouvé</div>
                </div>
              ) : null;
            })()}
          </div>
          {selectedMember && (
            <button
              onClick={() => clearMember(field, messageId)}
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-2 rounded-lg text-sm transition-colors"
              title="Supprimer la sélection"
            >
              ✕
            </button>
          )}
        </div>
        {selectedMember && (
          <div className="mt-2 text-xs text-green-400">
            ✅ Sélectionné : {selectedMember.displayName} ({selectedMember.twitchLogin})
          </div>
        )}
      </div>
    );
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

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-300 mb-2">
            <strong>💡 Comment corriger un raid non reconnu :</strong>
          </p>
          <ol className="text-xs text-blue-400 list-decimal list-inside space-y-1">
            <li>Collez le message de raid dans le champ texte ci-dessous</li>
            <li>Le format attendu est : <code className="bg-blue-900/50 px-1 rounded">@Raider a raid @Cible</code></li>
            <li>Le système détectera automatiquement le raider et la cible</li>
            <li>Recherchez et sélectionnez les membres correspondants dans les listes</li>
            <li>Si un membre n'est pas trouvé, vous pouvez le supprimer (bouton ✕) ou laisser vide</li>
            <li>Cliquez sur "✅ Valider le raid" pour enregistrer</li>
          </ol>
        </div>

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
              const parsed = parsedRaids[message.id];
              const isValidating = validating.has(message.id);
              const textValue = textInputs[message.id] || message.content;
              const selection = selectedMembers[message.id];
              
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
                    </div>
                  </div>

                  {/* Champ de texte pour copier-coller */}
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      Message de raid (copier-coller ici) :
                    </label>
                    <textarea
                      value={textValue}
                      onChange={(e) => handleTextChange(message.id, e.target.value)}
                      placeholder="@membre1 a raid @membre2"
                      className="w-full h-24 bg-[#0e0e10] border border-gray-700 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-[#9146ff] resize-none"
                      disabled={isValidating}
                    />
                  </div>

                  {/* Aperçu du parsing */}
                  {parsed && parsed.isValid ? (
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-green-300 mb-3">
                        ✅ Raid détecté :
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderMemberSelector('raider', message.id, parsed, isValidating)}
                        {renderMemberSelector('target', message.id, parsed, isValidating)}
                      </div>
                    </div>
                  ) : textValue.trim() ? (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                      <p className="text-sm text-red-300">
                        ❌ Format non reconnu. Format attendu : <code className="bg-red-900/50 px-1 rounded">@Raider a raid @Cible</code>
                      </p>
                    </div>
                  ) : null}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => validateRaid(message.id)}
                      disabled={!parsed || !parsed.isValid || !selection?.raider || !selection?.target || isValidating}
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
    </>
  );
}
