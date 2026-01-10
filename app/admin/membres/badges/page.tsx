"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, X, Save, Users, Tag, Trash2, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDiscordUser } from "@/lib/discord";

interface Member {
  twitchLogin: string;
  displayName: string;
  badges?: string[];
  role: string;
  isActive: boolean;
}

// Badges disponibles dans le système
const AVAILABLE_BADGES = [
  "VIP Élite",
  "Modérateur Junior",
  "Modérateur Mentor",
  "Admin Adjoint",
  "Admin Fondateurs",
  "Créateur Partenaire",
  "Streamer Vétéran",
  "Contributeur",
  "Bénévole",
  "Ambassadeur",
];

export default function GestionBadgesPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBadgeFilter, setSelectedBadgeFilter] = useState<string>("all");
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editingBadges, setEditingBadges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [showBulkAddModal, setShowBulkAddModal] = useState(false);
  const [bulkPseudoList, setBulkPseudoList] = useState("");
  const [bulkBadgeToAdd, setBulkBadgeToAdd] = useState<string>("");
  const [bulkAnalysis, setBulkAnalysis] = useState<{
    matched: Array<{ login: string; member: Member }>;
    unmatched: Array<{ original: string; suggestions: Member[] }>;
  } | null>(null);
  const [selectedUnmatched, setSelectedUnmatched] = useState<Record<string, string>>({}); // original -> twitchLogin
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

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
    loadMembers();
  }, []);

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
          badges: m.badges || [],
          role: m.role || "Affilié",
          isActive: m.isActive !== false,
        }));
        
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

    // Filtrer par badge
    if (selectedBadgeFilter !== "all") {
      if (selectedBadgeFilter === "none") {
        filtered = filtered.filter((m) => !m.badges || m.badges.length === 0);
      } else {
        filtered = filtered.filter(
          (m) => m.badges && m.badges.includes(selectedBadgeFilter)
        );
      }
    }

    // Filtrer uniquement les membres actifs
    filtered = filtered.filter((m) => m.isActive);

    return filtered;
  }, [members, searchQuery, selectedBadgeFilter]);

  function handleEditMember(member: Member) {
    setEditingMember(member);
    setEditingBadges([...(member.badges || [])]);
  }

  function toggleBadge(badge: string) {
    setEditingBadges((prev) => {
      if (prev.includes(badge)) {
        return prev.filter((b) => b !== badge);
      } else {
        return [...prev, badge];
      }
    });
  }

  function addCustomBadge(badgeName: string) {
    const trimmed = badgeName.trim();
    if (trimmed && !editingBadges.includes(trimmed) && !AVAILABLE_BADGES.includes(trimmed)) {
      setEditingBadges([...editingBadges, trimmed]);
    }
  }

  async function handleSave() {
    if (!editingMember || !currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      // Charger le membre complet depuis l'API
      const memberResponse = await fetch(`/api/admin/members?twitchLogin=${editingMember.twitchLogin}`);
      if (!memberResponse.ok) {
        throw new Error("Membre non trouvé");
      }
      
      const memberData = await memberResponse.json();
      const fullMember = memberData.member || memberData.members?.[0];
      
      if (!fullMember) {
        throw new Error("Membre non trouvé");
      }

      // Préparer les mises à jour
      const updates: any = {
        badges: editingBadges,
      };

      // Appeler l'API de mise à jour
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          twitchLogin: editingMember.twitchLogin,
          originalDiscordId: fullMember.discordId,
          originalTwitchId: fullMember.twitchId,
          ...updates,
        }),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Badges mis à jour avec succès" });
        setEditingMember(null);
        setEditingBadges([]);
        // Recharger les membres
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

  function cancelEdit() {
    setEditingMember(null);
    setEditingBadges([]);
    setMessage(null);
  }

  // Normaliser un pseudo pour la recherche (minuscules, sans caractères spéciaux)
  function normalizePseudo(pseudo: string): string {
    return pseudo.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  }

  // Trouver des suggestions pour un pseudo non reconnu
  function findSuggestions(pseudo: string): Member[] {
    const normalized = normalizePseudo(pseudo);
    const suggestions: Member[] = [];

    members.forEach((member) => {
      const memberLoginNormalized = normalizePseudo(member.twitchLogin);
      const memberDisplayNormalized = normalizePseudo(member.displayName);

      // Si le pseudo correspond exactement (normalisé) ou contient une partie
      if (
        memberLoginNormalized.includes(normalized) ||
        normalized.includes(memberLoginNormalized) ||
        memberDisplayNormalized.includes(normalized) ||
        normalized.includes(memberDisplayNormalized)
      ) {
        suggestions.push(member);
      }
    });

    return suggestions.slice(0, 5); // Limiter à 5 suggestions
  }

  // Analyser la liste de pseudos collée
  function analyzeBulkList() {
    if (!bulkPseudoList.trim() || !bulkBadgeToAdd) {
      setMessage({ type: "error", text: "Veuillez coller une liste de pseudos et sélectionner un badge" });
      return;
    }

    const lines = bulkPseudoList.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
    const matched: Array<{ login: string; member: Member }> = [];
    const unmatched: Array<{ original: string; suggestions: Member[] }> = [];

    lines.forEach((original) => {
      const normalized = normalizePseudo(original);
      let found = false;

      // Chercher une correspondance exacte ou proche
      for (const member of members) {
        if (
          normalizePseudo(member.twitchLogin) === normalized ||
          normalizePseudo(member.displayName) === normalized ||
          member.twitchLogin.toLowerCase() === original.toLowerCase() ||
          member.displayName.toLowerCase() === original.toLowerCase()
        ) {
          matched.push({ login: original, member });
          found = true;
          break;
        }
      }

      if (!found) {
        const suggestions = findSuggestions(original);
        unmatched.push({ original, suggestions });
      }
    });

    setBulkAnalysis({ matched, unmatched });
    setSelectedUnmatched({});
  }

  // Appliquer les badges en masse
  async function applyBulkBadges() {
    if (!bulkAnalysis || !currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      const membersToUpdate = [...bulkAnalysis.matched];

      // Ajouter les membres sélectionnés pour les pseudos non reconnus
      for (const [original, selectedLogin] of Object.entries(selectedUnmatched)) {
        const member = members.find((m) => m.twitchLogin === selectedLogin);
        if (member) {
          membersToUpdate.push({ login: original, member });
        }
      }

      if (membersToUpdate.length === 0) {
        setMessage({ type: "error", text: "Aucun membre à mettre à jour" });
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Mettre à jour chaque membre
      for (const { member } of membersToUpdate) {
        try {
          // Charger le membre complet
          const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
          if (!memberResponse.ok) continue;

          const memberData = await memberResponse.json();
          const fullMember = memberData.member || memberData.members?.[0];
          if (!fullMember) continue;

          // Ajouter le badge s'il n'est pas déjà présent
          const currentBadges = fullMember.badges || [];
          if (!currentBadges.includes(bulkBadgeToAdd)) {
            const updatedBadges = [...currentBadges, bulkBadgeToAdd];

            const response = await fetch("/api/admin/members", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                twitchLogin: member.twitchLogin,
                originalDiscordId: fullMember.discordId,
                originalTwitchId: fullMember.twitchId,
                badges: updatedBadges,
              }),
            });

            if (response.ok) {
              successCount++;
            } else {
              errorCount++;
            }
          } else {
            successCount++; // Déjà présent, on compte comme succès
          }
        } catch (error) {
          console.error(`Erreur pour ${member.twitchLogin}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `${successCount} badge(s) ajouté(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      // Réinitialiser et recharger
      setBulkAnalysis(null);
      setBulkPseudoList("");
      setBulkBadgeToAdd("");
      setShowBulkAddModal(false);
      await loadMembers();
    } catch (error: any) {
      console.error("Erreur lors de l'ajout en masse:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de l'ajout en masse" });
    } finally {
      setSaving(false);
    }
  }

  // Supprimer tous les badges
  async function deleteAllBadges() {
    if (!currentAdmin) return;

    try {
      setSaving(true);
      setMessage(null);

      const membersWithBadges = members.filter((m) => m.badges && m.badges.length > 0);
      let successCount = 0;
      let errorCount = 0;

      for (const member of membersWithBadges) {
        try {
          const memberResponse = await fetch(`/api/admin/members?twitchLogin=${member.twitchLogin}`);
          if (!memberResponse.ok) continue;

          const memberData = await memberResponse.json();
          const fullMember = memberData.member || memberData.members?.[0];
          if (!fullMember) continue;

          const response = await fetch("/api/admin/members", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              twitchLogin: member.twitchLogin,
              originalDiscordId: fullMember.discordId,
              originalTwitchId: fullMember.twitchId,
              badges: [],
            }),
          });

          if (response.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          console.error(`Erreur pour ${member.twitchLogin}:`, error);
          errorCount++;
        }
      }

      setMessage({
        type: successCount > 0 ? "success" : "error",
        text: `${successCount} membre(s) mis à jour${errorCount > 0 ? `, ${errorCount} erreur(s)` : ""}`,
      });

      setConfirmDeleteAll(false);
      await loadMembers();
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      setMessage({ type: "error", text: error.message || "Erreur lors de la suppression" });
    } finally {
      setSaving(false);
    }
  }

  // Statistiques
  const stats = useMemo(() => {
    const totalBadges = members.reduce((sum, m) => sum + (m.badges?.length || 0), 0);
    const membersWithBadges = members.filter((m) => m.badges && m.badges.length > 0).length;
    const badgeCounts: Record<string, number> = {};
    
    members.forEach((m) => {
      m.badges?.forEach((badge) => {
        badgeCounts[badge] = (badgeCounts[badge] || 0) + 1;
      });
    });

    return { totalBadges, membersWithBadges, badgeCounts };
  }, [members]);

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
          <Tag className="w-8 h-8 text-[#9146ff]" />
          <h1 className="text-4xl font-bold text-white">Gestion des Badges</h1>
        </div>
        <p className="text-gray-400">Gérez les badges personnalisés des membres</p>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Total Badges</p>
          <p className="text-3xl font-bold text-[#9146ff]">{stats.totalBadges}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Membres avec Badges</p>
          <p className="text-3xl font-bold text-green-400">{stats.membersWithBadges}</p>
        </div>
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
          <p className="text-sm text-gray-400 mb-2">Membres Actifs</p>
          <p className="text-3xl font-bold text-white">{members.filter((m) => m.isActive).length}</p>
        </div>
      </div>

      {/* Boutons d'action globaux */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowBulkAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Ajouter badges en masse
        </button>
        <button
          onClick={() => setConfirmDeleteAll(true)}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" />
          Supprimer tous les badges
        </button>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Filtre par badge */}
          <div>
            <select
              value={selectedBadgeFilter}
              onChange={(e) => setSelectedBadgeFilter(e.target.value)}
              className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
            >
              <option value="all">Tous les membres</option>
              <option value="none">Sans badges</option>
              {AVAILABLE_BADGES.map((badge) => (
                <option key={badge} value={badge}>
                  {badge} ({stats.badgeCounts[badge] || 0})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
                  Badges ({filteredMembers.length})
                </th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400">
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
                      <div className="flex flex-wrap gap-2">
                        {member.badges && member.badges.length > 0 ? (
                          member.badges.map((badge) => (
                            <span
                              key={badge}
                              className="px-2 py-1 rounded text-xs font-semibold bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30"
                            >
                              {badge}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500 text-xs italic">Aucun badge</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-4 py-2 rounded text-sm transition-colors"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'édition */}
      {editingMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={cancelEdit}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Modifier les badges de {editingMember.displayName}
              </h2>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Badges disponibles */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Badges disponibles
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABLE_BADGES.map((badge) => {
                  const isSelected = editingBadges.includes(badge);
                  return (
                    <button
                      key={badge}
                      onClick={() => toggleBadge(badge)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        isSelected
                          ? "bg-[#9146ff] text-white"
                          : "bg-[#0e0e10] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
                      }`}
                    >
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Badges personnalisés */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-300 mb-3">
                Badges sélectionnés
              </h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {editingBadges.length > 0 ? (
                  editingBadges.map((badge) => (
                    <span
                      key={badge}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30 text-sm font-semibold"
                    >
                      {badge}
                      <button
                        onClick={() => toggleBadge(badge)}
                        className="hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">Aucun badge sélectionné</span>
                )}
              </div>
              
              {/* Ajouter un badge personnalisé */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ajouter un badge personnalisé..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      addCustomBadge(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                  className="flex-1 bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
                />
                <button
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                    if (input) {
                      addCustomBadge(input.value);
                      input.value = "";
                    }
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation suppression tous badges */}
      {confirmDeleteAll && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => setConfirmDeleteAll(false)}
        >
          <div
            className="bg-[#1a1a1d] border border-red-600 rounded-lg p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <h2 className="text-2xl font-bold text-white">Confirmation</h2>
            </div>
            <p className="text-gray-300 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong className="text-red-400">tous les badges</strong> de tous les membres ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setConfirmDeleteAll(false)}
                disabled={saving}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={deleteAllBadges}
                disabled={saving}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-5 h-5" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ajout en masse */}
      {showBulkAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
          onClick={() => {
            if (!saving) {
              setShowBulkAddModal(false);
              setBulkAnalysis(null);
              setBulkPseudoList("");
              setBulkBadgeToAdd("");
              setSelectedUnmatched({});
            }
          }}
        >
          <div
            className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ajouter badges en masse</h2>
              <button
                onClick={() => {
                  if (!saving) {
                    setShowBulkAddModal(false);
                    setBulkAnalysis(null);
                    setBulkPseudoList("");
                    setBulkBadgeToAdd("");
                    setSelectedUnmatched({});
                  }
                }}
                disabled={saving}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {!bulkAnalysis ? (
              <>
                {/* Sélection du badge */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Badge à ajouter *
                  </label>
                  <select
                    value={bulkBadgeToAdd}
                    onChange={(e) => setBulkBadgeToAdd(e.target.value)}
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[#9146ff]"
                  >
                    <option value="">Sélectionner un badge</option>
                    {AVAILABLE_BADGES.map((badge) => (
                      <option key={badge} value={badge}>
                        {badge}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zone de texte pour coller les pseudos */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Liste des pseudos (un par ligne) *
                  </label>
                  <textarea
                    value={bulkPseudoList}
                    onChange={(e) => setBulkPseudoList(e.target.value)}
                    placeholder="aabadon&#10;alicorne&#10;batje&#10;..."
                    rows={15}
                    className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#9146ff] font-mono text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    Collez la liste de pseudos (un par ligne). Les pseudos seront analysés et validés.
                  </p>
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowBulkAddModal(false);
                      setBulkPseudoList("");
                      setBulkBadgeToAdd("");
                    }}
                    disabled={saving}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={analyzeBulkList}
                    disabled={!bulkPseudoList.trim() || !bulkBadgeToAdd || saving}
                    className="bg-[#9146ff] hover:bg-[#7c3aed] text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Search className="w-5 h-5" />
                    Analyser
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Résultats de l'analyse */}
                <div className="space-y-6">
                  {/* Membres reconnus */}
                  {bulkAnalysis.matched.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Membres reconnus ({bulkAnalysis.matched.length})
                        </h3>
                      </div>
                      <div className="bg-[#0e0e10] border border-green-700/30 rounded-lg p-4 max-h-40 overflow-y-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {bulkAnalysis.matched.map(({ login, member }) => (
                            <div key={member.twitchLogin} className="text-sm text-gray-300">
                              <span className="text-gray-400">{login}</span> →{" "}
                              <span className="text-green-400 font-semibold">{member.displayName}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pseudos non reconnus */}
                  {bulkAnalysis.unmatched.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <h3 className="text-lg font-semibold text-white">
                          Pseudos non reconnus ({bulkAnalysis.unmatched.length})
                        </h3>
                      </div>
                      <div className="bg-[#0e0e10] border border-yellow-700/30 rounded-lg p-4 space-y-4 max-h-96 overflow-y-auto">
                        {bulkAnalysis.unmatched.map(({ original, suggestions }) => (
                          <div key={original} className="border-b border-gray-700 pb-4 last:border-0">
                            <div className="font-semibold text-yellow-400 mb-2">{original}</div>
                            {suggestions.length > 0 ? (
                              <div className="space-y-2">
                                <label className="text-sm text-gray-400">
                                  Suggestions (sélectionnez un membre) :
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedUnmatched((prev) => ({
                                        ...prev,
                                        [original]: "", // Ignorer ce pseudo
                                      }));
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                      selectedUnmatched[original] === ""
                                        ? "bg-gray-600 text-white"
                                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    }`}
                                  >
                                    Ignorer
                                  </button>
                                  {suggestions.map((member) => (
                                    <button
                                      key={member.twitchLogin}
                                      onClick={() => {
                                        setSelectedUnmatched((prev) => ({
                                          ...prev,
                                          [original]: member.twitchLogin,
                                        }));
                                      }}
                                      className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                                        selectedUnmatched[original] === member.twitchLogin
                                          ? "bg-[#9146ff] text-white"
                                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                      }`}
                                    >
                                      {member.displayName} ({member.twitchLogin})
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-gray-500 italic">
                                Aucune suggestion trouvée. Ce pseudo sera ignoré.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Résumé */}
                  <div className="bg-[#0e0e10] border border-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-400">{bulkAnalysis.matched.length}</div>
                        <div className="text-xs text-gray-400">Reconnus</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">
                          {Object.values(selectedUnmatched).filter((v) => v !== "").length}
                        </div>
                        <div className="text-xs text-gray-400">Sélectionnés</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">
                          {bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length}
                        </div>
                        <div className="text-xs text-gray-400">Total à mettre à jour</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-4">
                    <button
                      onClick={() => {
                        setBulkAnalysis(null);
                        setSelectedUnmatched({});
                      }}
                      disabled={saving}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Retour
                    </button>
                    <button
                      onClick={applyBulkBadges}
                      disabled={
                        saving ||
                        bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length ===
                          0
                      }
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Traitement...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Appliquer ({bulkAnalysis.matched.length + Object.values(selectedUnmatched).filter((v) => v !== "").length})
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

