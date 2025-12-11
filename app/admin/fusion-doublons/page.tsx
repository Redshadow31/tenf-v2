"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import MergeMemberModal from "@/components/admin/MergeMemberModal";
import { getDiscordUser } from "@/lib/discord";
import { isFounder } from "@/lib/admin";

const navLinks = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/statistiques", label: "Statistiques Globales" },
  { href: "/admin/logs", label: "Logs" },
  { href: "/admin/fusion-doublons", label: "Fusion Doublons", active: true },
];

interface DuplicateGroup {
  key: string;
  type: "discordId" | "discordUsername";
  members: Array<{
    twitchLogin: string;
    displayName: string;
    discordId?: string;
    discordUsername?: string;
    twitchUrl: string;
    role: string;
    isVip: boolean;
    badges?: string[];
    description?: string;
    customBio?: string;
    siteUsername?: string;
    listId?: number;
    avatar?: string;
  }>;
}

export default function FusionDoublonsPage() {
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string; isFounder: boolean } | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [membersToMerge, setMembersToMerge] = useState<any[]>([]);
  const [currentDuplicateIndex, setCurrentDuplicateIndex] = useState(0);
  const [mergeLoading, setMergeLoading] = useState(false);

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
        window.location.href = "/auth/login?redirect=/admin/fusion-doublons";
      }
    }
    loadAdmin();
  }, []);

  useEffect(() => {
    if (currentAdmin !== null) {
      loadDuplicates();
    }
  }, [currentAdmin]);

  async function loadDuplicates() {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/members/merge");
      const data = await response.json();
      
      if (data.success) {
        setDuplicates(data.duplicates || []);
      } else {
        setError(data.error || "Erreur lors de la détection des doublons");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des doublons:", err);
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  const handleMerge = async (mergedData: any) => {
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
        
        // Recharger les doublons
        await loadDuplicates();
      } else {
        alert(`Erreur: ${data.error || "Erreur inconnue"}`);
      }
    } catch (error) {
      console.error("Erreur lors de la fusion:", error);
      alert(`Erreur: ${error instanceof Error ? error.message : "Erreur inconnue"}`);
    } finally {
      setMergeLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement des doublons...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        <AdminHeader title="Fusion des Doublons" navLinks={navLinks} />

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Doublons détectés
            </h2>
            <p className="text-gray-400">
              {duplicates.length} groupe(s) de doublons trouvé(s)
            </p>
          </div>
          <button
            onClick={loadDuplicates}
            className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            🔄 Actualiser
          </button>
        </div>

        {duplicates.length === 0 ? (
          <div className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 text-lg">Aucun doublon détecté !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div
                key={index}
                className="bg-[#1a1a1d] border border-gray-700 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Doublon {index + 1} - {duplicate.type === "discordId" ? "Même ID Discord" : "Même pseudo Discord"}
                    </h3>
                    <p className="text-sm text-gray-400">
                      Clé: {duplicate.key} ({duplicate.members.length} membres)
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentDuplicateIndex(index);
                      setMembersToMerge(duplicate.members);
                      setShowMergeModal(true);
                    }}
                    className="bg-[#9146ff] hover:bg-[#5a32b4] text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Fusionner
                  </button>
                </div>
                <div className="space-y-2">
                  {duplicate.members.map((member, memberIndex) => (
                    <div
                      key={memberIndex}
                      className="bg-[#0e0e10] border border-gray-700 rounded p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">{member.displayName}</div>
                          <div className="text-sm text-gray-400">
                            Discord: {member.discordUsername || member.discordId || "N/A"}
                          </div>
                          <div className="text-sm text-gray-400">
                            Twitch: {member.twitchLogin}
                          </div>
                          <div className="text-sm text-gray-400">
                            Rôle: {member.role}
                          </div>
                        </div>
                        <div className="text-right">
                          {member.isVip && (
                            <span className="px-2 py-1 rounded bg-[#9146ff] text-white text-xs font-semibold mr-2">
                              VIP
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            member.role === "Admin" || member.role === "Admin Adjoint"
                              ? "bg-[#9146ff] text-white"
                              : member.role === "Développement"
                              ? "bg-[#5a32b4] text-white"
                              : "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30"
                          }`}>
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de fusion */}
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
            onMerge={handleMerge}
            loading={mergeLoading}
          />
        )}
      </div>
    </div>
  );
}

