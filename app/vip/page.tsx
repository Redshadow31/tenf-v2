"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface VipMember {
  discordId: string;
  username: string;
  avatar: string;
  displayName: string;
  twitchLogin?: string;
  twitchUrl?: string;
  twitchAvatar?: string;
  vipBadge?: string;
  consecutiveMonths?: number;
}

export default function VipPage() {
  const [vipMembers, setVipMembers] = useState<VipMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVipMembers() {
      try {
        const response = await fetch("/api/vip-members", {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch VIP members");
        }
        const data = await response.json();
        
        // Les données sont déjà enrichies depuis l'API (avatars Twitch, etc.)
        setVipMembers(data.members || []);
      } catch (err) {
        console.error("Error fetching VIP members:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchVipMembers();
  }, []);

  if (loading) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl" style={{ color: 'var(--color-text)' }}>Chargement des VIP...</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-xl" style={{ color: '#ef4444' }}>Erreur: {error}</div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Titre */}
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>VIP du mois</h1>

        {/* Grille des VIP */}
        {vipMembers.length > 0 ? (
          <div className="grid grid-cols-5 gap-6">
            {vipMembers.map((member) => (
              <div
                key={member.discordId}
                className="flex flex-col items-center space-y-2 border p-4 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-border)';
                }}
              >
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={member.twitchAvatar || member.avatar}
                    alt={member.displayName}
                    className="w-20 h-20 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Fallback vers avatar Discord ou placeholder
                      if (member.avatar && member.avatar !== target.src) {
                        target.src = member.avatar;
                      } else {
                        target.src = `https://placehold.co/80x80?text=${member.displayName.charAt(0)}`;
                      }
                    }}
                  />
                  <div className="absolute -bottom-1 -right-1 rounded-full px-2 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--color-primary)' }}>
                    {member.vipBadge || "VIP"}
                  </div>
                </div>

                {/* Nom */}
                <h3 className="text-sm font-semibold text-center" style={{ color: 'var(--color-text)' }}>
                  {member.displayName}
                </h3>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg" style={{ color: 'var(--color-text-secondary)' }}>
              Aucun VIP Elite trouvé pour le moment.
            </p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Les membres VIP Elite sont gérés depuis le dashboard administrateur.
            </p>
          </div>
        )}

        {/* Boutons d'action */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <Link
            href="/vip/interviews"
            className="text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            Interviews vidéo
          </Link>
          <Link
            href="/vip/historique"
            className="text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            Historique
          </Link>
          <Link
            href="/vip/clips"
            className="text-white font-semibold py-4 px-6 rounded-lg text-center transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            }}
          >
            Clips
          </Link>
        </div>
      </div>
    </main>
  );
}
