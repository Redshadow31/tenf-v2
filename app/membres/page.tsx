"use client";

import React, { useState } from "react";
import MemberModal from "@/components/MemberModal";
import { getActiveMembers, getMemberRole } from "@/lib/memberRoles";
import { getTwitchUser } from "@/lib/twitch";

const filters = ["Tous", "Développement", "Affiliés", "Staff"];

export default function Page() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Récupérer tous les membres actifs
  const activeMembers = getActiveMembers();

  const getFilteredMembers = () => {
    if (activeFilter === "Tous") {
      return activeMembers;
    }
    const filterMap: Record<string, string> = {
      Développement: "Développement",
      Affiliés: "Affilié",
      Staff: "Staff",
    };
    return activeMembers.filter((member) => {
      const role = getMemberRole(member.twitchLogin);
      return role.role === filterMap[activeFilter];
    });
  };

  const getBadgeColor = (role: string) => {
    switch (role) {
      case "Staff":
        return "bg-[#9146ff] text-white";
      case "Développement":
        return "bg-[#5a32b4] text-white";
      case "Affilié":
        return "bg-[#9146ff]/20 text-[#9146ff] border border-[#9146ff]/30";
      case "Mentor":
        return "bg-gray-700 text-white";
      case "Admin":
        return "bg-gray-700 text-white";
      default:
        return "bg-gray-700 text-white";
    }
  };

  const handleMemberClick = async (member: typeof activeMembers[0]) => {
    const role = getMemberRole(member.twitchLogin);
    const twitchUser = await getTwitchUser(member.twitchLogin);
    
    setSelectedMember({
      id: member.twitchLogin,
      name: member.displayName,
      role: role.role,
      avatar: twitchUser.profile_image_url,
      twitchLogin: member.twitchLogin,
      description: `Membre ${role.role} de la communauté TENF.`,
      twitchUrl: member.twitchUrl,
      isVip: role.isVip,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Titre de page */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-white">Membres Actifs</h1>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeFilter === filter
                ? "bg-[#9146ff] text-white"
                : "bg-[#1a1a1d] text-white border border-gray-700 hover:border-[#9146ff]/50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Grille de membres */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-8">
        {getFilteredMembers().map((member) => {
          const role = getMemberRole(member.twitchLogin);
          return (
            <div
              key={member.twitchLogin}
              onClick={() => handleMemberClick(member)}
              className="card flex cursor-pointer flex-col items-center space-y-4 bg-[#1a1a1d] border border-gray-700 p-4 text-center transition-transform hover:scale-[1.02]"
            >
              {/* Avatar avec badge VIP */}
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#9146ff] to-[#5a32b4]"></div>
                {role.isVip && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-[#9146ff] px-2 py-0.5 text-xs font-bold text-white">
                    VIP
                  </div>
                )}
              </div>

              {/* Pseudo */}
              <div>
                <h3 className="text-sm font-semibold text-white truncate w-full">{member.displayName}</h3>
              </div>

              {/* Badge rôle */}
              <span
                className={`rounded-lg px-2 py-1 text-xs font-bold ${getBadgeColor(
                  role.role
                )}`}
              >
                {role.role}
              </span>
            </div>
          );
        })}
      </div>

      {/* Modal membre */}
      {selectedMember && (
        <MemberModal
          member={selectedMember}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMember(null);
          }}
          isAdmin={false}
        />
      )}
    </div>
  );
}
