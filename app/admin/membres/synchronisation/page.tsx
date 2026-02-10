"use client";

import { useState, useEffect } from "react";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";
import Link from "next/link";
import EditMemberModal from "@/components/admin/EditMemberModal";

interface Member {
  twitchLogin: string;
  displayName: string;
  discordUsername?: string;
  discordId?: string;
  twitchId?: string;
  twitchUrl?: string;
  role: string;
  isActive: boolean;
  updatedAt?: string;
}

interface SyncStatus {
  member: Member;
  discordStatus: "ok" | "partial" | "error" | "missing";
  twitchStatus: "ok" | "partial" | "error" | "missing";
  lastSync?: string;
  issues: string[];
}

export default function SynchronisationMembresPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<SyncStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [syncing, setSyncing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: number;
    avatar: string;
    nom: string;
    role: "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" | "Communauté";
    statut: "Actif" | "Inactif";
    discord: string;
    discordId?: string;
    twitch: string;
    twitchId?: string;
    notesInternes?: string;
    description?: string;
    badges?: string[];
    isVip?: boolean;
    createdAt?: string;
    integrationDate?: string;
    parrain?: string;
    roleHistory?: Array<{
      fromRole: string;
      toRole: string;
      changedAt: string;
      changedBy: string;
      reason?: string;
    }>;
  } | null>(null);

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
          
          const isAdminRole = roleData.role === "Admin";
          const isAdminAdjoint = roleData.role === "Admin Adjoint";
          const founderStatus = isFounder(user.id);
          
          setCurrentAdmin({ 
            id: user.id, 
            username: user.username, 
            isFounder: founderStatus || isAdminRole || isAdminAdjoint 
          });
        } catch (err) {
          const founderStatus = isFounder(user.id);
          if (!founderStatus) {
            window.location.href = "/unauthorized";
            return;
          }
          setCurrentAdmin({ id: user.id, username: user.username, isFounder: founderStatus });
        }
      } else {
        window.location.href = "/auth/login?redirect=/admin/membres/synchronisation";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin !== null) {
      loadMembersAndSyncStatus();
    }
  }, [currentAdmin]);

  async function loadMembersAndSyncStatus() {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!response.ok) {
        console.error("Erreur lors du chargement des membres");
        return;
      }

      const data = await response.json();
      const membersData: Member[] = data.members || [];
      setMembers(membersData);

      // Analyser le statut de synchronisation
      const statuses: SyncStatus[] = [];

      for (const member of membersData) {
        const issues: string[] = [];
        let discordStatus: "ok" | "partial" | "error" | "missing" = "ok";
        let twitchStatus: "ok" | "partial" | "error" | "missing" = "ok";

        // Vérifier Discord
        if (!member.discordId) {
          discordStatus = "missing";
          issues.push("ID Discord manquant");
        } else if (!member.discordUsername) {
          discordStatus = "partial";
          issues.push("Nom d'utilisateur Discord manquant");
        } else {
          discordStatus = "ok";
        }

        // Vérifier Twitch
        if (!member.twitchLogin) {
          twitchStatus = "missing";
          issues.push("Login Twitch manquant");
        } else if (!member.twitchId) {
          twitchStatus = "partial";
          issues.push("ID Twitch manquant");
        } else {
          twitchStatus = "ok";
        }

        // Vérifier la dernière mise à jour
        let lastSync: string | undefined = undefined;
        if (member.updatedAt) {
          lastSync = member.updatedAt;
        }

        statuses.push({
          member,
          discordStatus,
          twitchStatus,
          lastSync,
          issues,
        });
      }

      setSyncStatuses(statuses);
    } catch (error) {
      console.error("Erreur lors de l'analyse de la synchronisation:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncTwitch() {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent synchroniser");
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/admin/members/sync-twitch", {
        method: "POST",
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
        return;
      }

      const data = await response.json();
      alert(`Synchronisation Twitch terminée: ${data.synced || 0} membres synchronisés`);
      await loadMembersAndSyncStatus();
    } catch (error) {
      console.error("Erreur lors de la synchronisation:", error);
      alert("Erreur lors de la synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncDiscordUsernames() {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent synchroniser");
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/admin/members/sync-discord-usernames", {
        method: "POST",
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error || "Erreur inconnue"}`);
        return;
      }

      const data = await response.json();
      const message = `Synchronisation Discord terminée: ${data.synced || 0} pseudo(s) Discord mis à jour${data.notFound ? `, ${data.notFound} non trouvé(s) sur Discord` : ''}`;
      alert(message);
      await loadMembersAndSyncStatus();
    } catch (error) {
      console.error("Erreur lors de la synchronisation Discord:", error);
      alert("Erreur lors de la synchronisation Discord");
    } finally {
      setSyncing(false);
    }
  }

  const handleEdit = async (status: SyncStatus) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }

    try {
      // Récupérer les données complètes du membre depuis l'API
      const memberResponse = await fetch(
        `/api/admin/members?twitchLogin=${encodeURIComponent(status.member.twitchLogin || status.member.displayName)}`,
        {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        }
      );

      let fullMemberData: any = status.member;
      if (memberResponse.ok) {
        const memberData = await memberResponse.json();
        if (memberData.member) {
          fullMemberData = memberData.member;
        }
      }

      // Récupérer l'avatar depuis l'API publique
      let avatar = `https://placehold.co/64x64?text=${(fullMemberData.displayName || fullMemberData.twitchLogin).charAt(0).toUpperCase()}`;
      
      if (fullMemberData.twitchLogin) {
        try {
          const publicResponse = await fetch("/api/members/public", {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          });
          if (publicResponse.ok) {
            const publicData = await publicResponse.json();
            const publicMember = publicData.members?.find((m: any) => 
              m.twitchLogin?.toLowerCase() === fullMemberData.twitchLogin?.toLowerCase()
            );
            if (publicMember?.avatar) {
              avatar = publicMember.avatar;
            }
          }
        } catch (err) {
          console.warn("Erreur lors de la récupération de l'avatar:", err);
        }
      }

      // Fallback Discord avatar si disponible
      if (!avatar && fullMemberData.discordId) {
        avatar = `https://cdn.discordapp.com/embed/avatars/${parseInt(fullMemberData.discordId) % 5}.png`;
      }

      // Convertir les données vers le format attendu par EditMemberModal
      const memberForModal = {
        id: 0, // Pas utilisé dans la synchronisation
        avatar,
        nom: fullMemberData.displayName || fullMemberData.twitchLogin,
        role: ((fullMemberData.role as any) || "Affilié") as "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" | "Communauté",
        statut: (fullMemberData.isActive ? "Actif" : "Inactif") as "Actif" | "Inactif",
        discord: fullMemberData.discordUsername || "",
        discordId: fullMemberData.discordId,
        twitch: fullMemberData.twitchLogin || "",
        twitchId: fullMemberData.twitchId,
        description: fullMemberData.description,
        notesInternes: fullMemberData.notesInternes || fullMemberData.description,
        badges: fullMemberData.badges || [],
        isVip: fullMemberData.isVip || false,
        createdAt: fullMemberData.createdAt,
        integrationDate: fullMemberData.integrationDate,
        roleHistory: fullMemberData.roleHistory || [],
        parrain: fullMemberData.parrain,
      };

      setSelectedMember(memberForModal);
      setIsEditModalOpen(true);
    } catch (error) {
      console.error("Erreur lors de l'ouverture du modal:", error);
      alert("Erreur lors de l'ouverture du modal");
    }
  };

  const handleSaveEdit = async (updatedMember: {
    id: number;
    avatar: string;
    nom: string;
    role: "Affilié" | "Développement" | "Modérateur Junior" | "Mentor" | "Admin" | "Admin Adjoint" | "Créateur Junior" | "Communauté";
    statut: "Actif" | "Inactif";
    discord: string;
    discordId?: string;
    twitch: string;
    twitchId?: string;
    notesInternes?: string;
    description?: string;
    badges?: string[];
    isVip?: boolean;
    createdAt?: string;
    integrationDate?: string;
    parrain?: string;
    roleHistory?: Array<{
      fromRole: string;
      toRole: string;
      changedAt: string;
      changedBy: string;
      reason?: string;
    }>;
    roleChangeReason?: string;
  }) => {
    if (!currentAdmin?.isFounder) {
      alert("Seuls les fondateurs peuvent modifier les membres");
      return;
    }

    if (!selectedMember) return;

    // Trouver le membre original dans la liste (utiliser selectedMember.twitch qui est le pseudo actuel avant modification)
    const originalTwitchLogin = selectedMember.twitch;
    const oldMember = members.find((m) => 
      m.twitchLogin === originalTwitchLogin || 
      m.discordId === selectedMember.discordId
    );
    if (!oldMember) {
      alert("Membre original non trouvé dans la liste");
      return;
    }

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
          twitchLogin: updatedMember.twitch, // Nouveau pseudo (peut avoir changé)
          twitchId: updatedMember.twitchId, // Inclure l'ID Twitch
          displayName: updatedMember.nom,
          twitchUrl: updatedMember.twitch ? `https://www.twitch.tv/${updatedMember.twitch}` : undefined,
          discordId: updatedMember.discordId,
          discordUsername: updatedMember.discord,
          role: updatedMember.role,
          isActive: updatedMember.statut === "Actif",
          isVip: updatedMember.isVip || false,
          badges: updatedMember.badges || [],
          description: updatedMember.description,
          createdAt: updatedMember.createdAt,
          integrationDate: updatedMember.integrationDate,
          parrain: updatedMember.parrain,
          roleChangeReason: updatedMember.roleChangeReason,
          // Identifiants stables pour identifier le membre (important si le pseudo change)
          originalDiscordId: oldMember.discordId, // ID Discord original (stable)
          originalTwitchId: oldMember.twitchId, // ID Twitch original (stable)
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
            target: updatedMember.nom,
            details: {
              oldData: {
                nom: oldMember.displayName || oldMember.twitchLogin,
                role: oldMember.role,
                isActive: oldMember.isActive,
                discord: oldMember.discordUsername,
                twitch: oldMember.twitchLogin,
              },
              newData: {
                nom: updatedMember.nom,
                role: updatedMember.role,
                isActive: updatedMember.statut === "Actif",
                discord: updatedMember.discord,
                twitch: updatedMember.twitch,
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
      
      // Recharger les données depuis la base de données
      await loadMembersAndSyncStatus();
    } catch (error) {
      console.error("Erreur lors de la modification:", error);
      alert(`Erreur : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    }
  };

  const filteredStatuses = filterStatus === "all"
    ? syncStatuses
    : syncStatuses.filter(status => {
        if (filterStatus === "ok") {
          return status.discordStatus === "ok" && status.twitchStatus === "ok";
        }
        if (filterStatus === "partial") {
          return status.discordStatus === "partial" || status.twitchStatus === "partial";
        }
        if (filterStatus === "error") {
          return status.discordStatus === "error" || status.twitchStatus === "error";
        }
        if (filterStatus === "missing") {
          return status.discordStatus === "missing" || status.twitchStatus === "missing";
        }
        return true;
      });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "partial":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "error":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      case "missing":
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ok":
        return "✅";
      case "partial":
        return "⚠️";
      case "error":
        return "❌";
      case "missing":
        return "➖";
      default:
        return "❓";
    }
  };

  const formatLastSync = (dateString?: string) => {
    if (!dateString) return "Jamais";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
      } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
      } else {
        return "Récemment";
      }
    } catch {
      return "Inconnu";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9146ff] mx-auto mb-4"></div>
          <p className="text-gray-400">Analyse de la synchronisation...</p>
        </div>
      </div>
    );
  }

  const okCount = syncStatuses.filter(s => s.discordStatus === "ok" && s.twitchStatus === "ok").length;
  const partialCount = syncStatuses.filter(s => s.discordStatus === "partial" || s.twitchStatus === "partial").length;
  const missingCount = syncStatuses.filter(s => s.discordStatus === "missing" || s.twitchStatus === "missing").length;

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <div className="mb-6">
          <Link 
            href="/admin/membres" 
            className="text-[#9146ff] hover:text-[#5a32b4] mb-4 inline-block"
          >
            ← Retour au hub Membres
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Synchronisation</h1>
            <p className="text-gray-400">État des synchronisations Discord / Twitch</p>
          </div>
          {currentAdmin?.isFounder && (
            <div className="flex gap-3">
              <button
                onClick={handleSyncDiscordUsernames}
                disabled={syncing}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {syncing ? "⏳ Synchronisation..." : "🔄 Synchroniser Discord"}
              </button>
              <button
                onClick={handleSyncTwitch}
                disabled={syncing}
                className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
              >
                {syncing ? "⏳ Synchronisation..." : "🔄 Synchroniser Twitch"}
              </button>
            </div>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{okCount}</div>
            <div className="text-sm text-gray-400">Synchronisés (OK)</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">{partialCount}</div>
            <div className="text-sm text-gray-400">Partiels</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-400">{missingCount}</div>
            <div className="text-sm text-gray-400">Manquants</div>
          </div>
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-white">{syncStatuses.length}</div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === "all"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            Tous ({syncStatuses.length})
          </button>
          <button
            onClick={() => setFilterStatus("ok")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === "ok"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            ✅ OK ({okCount})
          </button>
          <button
            onClick={() => setFilterStatus("partial")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === "partial"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            ⚠️ Partiels ({partialCount})
          </button>
          <button
            onClick={() => setFilterStatus("missing")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === "missing"
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] border border-gray-700 text-gray-300 hover:border-[#9146ff]"
            }`}
          >
            ➖ Manquants ({missingCount})
          </button>
        </div>

        {/* Liste des statuts */}
        {filteredStatuses.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">✅</div>
            <div className="text-xl font-semibold text-white mb-2">Aucun résultat</div>
            <div className="text-gray-400">Aucun membre ne correspond aux filtres sélectionnés.</div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredStatuses.map((status, index) => (
              <div
                key={index}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {status.member.displayName || status.member.twitchLogin}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Discord</div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status.discordStatus)}`}>
                          {getStatusIcon(status.discordStatus)} {status.discordStatus}
                        </div>
                        {status.member.discordUsername && (
                          <div className="text-xs text-gray-400 mt-1">
                            {status.member.discordUsername}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Twitch</div>
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(status.twitchStatus)}`}>
                          {getStatusIcon(status.twitchStatus)} {status.twitchStatus}
                        </div>
                        {status.member.twitchLogin && (
                          <div className="text-xs text-gray-400 mt-1">
                            {status.member.twitchLogin}
                          </div>
                        )}
                      </div>
                    </div>
                    {status.issues.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-2">Problèmes détectés:</div>
                        <ul className="list-disc list-inside text-sm text-yellow-300">
                          {status.issues.map((issue, idx) => (
                            <li key={idx}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Dernière sync: {formatLastSync(status.lastSync)}
                    </div>
                    {currentAdmin?.isFounder && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleEdit(status)}
                          className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
                        >
                          Modifier le profil
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal d'édition (pour les fondateurs) */}
        {isEditModalOpen && selectedMember && currentAdmin?.isFounder && (
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
    </div>
  );
}

