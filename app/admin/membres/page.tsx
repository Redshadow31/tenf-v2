"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import MemberBadges from "@/components/admin/MemberBadges";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";
import BulkImportModal from "@/components/admin/BulkImportModal";
import DiscordSyncModal from "@/components/admin/DiscordSyncModal";
import MergeMemberModal from "@/components/admin/MergeMemberModal";
// logAction est maintenant appelé via l'API /api/admin/log
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
  lastLiveDate?: string; // Date ISO du dernier live
  raidsDone?: number; // Nombre de raids envoyés ce mois
  raidsReceived?: number; // Nombre de raids reçus ce mois
}

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres", active: true },
  { href: "/admin/raids", label: "Suivi des Raids" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/statistiques", label: "Statistiques Globales" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/fusion-doublons", label: "Fusion Doublons" },
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
  const [sortColumn, setSortColumn] = useState<"nom" | "role" | "lastLive" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [lastLiveDatesLoaded, setLastLiveDatesLoaded] = useState(false);
  const [showDiscordSyncModal, setShowDiscordSyncModal] = useState(false);
  const [discordSyncMembers, setDiscordSyncMembers] = useState<any[]>([]);
  const [discordSyncLoading, setDiscordSyncLoading] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [membersToMerge, setMembersToMerge] = useState<any[]>([]);
  const [mergeLoading, setMergeLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ key: string; type: string; members: any[] }>>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        // Vérifier le rôle dans memberData pour savoir si c'est un Admin Adjoint
        try {
          const roleResponse = await fetch("/api/user/role");
          const roleData = await roleResponse.json();
          
          // Vérifier que l'utilisateur a accès admin
          if (!roleData.hasAdminAccess) {
            // Rediriger vers la page unauthorized
            window.location.href = "/unauthorized";
            return;
          }
          
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          // Admin, Admin Adjoint et Fondateurs ont accès complet
          setCurrentAdmin({ 
            id: user.id, 
            username: user.username, 
            isFounder: founderStatus || isAdminRole || isAdminAdjoint 
          });
        } catch (err) {
          // Fallback si l'API de rôle ne fonctionne pas
          const founderStatus = isFounder(user.id);
          // En fallback, on vérifie seulement les fondateurs (liste hardcodée)
          // Les Admin et Admin Adjoint devront attendre que l'API fonctionne
          if (!founderStatus) {
            // Si pas fondateur et API ne fonctionne pas, rediriger
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        // Pas connecté, rediriger vers login
        window.location.href = "/auth/login?redirect=/admin/membres";
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
      setLastLiveDatesLoaded(false); // Réinitialiser le flag pour recharger les dates
      
      // Charger les stats de raids en parallèle
      let raidsStats: Record<string, { done: number; received: number }> = {};
      try {
        const raidsResponse = await fetch("/api/discord/raids", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (raidsResponse.ok) {
          const raidsData = await raidsResponse.json();
          const raids = raidsData.raids || {};
          // Extraire les stats pour chaque membre
          for (const [twitchLogin, stats] of Object.entries(raids)) {
            raidsStats[twitchLogin.toLowerCase()] = {
              done: (stats as any).done || 0,
              received: (stats as any).received || 0,
            };
          }
        }
      } catch (err) {
        console.warn("Impossible de charger les stats de raids:", err);
      }
      
      // Si l'admin a accès (Fondateur, Admin, ou Admin Adjoint), charger depuis l'API centralisée
      // L'API centralisée contient les modifications manuelles et est prioritaire
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
            
            // Récupérer tous les avatars Twitch en batch depuis l'API publique
            const publicMembersResponse = await fetch("/api/members/public", {
              cache: 'no-store',
              headers: {
                'Cache-Control': 'no-cache',
              },
            });
            
            let avatarMap = new Map<string, string>();
            if (publicMembersResponse.ok) {
              const publicData = await publicMembersResponse.json();
              publicData.members?.forEach((m: any) => {
                if (m.avatar) {
                  avatarMap.set(m.twitchLogin.toLowerCase(), m.avatar);
                }
              });
            }
            
            // Mapper les membres centralisés vers le format Member avec avatars Twitch
            const mappedMembers: Member[] = centralMembers.map((member: any, index: number) => {
              // Récupérer l'avatar depuis le map (déjà récupéré en batch)
              let avatar = avatarMap.get(member.twitchLogin.toLowerCase());
              
              // Si pas d'avatar Twitch, utiliser Discord en fallback
              if (!avatar && member.discordId) {
                avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(member.discordId) % 5}.png`;
              }
              
              // Dernier fallback : placeholder
              if (!avatar) {
                avatar = `https://placehold.co/64x64?text=${(member.displayName || member.twitchLogin).charAt(0).toUpperCase()}`;
              }
              
              // Récupérer les stats de raids
              const raidStats = raidsStats[member.twitchLogin.toLowerCase()] || { done: 0, received: 0 };
            
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
                raidsDone: raidStats.done,
                raidsReceived: raidStats.received,
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

      // Créer des maps pour fusionner les données
      const centralByDiscordId = new Map(
        centralMembers
          .filter((m: any) => m.discordId)
          .map((m: any) => [m.discordId, m])
      );
      
      // Map par Twitch login pour récupérer les IDs Discord même si pas de discordId dans Discord
      const centralByTwitchLogin = new Map(
        centralMembers
          .map((m: any) => [m.twitchLogin?.toLowerCase(), m])
      );

      // Récupérer tous les avatars Twitch en batch depuis l'API publique
      const publicMembersResponse = await fetch("/api/members/public", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      let avatarMap = new Map<string, string>();
      if (publicMembersResponse.ok) {
        const publicData = await publicMembersResponse.json();
        publicData.members?.forEach((m: any) => {
          if (m.avatar) {
            avatarMap.set(m.twitchLogin.toLowerCase(), m.avatar);
          }
        });
      }

      // Mapper les membres Discord vers le format Member avec avatars Twitch
      const mappedMembers: Member[] = discordData.members.map((discordMember: any, index: number) => {
        // Chercher le membre centralisé par Discord ID d'abord
        let centralMember = centralByDiscordId.get(discordMember.discordId);
        
        // Si pas trouvé par Discord ID, chercher par Twitch login
        if (!centralMember && discordMember.twitchLogin) {
          centralMember = centralByTwitchLogin.get(discordMember.twitchLogin.toLowerCase());
        }
        
        // Utiliser l'ID Discord de la base de données centralisée si disponible, sinon celui de Discord
        const discordId = centralMember?.discordId || discordMember.discordId;
        
        // Récupérer l'avatar depuis le map (déjà récupéré en batch) ou utiliser Discord
        let avatar = discordMember.avatar; // Fallback Discord
        if (discordMember.twitchLogin) {
          const twitchAvatar = avatarMap.get(discordMember.twitchLogin.toLowerCase());
          if (twitchAvatar) {
            avatar = twitchAvatar;
          }
        }
        
        return {
          id: index + 1,
          avatar,
          nom: discordMember.discordNickname || discordMember.discordUsername,
          role: centralMember?.role || discordMember.siteRole,
          statut: (centralMember?.isActive !== false ? "Actif" : "Inactif") as MemberStatus,
          discord: centralMember?.discordUsername || discordMember.discordUsername,
          discordId: discordId, // Utiliser l'ID Discord de la base de données si disponible
          twitch: discordMember.twitchLogin || "",
          twitchUrl: discordMember.twitchUrl || `https://www.twitch.tv/${discordMember.twitchLogin}`,
          siteUsername: centralMember?.siteUsername,
          badges: centralMember?.badges || discordMember.badges || [],
          isVip: centralMember?.isVip || discordMember.isVip || false,
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

  // Fonction pour récupérer les dernières dates de live
  const fetchLastLiveDates = async (membersToUpdate: Member[]) => {
    const twitchLogins = membersToUpdate
      .map(m => m.twitch)
      .filter(Boolean);
    
    if (twitchLogins.length === 0) return membersToUpdate;

    try {
      const response = await fetch(
        `/api/twitch/last-streams?logins=${twitchLogins.join(',')}`,
        { cache: 'no-store' }
      );
      
      if (response.ok) {
        const data = await response.json();
        const lastStreams = data.lastStreams || {};
        
        return membersToUpdate.map(member => ({
          ...member,
          lastLiveDate: lastStreams[member.twitch.toLowerCase()] || undefined,
        }));
      }
    } catch (error) {
      console.error('Error fetching last live dates:', error);
    }
    
    return membersToUpdate;
  };

  // Filtrer les membres
  let filteredMembers = members.filter((member) =>
    member.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.twitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.discord.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.siteUsername && member.siteUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Trier les membres
  if (sortColumn) {
    filteredMembers = [...filteredMembers].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case "nom":
          comparison = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
          break;
        case "role":
          comparison = a.role.localeCompare(b.role, 'fr', { sensitivity: 'base' });
          break;
        case "lastLive":
          const dateA = a.lastLiveDate ? new Date(a.lastLiveDate).getTime() : 0;
          const dateB = b.lastLiveDate ? new Date(b.lastLiveDate).getTime() : 0;
          comparison = dateA - dateB;
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }

  // Fonction pour gérer le clic sur un en-tête de colonne
  const handleSort = (column: "nom" | "role" | "lastLive") => {
    if (sortColumn === column) {
      // Inverser la direction si on clique sur la même colonne
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Nouvelle colonne, trier par ordre croissant
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Récupérer les dernières dates de live après le chargement initial
  useEffect(() => {
    if (members.length > 0 && !loading && !lastLiveDatesLoaded) {
      setLastLiveDatesLoaded(true);
      fetchLastLiveDates(members).then(updatedMembers => {
        // Ne mettre à jour que si les dates ont changé
        const hasNewDates = updatedMembers.some((m, i) => 
          m.lastLiveDate !== members[i]?.lastLiveDate
        );
        if (hasNewDates) {
          setMembers(updatedMembers);
        }
      });
    }
  }, [loading]); // Seulement quand le chargement change

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

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: newStatus === "Actif" ? "Activation d'un membre" : "Désactivation d'un membre",
            target: member.nom,
            details: { oldStatus, newStatus },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

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
    discordId?: string;
    twitch: string;
    notesInternes?: string;
    description?: string;
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
      discordId: updatedMember.discordId,
      twitch: updatedMember.twitch,
      description: updatedMember.description || oldMember.description,
      notesInternes: updatedMember.notesInternes || oldMember.notesInternes,
      badges: updatedMember.badges || oldMember.badges,
      isVip: updatedMember.isVip !== undefined ? updatedMember.isVip : oldMember.isVip,
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

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Modification d'un membre",
            target: mergedMember.nom,
            details: {
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
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

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
      
      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Ajout d'un membre",
            target: newMember.nom,
            details: {
              twitchLogin: newMember.twitch,
              role: newMember.role,
              statut: newMember.statut,
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

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

      // Logger l'action via l'API
      try {
        await fetch("/api/admin/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "Suppression d'un membre",
            target: member.nom,
            details: {
              twitchLogin: member.twitch,
              role: member.role,
            },
          }),
        });
      } catch (err) {
        console.error("Erreur lors du logging:", err);
      }

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

    // Logger l'action via l'API
    try {
      await fetch("/api/admin/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "Import en masse de membres",
          target: `${successCount} membres importés`,
          details: { successCount, errorCount, errors: errors.slice(0, 10) },
        }),
      });
    } catch (err) {
      console.error("Erreur lors du logging:", err);
    }

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

  const formatLastLiveDate = (dateString?: string) => {
    if (!dateString) return "-";
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else if (diffMinutes > 0) {
        return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
      } else {
        return "À l'instant";
      }
    } catch (error) {
      return "-";
    }
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

            {/* Bouton d'export des modifications manuelles (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/admin/members/export-manual", {
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    });
                    const data = await response.json();
                    if (data.success) {
                      // Télécharger le fichier JSON
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `manual-changes-export-${new Date().toISOString().split('T')[0]}.json`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      alert(
                        `Export terminé !\n\n` +
                        `Total: ${data.totalManualChanges} membre(s)\n` +
                        `Fichier téléchargé: ${a.download}`
                      );
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de l'export:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  }
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                title="Exporter les modifications manuelles dans un fichier JSON"
              >
                📥 Exporter Modifications
              </button>
            )}

            {/* Bouton de synchronisation complète Discord (pour les fondateurs) */}
            {currentAdmin?.isFounder && (
              <button
                onClick={async () => {
                  setDiscordSyncLoading(true);
                  try {
                    // Récupérer la liste des membres Discord disponibles
                    const response = await fetch("/api/discord/members/sync?preview=true", {
                      method: "POST",
                      cache: 'no-store',
                      headers: {
                        'Cache-Control': 'no-cache',
                      },
                    });
                    const data = await response.json();
                    if (data.success && data.members) {
                      // Charger les membres existants pour détecter les modifications manuelles
                      const existingResponse = await fetch("/api/admin/members", {
                        cache: 'no-store',
                        headers: {
                          'Cache-Control': 'no-cache',
                        },
                      });
                      const existingData = await existingResponse.json();
                      const existingMembers = existingData.members || [];
                      const existingByDiscordId = new Map(
                        existingMembers
                          .filter((m: any) => m.discordId)
                          .map((m: any) => [m.discordId, m])
                      );

                      // Enrichir les membres Discord avec les infos de modifications manuelles
                      const enrichedMembers = data.members.map((member: any) => {
                        const existing: any = existingByDiscordId.get(member.discordId);
                        return {
                          ...member,
                          isExisting: !!existing,
                          hasManualChanges: existing?.roleManuallySet || false,
                          twitchLogin: existing?.twitchLogin || member.twitchLogin,
                        };
                      });

                      setDiscordSyncMembers(enrichedMembers);
                      setShowDiscordSyncModal(true);
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de la récupération des membres Discord:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  } finally {
                    setDiscordSyncLoading(false);
                  }
                }}
                className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                disabled={discordSyncLoading}
              >
                {discordSyncLoading ? "⏳ Chargement..." : "🔄 Sync Discord Complète"}
              </button>
            )}

            {/* Modale de synchronisation Discord avec sélection */}
            {showDiscordSyncModal && (
              <DiscordSyncModal
                isOpen={showDiscordSyncModal}
                onClose={() => {
                  setShowDiscordSyncModal(false);
                  setDiscordSyncMembers([]);
                }}
                onSync={async (selectedMemberIds: string[]) => {
                  setDiscordSyncLoading(true);
                  try {
                    const response = await fetch("/api/discord/members/sync", {
                      method: "POST",
                      cache: 'no-store',
                      headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                      },
                      body: JSON.stringify({ selectedMemberIds }),
                    });
                    const data = await response.json();
                    if (data.success) {
                      const stats = data.stats || {};
                      alert(
                        `Synchronisation terminée !\n\n` +
                        `Membres sélectionnés : ${selectedMemberIds.length}\n` +
                        `Synchronisés : ${stats.synced || 0}\n` +
                        `Créés : ${stats.created || 0}\n` +
                        `Mis à jour : ${stats.updated || 0}\n` +
                        `Ignorés (modifications manuelles) : ${stats.skippedManual || 0}`
                      );
                      setShowDiscordSyncModal(false);
                      setDiscordSyncMembers([]);
                      await loadMembers();
                    } else {
                      alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                    }
                  } catch (error) {
                    console.error("Erreur lors de la synchronisation:", error);
                    alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                  } finally {
                    setDiscordSyncLoading(false);
                  }
                }}
                members={discordSyncMembers}
                loading={discordSyncLoading}
              />
            )}

            {currentAdmin?.isFounder && (
              <>
                <button
                  onClick={() => {
                    window.location.href = "/admin/fusion-doublons";
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  🔗 Gérer les doublons
                </button>
                <button
                  onClick={async () => {
                    if (!confirm("Voulez-vous sauvegarder toutes les données des membres de façon durable ?")) {
                      return;
                    }
                    try {
                      const response = await fetch("/api/admin/members/save-durable", {
                        method: "POST",
                      });
                      const data = await response.json();
                      if (data.success) {
                        alert(
                          `Sauvegarde réussie !\n\n` +
                          `Total: ${data.stats.total} membres\n` +
                          `Avec Discord: ${data.stats.withDiscord}\n` +
                          `Modifications manuelles: ${data.stats.withManualChanges}\n` +
                          `Avec description: ${data.stats.withDescription}\n\n` +
                          `Fichier: ${data.membersFile}\n` +
                          `Sauvegarde: ${data.backupFile}`
                        );
                      } else {
                        alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                      }
                    } catch (error) {
                      console.error("Erreur lors de la sauvegarde:", error);
                      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  💾 Sauvegarder données
                </button>
              </>
            )}
          </div>
        </div>

        {/* Encadré de statistiques des membres */}
        <div className="mb-6 bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👥</span>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Statistiques des membres</h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-300">
                <span>
                  <span className="text-white font-semibold">{members.length}</span> membre{members.length > 1 ? 's' : ''} au total
                </span>
                {members.length > 0 && (
                  <>
                    <span>
                      <span className="text-green-400 font-semibold">
                        {members.filter(m => m.statut === "Actif").length}
                      </span> actif{members.filter(m => m.statut === "Actif").length > 1 ? 's' : ''}
                    </span>
                    <span>
                      <span className="text-red-400 font-semibold">
                        {members.filter(m => m.statut === "Inactif").length}
                      </span> inactif{members.filter(m => m.statut === "Inactif").length > 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tableau des membres */}
        <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th 
                    className="text-left py-4 px-6 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("nom")}
                  >
                    <div className="flex items-center gap-2">
                      CRÉATEUR
                      {sortColumn === "nom" && (
                        <span className="text-purple-400">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  {viewMode === "complet" && (
                    <>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Pseudo Site</th>
                      <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ID Discord</th>
                    </>
                  )}
                  <th 
                    className="text-left py-4 px-6 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center gap-2">
                      RÔLE
                      {sortColumn === "role" && (
                        <span className="text-purple-400">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">STATUT</th>
                  <th 
                    className="text-left py-4 px-6 text-sm font-semibold text-gray-300 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("lastLive")}
                  >
                    <div className="flex items-center gap-2">
                      DERNIER LIVE
                      {sortColumn === "lastLive" && (
                        <span className="text-purple-400">
                          {sortDirection === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Raids TENF faits
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">
                    Raids reçus
                  </th>
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
                    <td className="py-4 px-6 text-gray-300 text-sm">
                      {formatLastLiveDate(member.lastLiveDate)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-semibold">
                        {member.raidsDone || 0}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-white font-semibold">
                        {member.raidsReceived || 0}
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
              discordId: selectedMember.discordId,
              twitch: selectedMember.twitch,
              description: selectedMember.description,
              notesInternes: selectedMember.description,
              badges: selectedMember.badges,
              isVip: selectedMember.isVip,
            }}
            onSave={handleSaveEdit}
          />
        )}

        {/* Modal de fusion de membres */}
        {showMergeModal && membersToMerge.length >= 2 && currentAdmin?.isFounder && (
          <MergeMemberModal
            isOpen={showMergeModal}
            onClose={() => {
              setShowMergeModal(false);
              setMembersToMerge([]);
              setCurrentDuplicateIndex(0);
            }}
            members={membersToMerge}
            allDuplicates={duplicates}
            currentDuplicateIndex={currentDuplicateIndex}
            onNextDuplicate={() => {
              if (currentDuplicateIndex < duplicates.length - 1) {
                const nextIndex = currentDuplicateIndex + 1;
                setCurrentDuplicateIndex(nextIndex);
                if (duplicates[nextIndex]?.members) {
                  setMembersToMerge(duplicates[nextIndex].members);
                }
              }
            }}
            onPreviousDuplicate={() => {
              if (currentDuplicateIndex > 0) {
                const prevIndex = currentDuplicateIndex - 1;
                setCurrentDuplicateIndex(prevIndex);
                if (duplicates[prevIndex]?.members) {
                  setMembersToMerge(duplicates[prevIndex].members);
                }
              }
            }}
            onMerge={async (mergedData) => {
              setMergeLoading(true);
              try {
                const response = await fetch("/api/admin/members/merge", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    membersToMerge: membersToMerge.map((m) => m.twitchLogin),
                    mergedData: mergedData,
                  }),
                });
                const data = await response.json();
                if (data.success) {
                  alert(
                    `Fusion réussie !\n\n` +
                    `Membre principal: ${data.primaryMember}\n` +
                    `Membres fusionnés: ${data.deletedMembers.join(", ")}`
                  );
                  
                  // Retirer le doublon fusionné de la liste
                  const updatedDuplicates = duplicates.filter((_, index) => index !== currentDuplicateIndex);
                  setDuplicates(updatedDuplicates);
                  
                  // Si il reste des doublons, passer au suivant, sinon fermer
                  if (updatedDuplicates.length > 0) {
                    if (currentDuplicateIndex >= updatedDuplicates.length) {
                      setCurrentDuplicateIndex(updatedDuplicates.length - 1);
                    }
                    setMembersToMerge(updatedDuplicates[Math.min(currentDuplicateIndex, updatedDuplicates.length - 1)].members);
                  } else {
                    setShowMergeModal(false);
                    setMembersToMerge([]);
                    setCurrentDuplicateIndex(0);
                  }
                  
                  await loadMembers();
                } else {
                  alert(`Erreur: ${data.error || "Erreur inconnue"}`);
                }
              } catch (error) {
                console.error("Erreur lors de la fusion:", error);
                alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
              } finally {
                setMergeLoading(false);
              }
            }}
            loading={mergeLoading}
          />
        )}
      </div>
    </div>
  );
}
