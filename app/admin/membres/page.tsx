"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import MemberBadges from "@/components/admin/MemberBadges";
import { logAction } from "@/lib/logAction";
import { getDiscordUser } from "@/lib/discord";
import { canPerformAction, isFounder } from "@/lib/admin";

type MemberRole = "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin";
type MemberStatus = "Actif" | "Inactif";

interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: MemberStatus;
  discord: string;
  discordId?: string;
  twitch: string;
  twitchUrl?: string;
  siteUsername?: string;
  notesInternes?: string;
  badges?: string[];
  isVip?: boolean;
  isModeratorJunior?: boolean;
  isModeratorMentor?: boolean;
  description?: string;
  customBio?: string;
  twitchStatus?: {
    isLive: boolean;
    gameName?: string;
    viewerCount?: number;
  };
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/statistiques", label: "Statistiques Globales" },
];

export default function GestionMembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [safeModeEnabled, setSafeModeEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<"simple" | "complet">("simple");

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        const founderStatus = isFounder(user.id);
        setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
      }
    }
    loadAdmin();

    // Vérifier le Safe Mode
    fetch("/api/admin/safe-mode")
      .then((res) => res.json())
      .then((data) => setSafeModeEnabled(data.safeModeEnabled || false))
      .catch(() => setSafeModeEnabled(false));

    // Charger les membres depuis le canal Discord #vos-chaînes-twitch
    loadDiscordMembers();
  }, []);

  // Charger les membres depuis le canal Discord #vos-chaînes-twitch
  async function loadDiscordMembers() {
    try {
      setLoading(true);
      // Récupérer les membres depuis le canal Discord
      const discordResponse = await fetch("/api/discord/channel/members");
      if (!discordResponse.ok) {
        const errorText = await discordResponse.text();
        console.error("Erreur lors du chargement des membres depuis Discord:", errorText);
        throw new Error("Erreur lors du chargement des membres Discord");
      }
      const discordData = await discordResponse.json();

      // Si l'admin est fondateur, récupérer aussi les données centralisées pour enrichir
      let centralMembers: any[] = [];
      if (currentAdmin?.isFounder) {
        try {
          const centralResponse = await fetch("/api/admin/members");
          if (centralResponse.ok) {
            const centralData = await centralResponse.json();
            centralMembers = centralData.members || [];
          }
        } catch (err) {
          console.warn("Impossible de charger les données centralisées:", err);
        }
      }

      // Créer un map des membres par Discord ID
      const centralByDiscordId = new Map(
        centralMembers
          .filter((m: any) => m.discordId)
          .map((m: any) => [m.discordId, m])
      );

      // Mapper les membres Discord vers le format Member
      const mappedMembers: Member[] = discordData.members.map((discordMember: any, index: number) => {
        const centralMember = centralByDiscordId.get(discordMember.discordId);
        
        return {
          id: index + 1,
          avatar: discordMember.avatar,
          nom: discordMember.discordNickname || discordMember.discordUsername,
          role: discordMember.siteRole,
          statut: "Actif" as MemberStatus,
          discord: discordMember.discordUsername,
          discordId: discordMember.discordId,
          twitch: discordMember.twitchLogin || "",
          twitchUrl: discordMember.twitchUrl || `https://www.twitch.tv/${discordMember.twitchLogin}`,
          siteUsername: centralMember?.siteUsername,
          badges: discordMember.badges,
          isVip: discordMember.isVip,
          isModeratorJunior: discordMember.isModeratorJunior,
          isModeratorMentor: discordMember.isModeratorMentor,
          description: centralMember?.description,
          customBio: centralMember?.customBio,
          twitchStatus: centralMember?.twitchStatus,
        };
      });

      setMembers(mappedMembers);
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredMembers = members.filter((member) =>
    member.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.twitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.discord.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.siteUsername && member.siteUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleStatus = async (memberId: number) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    if (!canPerformAction(currentAdmin.id, "write", safeModeEnabled)) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const oldStatus = member.statut;
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";

    await logAction(
      currentAdmin.id,
      currentAdmin.username,
      newStatus === "Actif" ? "Activation d'un membre" : "Désactivation d'un membre",
      member.nom,
      { oldStatus, newStatus }
    );

    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, statut: newStatus }
          : member
      )
    );
  };

  const handleEdit = (member: Member) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedMember: Member) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }

    const oldMember = members.find((m) => m.id === updatedMember.id);
    if (!oldMember) return;

    await logAction(
      currentAdmin.id,
      currentAdmin.username,
      "Modification d'un membre",
      updatedMember.nom,
      {
        oldData: {
          nom: oldMember.nom,
          role: oldMember.role,
          statut: oldMember.statut,
          discord: oldMember.discord,
          twitch: oldMember.twitch,
        },
        newData: {
          nom: updatedMember.nom,
          role: updatedMember.role,
          statut: updatedMember.statut,
          discord: updatedMember.discord,
          twitch: updatedMember.twitch,
        },
      }
    );

    setMembers((prev) =>
      prev.map((member) =>
        member.id === updatedMember.id ? updatedMember : member
      )
    );
    setIsEditModalOpen(false);
    setSelectedMember(null);
  };

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case "Staff":
        return "bg-gray-700 text-white";
      case "Développement":
        return "bg-gray-700 text-white";
      case "Affilié":
        return "bg-gray-700 text-white";
      case "Mentor":
        return "bg-gray-700 text-white";
      case "Admin":
        return "bg-gray-700 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  const getStatusBadgeColor = (statut: MemberStatus) => {
    return statut === "Actif"
      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
      : "bg-purple-900/20 text-purple-400 border border-purple-900/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement des membres depuis le canal #vos-chaînes-twitch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Gestion des Membres" navLinks={navLinks} />

        {/* Barre de recherche et actions */}
        <div className="mb-6 flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode(viewMode === "simple" ? "complet" : "simple")}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              {viewMode === "simple" ? "📊 Vue complète" : "📋 Vue simple"}
            </button>
            
            <button
              onClick={async () => {
                setLoading(true);
                try {
                  const discordResponse = await fetch("/api/discord/channel/members");
                  if (!discordResponse.ok) throw new Error("Erreur Discord");
                  const discordData = await discordResponse.json();

                  let centralMembers: any[] = [];
                  if (currentAdmin?.isFounder) {
                    try {
                      const centralResponse = await fetch("/api/admin/members");
                      if (centralResponse.ok) {
                        const centralData = await centralResponse.json();
                        centralMembers = centralData.members || [];
                      }
                    } catch (err) {
                      console.warn("Impossible de charger les données centralisées:", err);
                    }
                  }

                  const centralByDiscordId = new Map(
                    centralMembers
                      .filter((m: any) => m.discordId)
                      .map((m: any) => [m.discordId, m])
                  );

                  const mappedMembers: Member[] = discordData.members.map((discordMember: any, index: number) => {
                    const centralMember = centralByDiscordId.get(discordMember.discordId);
                    return {
                      id: index + 1,
                      avatar: discordMember.avatar,
                      nom: discordMember.discordNickname || discordMember.discordUsername,
                      role: discordMember.siteRole,
                      statut: "Actif" as MemberStatus,
                      discord: discordMember.discordUsername,
                      discordId: discordMember.discordId,
                      twitch: discordMember.twitchLogin || "",
                      twitchUrl: discordMember.twitchUrl || `https://www.twitch.tv/${discordMember.twitchLogin}`,
                      siteUsername: centralMember?.siteUsername,
                      badges: discordMember.badges,
                      isVip: discordMember.isVip,
                      isModeratorJunior: discordMember.isModeratorJunior,
                      isModeratorMentor: discordMember.isModeratorMentor,
                      description: centralMember?.description,
                      customBio: centralMember?.customBio,
                      twitchStatus: centralMember?.twitchStatus,
                    };
                  });

                  setMembers(mappedMembers);
                  alert(`Synchronisation réussie : ${mappedMembers.length} membre(s) trouvé(s)`);
                } catch (error) {
                  console.error("Erreur lors de la synchronisation:", error);
                  alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
            >
              🔄 Synchroniser
            </button>

            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/members/sync-twitch", { method: "POST" });
                    const data = await response.json();
                    if (data.success) {
                      alert(`Synchronisation Twitch terminée : ${data.synced}/${data.total} membres`);
                      await loadDiscordMembers();
                    } else {
                      alert(`Erreur: ${data.error}`);
                    }
                  } catch (err) {
                    console.error("Error syncing:", err);
                    alert("Erreur lors de la synchronisation Twitch");
                  }
                }}
                className="bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                🔄 Sync Twitch
              </button>
            )}
          </div>
        </div>

        {/* Tableau des membres */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">CRÉATEUR</th>
                  {viewMode === "complet" && (
                    <>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Pseudo Site</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ID Discord</th>
                    </>
                  )}
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">RÔLE</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">STATUT</th>
                  {viewMode === "complet" && (
                    <>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">VIP</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Live</th>
                    </>
                  )}
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.nom}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <div className="text-white font-medium">{member.nom}</div>
                          {member.discord && (
                            <div className="text-xs text-gray-400">@{member.discord}</div>
                          )}
                          {member.twitch && (
                            <div className="text-xs text-gray-400">
                              Twitch:{" "}
                              <a
                                href={member.twitchUrl || `https://www.twitch.tv/${member.twitch}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#9146ff] hover:text-[#5a32b4]"
                              >
                                {member.twitch}
                              </a>
                            </div>
                          )}
                          <MemberBadges
                            badges={member.badges || []}
                            isVip={member.isVip}
                            isModeratorJunior={member.isModeratorJunior}
                            isModeratorMentor={member.isModeratorMentor}
                          />
                        </div>
                      </div>
                    </td>
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6 text-gray-300">
                          {member.siteUsername || "-"}
                        </td>
                        <td className="py-4 px-6">
                          <code className="text-xs text-gray-400 bg-[#0e0e10] px-2 py-1 rounded">
                            {member.discordId || "-"}
                          </code>
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(
                          member.statut
                        )}`}
                      >
                        {member.statut}
                      </span>
                    </td>
                    {viewMode === "complet" && (
                      <>
                        <td className="py-4 px-6">
                          {member.isVip ? (
                            <span className="px-2 py-1 rounded bg-[#9146ff] text-white text-xs font-semibold">
                              VIP
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          {member.twitchStatus?.isLive ? (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
                              <span className="text-red-400 text-xs font-semibold">LIVE</span>
                              {member.twitchStatus.viewerCount && (
                                <span className="text-gray-400 text-xs">
                                  {member.twitchStatus.viewerCount} viewers
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(member.id)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                            member.statut === "Actif"
                              ? "bg-red-600/20 text-red-300 hover:bg-red-600/30"
                              : "bg-green-600/20 text-green-300 hover:bg-green-600/30"
                          }`}
                        >
                          {member.statut === "Actif" ? "Désactiver" : "Activer"}
                        </button>
                        {currentAdmin?.isFounder && (
                          <button
                            onClick={() => handleEdit(member)}
                            className="bg-[#9146ff] hover:bg-[#5a32b4] px-3 py-1 rounded text-xs font-semibold text-white transition-colors"
                          >
                            Modifier
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'édition (pour les fondateurs) */}
        {isEditModalOpen && selectedMember && currentAdmin?.isFounder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Modifier le membre</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Pseudo Site</label>
                  <input
                    type="text"
                    value={selectedMember.siteUsername || ""}
                    onChange={(e) =>
                      setSelectedMember({ ...selectedMember, siteUsername: e.target.value })
                    }
                    className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Chaîne Twitch</label>
                  <input
                    type="text"
                    value={selectedMember.twitch}
                    onChange={(e) =>
                      setSelectedMember({ ...selectedMember, twitch: e.target.value })
                    }
                    className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={selectedMember.description || ""}
                    onChange={(e) =>
                      setSelectedMember({ ...selectedMember, description: e.target.value })
                    }
                    className="w-full bg-[#0e0e10] border border-[#2a2a2d] rounded px-3 py-2 text-white"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedMember(null);
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-white"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSaveEdit(selectedMember)}
                  className="flex-1 bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-2 rounded text-white"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
