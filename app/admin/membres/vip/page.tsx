"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Crown, Calendar, Plus, X, Save, Users, Star } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";

interface Member {
  twitchLogin: string;
  displayName: string;
  isVip: boolean;
  role: string;
  isActive: boolean;
  vipBadge?: string;
  consecutiveMonths?: number;
}

interface VipHistoryEntry {
  login: string;
  month: string;
}

export default function GestionVipPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [vipFilter, setVipFilter] = useState<"all" | "vip" | "non-vip">("all");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [vipHistory, setVipHistory] = useState<Record<string, string[]>>({});
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showMonthManager, setShowMonthManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          
          if (!roleData.hasAdminAccess) {
            window.location.href = "/unauthorized";
            return;
          }
          
          setCurrentAdmin({ id: user.id, username: user.username });
        } catch (error) {
          console.error("Erreur lors du chargement de l'admin:", error);
        }
      }
    }
    loadAdmin();
    
    // Initialiser avec le mois actuel
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${year}-${month}`);
    
    loadMembers();
    loadVipHistory();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadVipHistory();
    }
  }, [selectedMonth]);

  async function loadMembers() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/members", {
        cache: "no-store",
      });
      
      if (response.ok) {
        const data = await response.json();
        const membersList = (data.members || []).map((m: any) => ({
          twitchLogin: m.twitchLogin || "",
          displayName: m.displayName || m.nom || m.twitchLogin || "",
          isVip: m.isVip || false,
          role: m.role || "Affilié",
          isActive: m.isActive !== false,
        }));
        
        // Charger les badges VIP depuis l'API
        for (const member of membersList) {
          try {
            const vipResponse = await fetch(`/api/vip-history?action=badge&login=${member.twitchLogin}`);
            if (vipResponse.ok) {
              const vipData = await vipResponse.json();
              member.vipBadge = vipData.badge || "";
              member.consecutiveMonths = vipData.months || 0;
            }
          } catch (error) {
            console.error(`Erreur lors du chargement du badge VIP pour ${member.twitchLogin}:`, error);
          }
        }
        
        // Trier par nom d'affichage
        membersList.sort((a: Member, b: Member) => 
          a.displayName.localeCompare(b.displayName, 'fr', { sensitivity: 'base' })
        );
        
        setMembers(membersList);
      } else {
        setMessage({ type: "error", text: "Erreur lors du chargement des membres" });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setMessage({ type: "error", text: "Erreur lors du chargement des membres" });
    } finally {
      setLoading(false);
    }
  }

  async function loadVipHistory() {
    try {
      const response = await fetch("/api/vip-history?action=by-month");
      if (response.ok) {
        const data = await response.json();
        setVipHistory(data.byMonth || {});
      }
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique VIP:", error);
    }
  }

  const filteredMembers = useMemo(() => {
    let filtered = members;

    // Filtrer par recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.displayName.toLowerCase().includes(query) ||
          m.twitchLogin.toLowerCase().includes(query)
      );
    }

    // Filtrer par statut VIP
    if (vipFilter === "vip") {
      filtered = filtered.filter((m) => m.isVip);
    } else if (vipFilter === "non-vip") {
      filtered = filtered.filter((m) => !m.isVip);
    }

    // Filtrer uniquement les membres actifs
    filtered = filtered.filter((m) => m.isActive);

    return filtered;
  }, [members, searchQuery, vipFilter]);

  async function toggleVipStatus(member: Member) {
    if (!currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      // Charger le membre complet depuis l'API
      const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
      if (!memberResponse.ok) {
        throw new Error("Membre non trouvé");
      }
      
      const memberData = await memberResponse.json();
      const fullMember = memberData.member || memberData.members?.[0];
      
      if (!fullMember) {
        throw new Error("Membre non trouvé");
      }

      const newVipStatus = !member.isVip;

      // Appeler l'API de mise à jour
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitchLogin: member.twitchLogin,
          originalDiscordId: fullMember.discordId,
          originalTwitchId: fullMember.twitchId,
          isVip: newVipStatus,
        }),
      });

      if (response.ok) {
        // Si on active le VIP, ajouter au mois actuel
        if (newVipStatus && selectedMonth) {
          await addVipToMonth(member.twitchLogin, selectedMonth);
        }
        
        setMessage({ 
          type: "success", 
          text: `Statut VIP ${newVipStatus ? "activé" : "désactivé"} avec succès` 
        });
        await loadMembers();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }
    } catch (error: any) {
      console.error("Erreur lors de la sauvegarde:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la sauvegarde" });
    } finally {
      setSaving(false);
    }
  }

  async function addVipToMonth(twitchLogin: string, month: string) {
    try {
      const response = await fetch("/api/vip-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: twitchLogin,
          month: month,
        }),
      });

      if (response.ok) {
        await loadVipHistory();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout VIP au mois:", error);
    }
  }

  async function removeVipFromMonth(twitchLogin: string, month: string) {
    try {
      const response = await fetch("/api/vip-history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login: twitchLogin,
          month: month,
        }),
      });

      if (response.ok) {
        await loadVipHistory();
        await loadMembers(); // Recharger pour mettre à jour les badges
      }
    } catch (error) {
      console.error("Erreur lors de la suppression VIP du mois:", error);
    }
  }

  function getMonthOptions(): string[] {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      options.push(`${year}-${month}`);
    }
    return options;
  }

  function formatMonthKey(key: string): string {
    const [year, month] = key.split('-');
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }

  // Statistiques
  const stats = useMemo(() => {
    const vipCount = members.filter((m) => m.isVip && m.isActive).length;
    const currentMonthVips = selectedMonth ? (vipHistory[selectedMonth] || []).length : 0;
    return { vipCount, currentMonthVips, totalActive: members.filter((m) => m.isActive).length };
  }, [members, selectedMonth, vipHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white p-8">
      <div className="mb-8">
        <Link
          href="/admin/membres"
          className="text-gray-400 hover:text-white transition-colors mb-4 inline-block"
        >
          ← Retour à Membres
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-yellow-400" />
          <h1 className="text-4xl font-bold text-white">Gestion des VIP</h1>
        </div>
        <p className="text-gray-400">Gérez le statut VIP des membres et l'historique mensuel</p>
      </div>

      {/* Message de succès/erreur */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-900/30 border-green-600 text-green-300"
              : "bg-red-900/30 border-red-600 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">VIP Actifs</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.vipCount}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">VIP {selectedMonth ? formatMonthKey(selectedMonth) : "Ce mois"}</p>
          <p className="text-3xl font-bold text-yellow-400">{stats.currentMonthVips}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Membres Actifs</p>
          <p className="text-3xl font-bold text-white">{stats.totalActive}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Taux VIP</p>
          <p className="text-3xl font-bold text-green-400">
            {stats.totalActive > 0 ? Math.round((stats.vipCount / stats.totalActive) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Filtres et sélection de mois */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
            />
          </div>

          {/* Filtre VIP */}
          <div>
            <select
              value={vipFilter}
              onChange={(e) => setVipFilter(e.target.value as "all" | "vip" | "non-vip")}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              <option value="all">Tous les membres</option>
              <option value="vip">VIP uniquement</option>
              <option value="non-vip">Non-VIP uniquement</option>
            </select>
          </div>

          {/* Sélection de mois */}
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              {getMonthOptions().map((option) => (
                <option key={option} value={option}>
                  {formatMonthKey(option)}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowMonthManager(!showMonthManager)}
              className="bg-[#9146ff] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Gérer
            </button>
          </div>
        </div>
      </div>

      {/* Gestion du mois sélectionné */}
      {showMonthManager && selectedMonth && (
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              VIP du mois : {formatMonthKey(selectedMonth)}
            </h3>
            <button
              onClick={() => setShowMonthManager(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {vipHistory[selectedMonth] && vipHistory[selectedMonth].length > 0 ? (
              vipHistory[selectedMonth].map((login) => {
                const member = members.find((m) => m.twitchLogin.toLowerCase() === login.toLowerCase());
                return (
                  <div
                    key={login}
                    className="flex items-center justify-between bg-[#0e0e10] border border-gray-700 rounded-lg p-3"
                  >
                    <div>
                      <span className="font-semibold text-white">
                        {member?.displayName || login}
                      </span>
                      {member && (
                        <span className="text-gray-500 text-sm ml-2">({member.twitchLogin})</span>
                      )}
                    </div>
                    <button
                      onClick={() => removeVipFromMonth(login, selectedMonth)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Retirer
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-center py-4">
                Aucun VIP pour ce mois
              </p>
            )}
          </div>
        </div>
      )}

      {/* Liste des membres */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800/50">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Membre
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Rôle
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Statut VIP
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Badge VIP
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    Aucun membre trouvé
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr
                    key={member.twitchLogin}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-semibold text-white">{member.displayName}</div>
                        <div className="text-gray-500 text-xs">{member.twitchLogin}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-700 text-gray-300">
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {member.isVip ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-900/30 text-yellow-300 border border-yellow-600/30 text-sm font-semibold">
                          <Star className="w-4 h-4" />
                          VIP
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">Non-VIP</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {member.vipBadge ? (
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-400 text-white text-sm font-bold">
                          {member.vipBadge}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm italic">-</span>
                      )}
                      {member.consecutiveMonths && member.consecutiveMonths > 1 && (
                        <span className="text-gray-500 text-xs ml-2">
                          ({member.consecutiveMonths} mois)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => toggleVipStatus(member)}
                        disabled={saving}
                        className={`font-semibold px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          member.isVip
                            ? "bg-red-600 hover:bg-red-700 text-white"
                            : "bg-green-600 hover:bg-green-700 text-white"
                        }`}
                      >
                        {member.isVip ? "Retirer VIP" : "Activer VIP"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

