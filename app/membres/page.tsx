"use client";

import React, { useState, useEffect } from "react";
import MemberModal from "@/components/MemberModal";

const filters = ["Tous", "Développement", "Affiliés", "Staff"];

interface PublicMember {
  twitchLogin: string;
  twitchUrl: string;
  displayName: string;
  role: string;
  isVip: boolean;
  vipBadge?: string;
  badges?: string[];
  discordId?: string;
  discordUsername?: string;
  avatar?: string;
  description?: string;
}

export default function Page() {
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMembers, setActiveMembers] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les membres depuis l'API publique
  useEffect(() => {
    async function loadMembers() {
      try {
        // Désactiver le cache pour toujours récupérer les données les plus récentes
        const response = await fetch("/api/members/public", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setActiveMembers(data.members || []);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des membres:", error);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, []);

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
      return member.role === filterMap[activeFilter];
    });
  };

  const getBadgeColor = (role: string): { bg: string; text: string; border?: string } => {
    switch (role) {
      case "Staff":
        return { bg: 'var(--color-primary)', text: 'white' };
      case "Développement":
        return { bg: 'var(--color-primary-dark)', text: 'white' };
      case "Affilié":
        return { bg: 'var(--color-accent-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' };
      case "Mentor":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Admin":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Admin Adjoint":
        return { bg: 'var(--color-text-secondary)', text: 'white' };
      case "Créateur Junior":
        return { bg: 'var(--color-accent-light)', text: 'var(--color-primary)', border: 'var(--color-primary)' };
      default:
        return { bg: 'var(--color-text-secondary)', text: 'white' };
    }
  };

  const handleMemberClick = (member: PublicMember) => {
    // Utiliser l'avatar déjà récupéré depuis l'API (pas besoin d'appel supplémentaire)
    const avatar = member.avatar || `https://placehold.co/64x64?text=${member.displayName.charAt(0)}`;
    
    setSelectedMember({
      id: member.twitchLogin,
      name: member.displayName,
      role: member.role,
      avatar: avatar,
      twitchLogin: member.twitchLogin,
      description: member.description || `Membre ${member.role} de la communauté TENF.`,
      twitchUrl: member.twitchUrl,
      discordId: member.discordId,
      isVip: member.isVip,
      vipBadge: member.vipBadge,
      badges: member.badges || [],
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Titre de page */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Membres Actifs</h1>
      </div>

      {/* Barre de filtres */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-all border text-white"
            style={{
              backgroundColor: activeFilter === filter ? 'var(--color-primary)' : 'var(--color-card)',
              borderColor: activeFilter === filter ? 'transparent' : 'var(--color-border)',
            }}
            onMouseEnter={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.borderColor = 'var(--color-primary)';
                e.currentTarget.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              if (activeFilter !== filter) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Grille de membres */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-primary)' }}></div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-8">
          {getFilteredMembers().map((member) => {
            return (
              <div
                key={member.twitchLogin}
                onClick={() => handleMemberClick(member)}
                className="card flex cursor-pointer flex-col items-center space-y-4 border p-4 text-center transition-transform hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
              >
                {/* Avatar avec badge VIP */}
                <div className="relative">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.displayName}
                      className="h-16 w-16 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-lg ${member.avatar ? 'hidden' : ''}`}
                    style={{ background: 'linear-gradient(to bottom right, var(--color-primary), var(--color-primary-dark))' }}
                  >
                    {member.displayName.charAt(0).toUpperCase()}
                  </div>
                  {member.isVip && (
                    <div className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                      {member.vipBadge || "VIP"}
                    </div>
                  )}
                </div>

                {/* Pseudo */}
                <div>
                  <h3 className="text-sm font-semibold truncate w-full" style={{ color: 'var(--color-text)' }}>{member.displayName}</h3>
                </div>

                {/* Badge rôle */}
                <span
                  className="rounded-lg px-2 py-1 text-xs font-bold"
                  style={{
                    backgroundColor: getBadgeColor(member.role).bg,
                    color: getBadgeColor(member.role).text,
                    border: getBadgeColor(member.role).border ? `1px solid ${getBadgeColor(member.role).border}` : 'none',
                  }}
                >
                  {member.role}
                </span>
              </div>
            );
          })}
        </div>
      )}

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
