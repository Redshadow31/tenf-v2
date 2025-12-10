"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import { logAction } from "@/lib/logAction";
import { getDiscordUser } from "@/lib/discord";
import { canPerformAction } from "@/lib/admin";
import MemberBadges from "@/components/admin/MemberBadges";

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
  notesInternes?: string;
  badges?: string[];
  isVip?: boolean;
  isModeratorJunior?: boolean;
  isModeratorMentor?: boolean;
}

// Données mock
const mockMembers: Member[] = [
  {
    id: 1,
    avatar: "https://placehold.co/64x64?text=C",
    nom: "Clara",
    role: "Affilié",
    statut: "Actif",
    discord: "ClaraStonewall#1234",
    twitch: "clarastonewall",
    notesInternes: "Conformité ok.",
  },
  {
    id: 2,
    avatar: "https://placehold.co/64x64?text=Y",
    nom: "Yaya",
    role: "Développement",
    statut: "Inactif",
    discord: "Yaya_TV#5678",
    twitch: "yaya_romali",
  },
  {
    id: 3,
    avatar: "https://placehold.co/64x64?text=R",
    nom: "Red_Shadow",
    role: "Staff",
    statut: "Actif",
    discord: "Red_Shadow_31#9012",
    twitch: "red_shadow_31",
  },
  {
    id: 4,
    avatar: "https://placehold.co/64x64?text=L",
    nom: "Livio_On",
    role: "Développement",
    statut: "Actif",
    discord: "Livio_On#3456",
    twitch: "livio_on",
  },
  {
    id: 5,
    avatar: "https://placehold.co/64x64?text=S",
    nom: "Selena",
    role: "Staff",
    statut: "Actif",
    discord: "Selena_Akemi#7890",
    twitch: "selena_akemi",
  },
];

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
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMemberForNotes, setSelectedMemberForNotes] = useState<Member | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [safeModeEnabled, setSafeModeEnabled] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        setCurrentAdmin({ id: user.id, username: user.username });
      }
    }
    loadAdmin();

    // Vérifier le Safe Mode
    fetch("/api/admin/safe-mode")
      .then((res) => res.json())
      .then((data) => setSafeModeEnabled(data.safeModeEnabled || false))
      .catch(() => setSafeModeEnabled(false));

    // Charger les membres depuis Discord et les lier aux données locales
    async function loadDiscordMembers() {
      try {
        // Récupérer les membres depuis Discord
        const discordResponse = await fetch("/api/discord/members");
        if (!discordResponse.ok) {
          throw new Error("Erreur lors du chargement des membres Discord");
        }
        const discordData = await discordResponse.json();

        // Récupérer les données centralisées pour avoir les Twitch logins
        let centralMembers: any[] = [];
        try {
          const centralResponse = await fetch("/api/admin/members");
          if (centralResponse.ok) {
            const centralData = await centralResponse.json();
            centralMembers = centralData.members || [];
          }
        } catch (err) {
          console.warn("Impossible de charger les données centralisées:", err);
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
            twitch: centralMember?.twitchLogin || "", // Utiliser le Twitch login depuis les données centralisées
            badges: discordMember.badges,
            isVip: discordMember.isVip,
            isModeratorJunior: discordMember.isModeratorJunior,
            isModeratorMentor: discordMember.isModeratorMentor,
          };
        });

        setMembers(mappedMembers);
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
        // En cas d'erreur, utiliser les données mock
        setMembers(mockMembers);
      } finally {
        setLoading(false);
      }
    }

    loadDiscordMembers();
  }, []);

  const filteredMembers = members.filter((member) =>
    member.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.twitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.discord.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = async (memberId: number) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    // Vérifier les permissions (Safe Mode)
    if (!canPerformAction(currentAdmin.id, "write", safeModeEnabled)) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    const oldStatus = member.statut;
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";

    // Logger l'action
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
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedMember: Member) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    // Vérifier les permissions (Safe Mode)
    if (!canPerformAction(currentAdmin.id, "write", safeModeEnabled)) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const oldMember = members.find((m) => m.id === updatedMember.id);
    if (!oldMember) return;

    // Logger l'action
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

  const handleDelete = async (memberId: number) => {
    if (!currentAdmin) {
      alert("Vous devez être connecté pour effectuer cette action");
      return;
    }

    // Vérifier les permissions (Safe Mode)
    if (!canPerformAction(currentAdmin.id, "write", safeModeEnabled)) {
      alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
      return;
    }

    const member = members.find((m) => m.id === memberId);
    if (!member) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
      // Logger l'action
      await logAction(
        currentAdmin.id,
        currentAdmin.username,
        "Suppression d'un membre",
        member.nom,
        {
          nom: member.nom,
          role: member.role,
          statut: member.statut,
        }
      );

      setMembers((prev) => prev.filter((member) => member.id !== memberId));
    }
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
          <p className="text-gray-400">Chargement des membres depuis Discord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-purple-300">Gestion des Membres</h1>
              <p className="text-sm text-gray-400 mt-2">
                Synchronisé avec Discord • {members.length} membre{members.length > 1 ? 's' : ''} trouvé{members.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    // Récupérer les membres depuis Discord
                    const discordResponse = await fetch("/api/discord/members");
                    if (!discordResponse.ok) throw new Error("Erreur Discord");
                    const discordData = await discordResponse.json();

                    // Récupérer les données centralisées
                    let centralMembers: any[] = [];
                    try {
                      const centralResponse = await fetch("/api/admin/members");
                      if (centralResponse.ok) {
                        const centralData = await centralResponse.json();
                        centralMembers = centralData.members || [];
                      }
                    } catch (err) {
                      console.warn("Impossible de charger les données centralisées:", err);
                    }

                    // Créer un map des membres par Discord ID
                    const centralByDiscordId = new Map(
                      centralMembers
                        .filter((m: any) => m.discordId)
                        .map((m: any) => [m.discordId, m])
                    );

                    // Mapper les membres
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
                        twitch: centralMember?.twitchLogin || "",
                        badges: discordMember.badges,
                        isVip: discordMember.isVip,
                        isModeratorJunior: discordMember.isModeratorJunior,
                        isModeratorMentor: discordMember.isModeratorMentor,
                      };
                    });

                    setMembers(mappedMembers);
                  } catch (error) {
                    console.error("Erreur lors de la synchronisation:", error);
                    alert("Erreur lors de la synchronisation. Vérifiez la console.");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
              >
                🔄 Synchroniser
              </button>
              <button
                onClick={() => setIsAddChannelModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                AJOUTER UNE CHAÎNE
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-[#9146ff] text-white"
                    : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-gray-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md bg-[#1a1a1d] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Tableau des membres */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">CRÉATEUR</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">RÔLE</th>
                <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">STATUT</th>
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
                          <div className="text-xs text-gray-400">Twitch: {member.twitch}</div>
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
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold w-fit ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {member.role}
                      </span>
                    </div>
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
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatus(member.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          member.statut === "Actif"
                            ? "bg-purple-900/30 text-purple-300 hover:bg-purple-900/50"
                            : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                        }`}
                      >
                        {member.statut === "Actif" ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => handleEdit(member)}
                        className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="bg-red-900/30 text-red-300 hover:bg-red-900/50 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Supprimer
                      </button>
                      <button
                        onClick={() => setSelectedMemberForNotes(member)}
                        className="bg-gray-700 text-gray-300 hover:bg-gray-600 px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Notes
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section Notes internes */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Notes internes</h3>
              {selectedMemberForNotes ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">
                      Notes pour <span className="text-white font-semibold">{selectedMemberForNotes.nom}</span>
                    </p>
                    <textarea
                      defaultValue={selectedMemberForNotes.notesInternes || ""}
                      placeholder="Ajouter des notes internes..."
                      className="w-full bg-[#0e0e10] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 min-h-[100px]"
                      onChange={(e) => {
                        setSelectedMemberForNotes({
                          ...selectedMemberForNotes,
                          notesInternes: e.target.value,
                        });
                      }}
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => {
                          if (selectedMemberForNotes) {
                            handleSaveEdit(selectedMemberForNotes);
                            setSelectedMemberForNotes(null);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => setSelectedMemberForNotes(null)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">
                  Sélectionnez un membre et cliquez sur "Notes" pour voir ou modifier les notes internes.
                </p>
              )}
            </div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informations</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p>Total membres: {members.length}</p>
              <p>Actifs: {members.filter((m) => m.statut === "Actif").length}</p>
              <p>Inactifs: {members.filter((m) => m.statut === "Inactif").length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddChannelModal
        isOpen={isAddChannelModalOpen}
        onClose={() => setIsAddChannelModalOpen(false)}
        onAdd={async (newMember) => {
          if (!currentAdmin) {
            alert("Vous devez être connecté pour effectuer cette action");
            return;
          }

          // Vérifier les permissions (Safe Mode)
          if (!canPerformAction(currentAdmin.id, "write", safeModeEnabled)) {
            alert("Action bloquée : Safe Mode activé. Seuls les fondateurs peuvent modifier les données.");
            return;
          }

          // Logger l'action
          await logAction(
            currentAdmin.id,
            currentAdmin.username,
            "Ajout d'un membre",
            newMember.nom,
            {
              nom: newMember.nom,
              role: newMember.role,
              statut: newMember.statut,
              discord: newMember.discord,
              twitch: newMember.twitch,
            }
          );

          // Ajouter le membre
          const newId = Math.max(...members.map((m) => m.id), 0) + 1;
          setMembers((prev) => [
            ...prev,
            {
              ...newMember,
              id: newId,
            },
          ]);
          setIsAddChannelModalOpen(false);
        }}
      />

      {selectedMember && (
        <EditMemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
