"use client";

import React, { useState, useEffect } from "react";
import MemberModal from "@/components/MemberModal";
import { getRoleBadgeStyles } from "@/lib/roleColors";
import MembersDiscoveryNote from "@/components/MembersDiscoveryNote";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

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

  // Debounce de la recherche (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fonction pour déterminer si un membre appartient à la catégorie "Staff"
  const isStaffCategory = (role: string): boolean => {
    return role === "Admin" || role === "Admin Adjoint" || role === "Mentor" || role === "Modérateur Junior";
  };

  // Fonction pour obtenir l'ordre de tri des rôles Staff
  const getStaffRoleOrder = (role: string): number => {
    switch (role) {
      case "Admin": return 1;
      case "Admin Adjoint": return 2;
      case "Mentor": return 3;
      case "Modérateur Junior": return 4;
      default: return 999;
    }
  };

  // Fonction de normalisation pour la recherche (insensible à la casse et aux accents)
  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return "";
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const getFilteredMembers = () => {
    let filtered = activeMembers;

    // Appliquer le filtre de rôle d'abord
    if (activeFilter !== "Tous") {
      if (activeFilter === "Staff") {
        filtered = filtered.filter((member) => isStaffCategory(member.role));
      } else {
        const filterMap: Record<string, string> = {
          Développement: "Développement",
          Affiliés: "Affilié",
        };
        filtered = filtered.filter((member) => {
          return member.role === filterMap[activeFilter];
        });
      }
    }

    // Appliquer la recherche (si présente)
    if (debouncedSearchQuery.trim().length > 0) {
      const normalizedQuery = normalizeText(debouncedSearchQuery);
      filtered = filtered.filter((member) => {
        const normalizedTwitch = normalizeText(member.twitchLogin);
        const normalizedDisplayName = normalizeText(member.displayName);
        const normalizedDiscord = normalizeText(member.discordUsername);

        return (
          normalizedTwitch.includes(normalizedQuery) ||
          normalizedDisplayName.includes(normalizedQuery) ||
          (normalizedDiscord && normalizedDiscord.includes(normalizedQuery))
        );
      });
    }

    // Trier les résultats
    return filtered.sort((a, b) => {
      const aIsStaff = isStaffCategory(a.role);
      const bIsStaff = isStaffCategory(b.role);
      
      if (aIsStaff && bIsStaff) {
        return getStaffRoleOrder(a.role) - getStaffRoleOrder(b.role);
      }
      if (aIsStaff && !bIsStaff) return -1;
      if (!aIsStaff && bIsStaff) return 1;
      return 0;
    });
  };

  // Utiliser la fonction utilitaire pour les couleurs de rôles
  const getBadgeColor = (role: string) => getRoleBadgeStyles(role);

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
      twitchUrl: `https://www.twitch.tv/${member.twitchLogin}`,
      discordId: member.discordId,
      isVip: member.isVip,
      vipBadge: member.vipBadge,
      badges: member.badges || [],
    });
    setIsModalOpen(true);
  };

  const filteredMembers = getFilteredMembers();

  return (
    <div className="space-y-8">
      {/* Titre de page */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Membres Actifs</h1>
      </div>

      {/* Encart encourageant */}
      <MembersDiscoveryNote />

      {/* Barre de recherche */}
      <div className="relative">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-gray-400 group-focus-within:text-[#9146ff] transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un membre (Twitch ou Discord)…"
            className="w-full pl-10 pr-10 py-3 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#9146ff]/50 placeholder-gray-500"
            style={{
              backgroundColor: 'var(--color-card)',
              borderColor: searchQuery ? 'var(--color-primary)' : 'var(--color-border)',
              color: 'var(--color-text)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.matches(':focus')) {
                e.currentTarget.style.borderColor = 'rgba(145, 70, 255, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.matches(':focus') && !searchQuery) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(145, 70, 255, 0.1)';
            }}
            onBlur={(e) => {
              if (!searchQuery) {
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearchQuery("");
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-[#9146ff] transition-colors"
              aria-label="Réinitialiser la recherche"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {debouncedSearchQuery && (
          <div className="mt-2 text-xs flex items-center gap-2" style={{ color: 'var(--color-text-secondary)' }}>
            {filteredMembers.length === 0 ? (
              <span>
                Aucun membre trouvé pour &quot;{debouncedSearchQuery}&quot;.
              </span>
            ) : (
              <span>
                {filteredMembers.length} {filteredMembers.length > 1 ? "membres trouvés" : "membre trouvé"}
                {activeFilter !== "Tous" && " (filtré par " + activeFilter + ")"}
              </span>
            )}
          </div>
        )}
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
      ) : filteredMembers.length === 0 && debouncedSearchQuery.trim().length > 0 ? (
        <div className="text-center py-12">
          <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
            Aucun membre trouvé pour &quot;{debouncedSearchQuery}&quot;.
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
            Essayez avec un autre terme de recherche.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setDebouncedSearchQuery("");
            }}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 lg:grid-cols-8">
          {filteredMembers.map((member) => {
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
