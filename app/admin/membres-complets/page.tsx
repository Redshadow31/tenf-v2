"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser } from "@/lib/discord";
import { logAction } from "@/lib/logAction";
import EditMemberCompletModal from "@/components/admin/EditMemberCompletModal";

interface MemberData {
  twitchLogin: string;
  twitchUrl: string;
  discordId?: string;
  discordUsername?: string;
  displayName: string;
  siteUsername?: string; // Pseudo choisi sur le site
  role: string;
  isVip: boolean;
  isActive: boolean;
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
  { href: "/admin/membres", label: "Gestion des Membres" },
  { href: "/admin/membres-complets", label: "Gestion Complète Membres", active: true },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/spotlight", label: "Gestion Spotlight" },
  { href: "/admin/logs", label: "Logs Administratifs" },
];

export default function MembresCompletsPage() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; username: string } | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadAdmin() {
      const user = await getDiscordUser();
      if (user) {
        setCurrentAdmin({ id: user.id, username: user.username });
      }
    }
    loadAdmin();
    fetchMembers();
  }, []);

  async function fetchMembers() {
    try {
      const response = await fetch("/api/admin/members", {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        if (response.status === 403) {
          setError("Accès refusé. Cette page est réservée aux fondateurs.");
        } else {
          setError("Erreur lors du chargement des membres");
        }
        return;
      }
      const data = await response.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("Erreur lors du chargement des membres");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(member: MemberData) {
    if (!currentAdmin) {
      alert("Vous devez être connecté");
      return;
    }

    try {
      const response = await fetch("/api/admin/members", {
        method: "PUT",
        cache: 'no-store',
        headers: {
          "Content-Type": "application/json",
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(member),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
        return;
      }

      await fetchMembers();
      setIsEditModalOpen(false);
      setSelectedMember(null);
    } catch (err) {
      console.error("Error saving member:", err);
      alert("Erreur lors de la sauvegarde");
    }
  }

  const filteredMembers = members.filter((member) =>
    member.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.twitchLogin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (member.discordUsername && member.discordUsername.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-white text-xl">Chargement...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-white p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-[#9146ff] to-[#5a32b4]">
              <span className="text-lg font-bold text-white">T</span>
            </div>
            <h1 className="text-4xl font-bold text-white">Gestion Complète des Membres</h1>
          </div>
          <div className="flex flex-wrap gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  link.active
                    ? "bg-[#9146ff] text-white"
                    : "bg-[#1a1a1d] text-gray-300 hover:bg-[#252529] hover:text-white border border-[#2a2a2d]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Barre de recherche et actions */}
        <div className="mb-6 flex items-center gap-4">
          <input
            type="text"
            placeholder="Rechercher un membre (nom, Twitch, Discord)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 max-w-md bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#9146ff]"
          />
          <button
            onClick={async () => {
              if (!currentAdmin) {
                alert("Vous devez être connecté");
                return;
              }
              try {
                const response = await fetch("/api/admin/members/sync-twitch", {
                  method: "POST",
                });
                const data = await response.json();
                if (data.success) {
                  alert(`Synchronisation terminée : ${data.synced}/${data.total} membres synchronisés`);
                  await fetchMembers();
                } else {
                  alert(`Erreur: ${data.error}`);
                }
              } catch (err) {
                console.error("Error syncing:", err);
                alert("Erreur lors de la synchronisation");
              }
            }}
            className="bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            🔄 Synchroniser Twitch
          </button>
        </div>

        {/* Tableau des membres */}
        <div className="bg-[#1a1a1d] border border-[#2a2a2d] rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2a2a2d]">
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Avatar</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Pseudo Site</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Pseudo Discord</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">ID Discord</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Chaîne Twitch</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Rôle</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">VIP</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Statut</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Live</th>
                  <th className="text-left py-4 px-6 text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.twitchLogin}
                    className="border-b border-[#2a2a2d] hover:bg-[#0e0e10] transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4]"></div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-white">{member.siteUsername || member.displayName}</div>
                      {member.description && (
                        <div className="text-xs text-gray-400 mt-1">{member.description}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {member.discordUsername || "-"}
                    </td>
                    <td className="py-4 px-6">
                      <code className="text-xs text-gray-400 bg-[#0e0e10] px-2 py-1 rounded">
                        {member.discordId || "-"}
                      </code>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <a
                          href={member.twitchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#9146ff] hover:text-[#5a32b4] font-medium"
                        >
                          {member.twitchLogin}
                        </a>
                        <a
                          href={member.twitchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-300 mt-1 truncate max-w-xs"
                        >
                          {member.twitchUrl}
                        </a>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        member.role === "Fondateur" || member.role === "Admin"
                          ? "bg-[#9146ff] text-white"
                          : member.role === "Développement"
                          ? "bg-[#5a32b4] text-white"
                          : "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30"
                      }`}>
                        {member.role}
                      </span>
                    </td>
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
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        member.isActive
                          ? "bg-green-900/30 text-green-300"
                          : "bg-red-900/30 text-red-300"
                      }`}>
                        {member.isActive ? "Actif" : "Inactif"}
                      </span>
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
                    <td className="py-4 px-6">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setIsEditModalOpen(true);
                        }}
                        className="bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal d'édition */}
        {isEditModalOpen && selectedMember && (
          <EditMemberCompletModal
            member={selectedMember}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedMember(null);
            }}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
}

