"use client";

import { useState, useEffect, useRef } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import { getDiscordUser } from "@/lib/discord";
import Link from "next/link";

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
  const searchTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
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
    
    loadData(currentMonthStr);
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
        setUnmatched(data.unmatched || []);
        // Réinitialiser les sélections
        setSelectedMembers({});
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
    loadData(newMonth);
  }

  async function searchMembers(query: string, field: 'raider' | 'target', messageId: string) {
    // Annuler la recherche précédente
    if (searchTimeouts.current[`${messageId}-${field}`]) {
      clearTimeout(searchTimeouts.current[`${messageId}-${field}`]);
    }
    
    if (query.length < 2) {
      setSearchResults(prev => ({ ...prev, [`${messageId}-${field}`]: [] }));
      return;
    }
    
    // Délai pour éviter trop de requêtes
    searchTimeouts.current[`${messageId}-${field}`] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/members/search?q=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          setSearchResults(prev => ({ ...prev, [`${messageId}-${field}`]: data.members || [] }));
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error);
      }
    }, 300);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des messages non reconnus...</p>
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
                        placeholder="Rechercher un membre..."
                        value={selection.raider?.displayName || selection.raider?.twitchLogin || ''}
                        onChange={(e) => {
                          const query = e.target.value;
                          if (query.length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], raider: undefined },
                            }));
                          }
                          searchMembers(query, 'raider', message.id);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating}
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
                        placeholder="Rechercher un membre..."
                        value={selection.target?.displayName || selection.target?.twitchLogin || ''}
                        onChange={(e) => {
                          const query = e.target.value;
                          if (query.length === 0) {
                            setSelectedMembers(prev => ({
                              ...prev,
                              [message.id]: { ...prev[message.id], target: undefined },
                            }));
                          }
                          searchMembers(query, 'target', message.id);
                        }}
                        className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-[#9146ff]"
                        disabled={isValidating}
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

