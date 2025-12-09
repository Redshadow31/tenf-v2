"use client";

import { useState } from "react";
import Link from "next/link";
import AddChannelModal from "@/components/admin/AddChannelModal";
import EditMemberModal from "@/components/admin/EditMemberModal";

type MemberRole = "Affilié" | "Développement" | "Staff" | "Mentor" | "Admin";
type MemberStatus = "Actif" | "Inactif";

interface Member {
  id: number;
  avatar: string;
  nom: string;
  role: MemberRole;
  statut: MemberStatus;
  discord: string;
  twitch: string;
  notesInternes?: string;
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
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddChannelModalOpen, setIsAddChannelModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [selectedMemberForNotes, setSelectedMemberForNotes] = useState<Member | null>(null);

  const filteredMembers = members.filter((member) =>
    member.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.twitch.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.discord.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleStatus = (memberId: number) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === memberId
          ? { ...member, statut: member.statut === "Actif" ? "Inactif" : "Actif" }
          : member
      )
    );
  };

  const handleEdit = (member: Member) => {
    setSelectedMember(member);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedMember: Member) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === updatedMember.id ? updatedMember : member
      )
    );
    setIsEditModalOpen(false);
    setSelectedMember(null);
  };

  const handleDelete = (memberId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
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

  return (
    <div className="min-h-screen bg-[#0e0e10] text-white">
      <div className="p-8">
        {/* Header avec navigation */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-purple-300">Gestion des Membres</h1>
            <button
              onClick={() => setIsAddChannelModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              AJOUTER UNE CHAÎNE
            </button>
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
                      <span className="text-white font-medium">{member.nom}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(
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
        onAdd={(newMember) => {
          setMembers((prev) => [...prev, { ...newMember, id: Date.now() }]);
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
