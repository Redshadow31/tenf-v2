"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import MemberBadges from "@/components/admin/MemberBadges";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import BulkImportModal from "@/components/admin/BulkImportModal";
import { logAction } from "@/lib/logAction";
import { getDiscordUser } from "@/lib/discord";
import { canPerformAction, isFounder } from "@/lib/admin";

type MemberRole = "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
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
  }, []);

  // Charger les membres une fois que currentAdmin est défini
  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembers();
    }
  }, [currentAdmin?.isFounder]); // Seulement quand le statut fondateur change

  // Charger les membres depuis la base de données centralisée
  async function loadMembers() {
    try {
      setLoading(true);
      
      // Si l'admin est fondateur, charger depuis l'API centralisée
      if (currentAdmin?.isFounder) {
        try {
          const centralResponse = await fetch("/api/admin/members", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
          if (centralResponse.ok) {
            const centralData = await centralResponse.json();
            const centralMembers = centralData.members || [];
            
            // Mapper les membres centralisés vers le format Member
            const mappedMembers: Member[] = centralMembers.map((member: any, index: number) => {
              // Essayer de récupérer l'avatar depuis Discord si on a l'ID
              const avatar = member.discordId 
                ? `https://cdn.discordapp.com/avatars/${member.discordId}/avatar.png`
                : `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin).charAt(0).toUpperCase()}`;
              
              return {
                id: index + 1,
                avatar,
                nom: member.displayName || member.twitchLogin,
                role: member.role || "Affilié",
                statut: member.isActive ? "Actif" : "Inactif" as MemberStatus,
                discord: member.discordUsername || "",
                discordId: member.discordId,
                twitch: member.twitchLogin || "",
                twitchUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
                siteUsername: member.siteUsername,
                description: member.description,
                customBio: member.customBio,
                twitchStatus: member.twitchStatus,
                badges: member.badges || [],
                isVip: member.isVip || false,
                isModeratorJunior: member.badges?.includes("Modérateur Junior") || false,
                isModeratorMentor: member.badges?.includes("Modérateur Mentor") || false,
              };
            });
            
            setMembers(mappedMembers);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn("Impossible de charger les membres depuis l'API centralisée:", err);
        }
      }
      
      // Fallback: essayer de charger depuis Discord si l'API centralisée n'est pas disponible
      await loadDiscordMembers();
    } catch (error) {
      console.error("Erreur lors du chargement des membres:", error);
      setMembers([]);
      setLoading(false);
    }
  }

  // Charger les membres depuis le canal Discord #vos-chaînes-twitch (fallback)
  async function loadDiscordMembers() {
    try {
      setLoading(true);
      // Récupérer les membres depuis le canal Discord
      const discordResponse = await fetch("/api/discord/channel/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!discordResponse.ok) {
        let errorMessage = "Erreur lors du chargement des membres Discord";
        try {
          const errorData = await discordResponse.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          
          // Messages d'erreur plus spécifiques
          if (errorMessage.includes("Discord bot token not configured")) {
            errorMessage = "Le token du bot Discord n'est pas configuré. Veuillez configurer DISCORD_BOT_TOKEN dans Netlify.";
          } else if (errorMessage.includes("Failed to fetch Discord messages")) {
            errorMessage = "Impossible de récupérer les messages Discord. Vérifiez que le bot a accès au canal.";
          } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
            errorMessage = "Token Discord invalide ou expiré. Vérifiez la configuration du bot.";
          } else if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
            errorMessage = "Le bot n'a pas les permissions nécessaires. Vérifiez les permissions du bot sur le serveur Discord.";
          }
        } catch (e) {
          // Si on ne peut pas parser l'erreur, utiliser le message par défaut
          console.error("Erreur lors du parsing de l'erreur:", e);
        }
        console.error("Erreur lors du chargement des membres depuis Discord:", errorMessage);
        alert(`Erreur Discord: ${errorMessage}`);
        setMembers([]); // Afficher une liste vide plutôt que de rester bloqué
        return;
      }
      const discordData = await discordResponse.json();

      // Vérifier si la réponse contient des membres
      if (!discordData.members || !Array.isArray(discordData.members)) {
        console.warn("Aucun membre trouvé dans la réponse Discord");
        setMembers([]);
        return;
      }

      // Si l'admin est fondateur, récupérer aussi les données centralisées pour enrichir
      let centralMembers: any[] = [];
      if (currentAdmin?.isFounder) {
        try {
          const centralResponse = await fetch("/api/admin/members", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
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
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue lors du chargement des membres";
      alert(`Erreur: ${errorMessage}`);
      setMembers([]); // Afficher une liste vide plutôt que de rester bloqué
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
    if (!member || !member.twitch) return;

    const oldStatus = member.statut;
    const newStatus = oldStatus === "Actif" ? "Inactif" : "Actif";

    try {
      // Mettre à jour via l'API si c'est un fondateur
      if (currentAdmin.isFounder) {
        const response = await fetch("/api/admin/members", {
          method: "PUT",
          cache: 'no-store',
          headers: {
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            twitchLogin: member.twitch,
            isActive: newStatus === "Actif",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur lors de la mise à jour");
        }
      }

      await logAction(
        currentAdmin.id,
        currentAdmin.username,
        newStatus === "Actif" ? "Activation d'un membre" : "Désactivation d'un membre",
        member.nom,
        { oldStatus, newStatus }
      );

      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleEdit = (member: Member) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedMember: {
    id: number;
    avatar: string;
    nom: string;
    role: MemberRole;
    statut: "Actif" | "Inactif";
    discord: string;
    twitch: string;
    notesInternes?: string;
    badges?: string[];
    isVip?: boolean;
  }) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }

    const oldMember = members.find((m) => m.id === updatedMember.id);
    if (!oldMember) return;

    // Fusionner les données du modal avec les données existantes
    const mergedMember: Member = {
      ...oldMember,
      nom: updatedMember.nom,
      role: updatedMember.role,
      statut: updatedMember.statut,
      discord: updatedMember.discord,
      twitch: updatedMember.twitch,
      description: updatedMember.notesInternes || oldMember.description,
    };

    try {
      // Mettre à jour via l'API
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        cache: 'no-store',
        headers: { 
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          twitchLogin: mergedMember.twitch,
          displayName: mergedMember.nom,
          twitchUrl: mergedMember.twitchUrl || `https://www.twitch.tv/${mergedMember.twitch}`,
          discordId: mergedMember.discordId,
          discordUsername: mergedMember.discord,
          role: mergedMember.role,
          isActive: mergedMember.statut === "Actif",
          isVip: mergedMember.isVip || false,
          badges: mergedMember.badges || [],
          description: mergedMember.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour");
      }

      await logAction(
        currentAdmin.id,
        currentAdmin.username,
        "Modification d'un membre",
        mergedMember.nom,
        {
          oldData: {
            nom: oldMember.nom,
            role: oldMember.role,
            statut: oldMember.statut,
            discord: oldMember.discord,
            twitch: oldMember.twitch,
          },
          newData: {
            nom: mergedMember.nom,
            role: mergedMember.role,
            statut: mergedMember.statut,
            discord: mergedMember.discord,
            twitch: mergedMember.twitch,
          },
        }
      );

      setIsEditModalOpen(false);
      setSelectedMember(null);
      alert("Membre modifié avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleAdd = async (newMember: {
    nom: string;
    role: MemberRole;
    statut: "Actif" | "Inactif";
    discord: string;
    discordId?: string;
    twitch: string;
    avatar: string;
  }) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent ajouter des membres");
      return;
    }

    try {
      // Créer via l'API
      const response = await fetch("/api/admin/members", {
        method: "POST",
        cache: 'no-store',
        headers: { 
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          twitchLogin: newMember.twitch,
          displayName: newMember.nom,
          twitchUrl: `https://www.twitch.tv/${newMember.twitch}`,
          discordId: newMember.discordId,
          discordUsername: newMember.discord,
          role: newMember.role,
          isActive: newMember.statut === "Actif",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout");
      }

      const data = await response.json();
      
      await logAction(
        currentAdmin.id,
        currentAdmin.username,
        "Ajout d'un membre",
        newMember.nom,
        {
          twitchLogin: newMember.twitch,
          role: newMember.role,
          statut: newMember.statut,
        }
      );

      // Ajouter à la liste locale
      const addedMember: Member = {
        id: members.length + 1,
        avatar: newMember.avatar,
        nom: newMember.nom,
        role: newMember.role,
        statut: newMember.statut,
        discord: newMember.discord,
        twitch: newMember.twitch,
        twitchUrl: `https://www.twitch.tv/${newMember.twitch}`,
      };

      setIsAddModalOpen(false);
      alert("Membre ajouté avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleDelete = async (member: Member) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent supprimer des membres");
      return;
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer définitivement ${member.nom} ? Cette action est irréversible.`)) {
      return;
    }

    try {
        const response = await fetch(`/api/admin/members?twitchLogin=${encodeURIComponent(member.twitch)}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la suppression");
      }

      await logAction(
        currentAdmin.id,
        currentAdmin.username,
        "Suppression d'un membre",
        member.nom,
        {
          twitchLogin: member.twitch,
          role: member.role,
        }
      );

      alert("Membre supprimé avec succès");
      // Recharger les membres depuis la base de données
      await loadMembers();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const handleBulkImport = async (members: Array<{ nom: string; discord: string; twitch: string; discordId?: string }>) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent importer des membres");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const member of members) {
      try {
        const response = await fetch("/api/admin/members", {
          method: "POST",
          cache: 'no-store',
          headers: { 
            "Content-Type": "application/json",
            'Cache-Control': 'no-cache',
          },
          body: JSON.stringify({
            twitchLogin: member.twitch,
            displayName: member.nom,
            twitchUrl: `https://www.twitch.tv/${member.twitch}`,
            discordId: member.discordId,
            discordUsername: member.discord,
            role: "Affilié",
            isActive: true,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const error = await response.json();
          errorCount++;
          errors.push(`${member.nom}: ${error.error || "Erreur inconnue"}`);
        }
      } catch (error) {
        errorCount++;
        errors.push(`${member.nom}: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
      }
    }

    await logAction(
      currentAdmin.id,
      currentAdmin.username,
      "Import en masse de membres",
      `${successCount} membres importés`,
      { successCount, errorCount, errors: errors.slice(0, 10) }
    );

    alert(`Import terminé : ${successCount} membres ajoutés, ${errorCount} erreurs`);
    setIsBulkImportOpen(false);
    await loadMembers();
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
      case "Admin Adjoint":
        return "bg-gray-700 text-white";
      case "Créateur Junior":
        return "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30";
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
            {currentAdmin?.isFounder && (
              <>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  ➕ Ajouter une chaîne
                </button>
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  📥 Import en masse
                </button>
              </>
            )}
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
                  const discordResponse = await fetch("/api/discord/channel/members", {
                    cache: 'no-store',
                    headers: {
                      'Cache-Control': 'no-cache',
                    },
                  });
                  if (!discordResponse.ok) {
                    let errorMessage = "Erreur lors de la synchronisation Discord";
                    try {
                      const errorData = await discordResponse.json();
                      errorMessage = errorData.error || errorData.details || errorMessage;
                    } catch (e) {
                      // Ignorer si on ne peut pas parser l'erreur
                    }
                    throw new Error(errorMessage);
                  }
                  const discordData = await discordResponse.json();

                  let centralMembers: any[] = [];
                  if (currentAdmin?.isFounder) {
                    try {
                      const centralResponse = await fetch("/api/admin/members", {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache',
            },
          });
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
                          <>
                            <button
                              onClick={() => handleEdit(member)}
                              className="bg-[#9146ff] hover:bg-[#5a32b4] px-3 py-1 rounded text-xs font-semibold text-white transition-colors"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDelete(member)}
                              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 px-3 py-1 rounded text-xs font-semibold transition-colors"
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'ajout (pour les fondateurs) */}
        {currentAdmin?.isFounder && (
          <>
            <AddChannelModal
              isOpen={isAddModalOpen}
              onClose={() => setIsAddModalOpen(false)}
              onAdd={handleAdd}
            />
            <BulkImportModal
              isOpen={isBulkImportOpen}
              onClose={() => setIsBulkImportOpen(false)}
              onImport={handleBulkImport}
            />
          </>
        )}

        {/* Modal d'édition (pour les fondateurs) */}
        {isEditModalOpen && selectedMember && currentAdmin?.isFounder && (
          <EditMemberModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedMember(null);
            }}
            member={{
              id: selectedMember.id,
              avatar: selectedMember.avatar,
              nom: selectedMember.nom,
              role: selectedMember.role,
              statut: selectedMember.statut,
              discord: selectedMember.discord,
              twitch: selectedMember.twitch,
              notesInternes: selectedMember.description,
            }}
            onSave={handleSaveEdit}
          />
        )}
      </div>
    </div>
  );
}
