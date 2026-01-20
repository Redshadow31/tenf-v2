"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";

export default function UserSidebar() {
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [hasAcademyAccess, setHasAcademyAccess] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const user = await getDiscordUser();
      setDiscordUser(user);
      
      // Vérifier si l'utilisateur a accès au dashboard admin et à l'Academy
      if (user) {
        try {
          const [roleResponse, academyResponse] = await Promise.all([
            fetch("/api/user/role", { cache: 'no-store' }),
            fetch("/api/academy/check-access", { cache: 'no-store' }).catch(() => ({ ok: false })),
          ]);
          
          if (roleResponse.ok) {
            const data = await roleResponse.json();
            console.log('UserSidebar - Role check result:', data);
            setHasAdminAccess(data.hasAdminAccess || false);
          } else {
            console.error('UserSidebar - Role check failed:', roleResponse.status, roleResponse.statusText);
          }
          
          if (academyResponse.ok) {
            const academyData = await academyResponse.json();
            setHasAcademyAccess(academyData.hasAccess || false);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
      
      setLoading(false);
    }
    fetchUser();
  }, []);

  const handleDiscordLogin = () => {
    loginWithDiscord();
  };

  const handleLogout = async () => {
    await logoutDiscord();
    setDiscordUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return (
      <aside className="w-64 border-r p-6" style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}>
        <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Chargement...</div>
      </aside>
    );
  }

  if (!discordUser) {
    return (
      <aside className="w-64 border-r p-6" style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}>
        <div className="space-y-4">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--color-text)' }}>Connexion</h3>
          <button
            onClick={handleDiscordLogin}
            className="w-full rounded-lg bg-[#5865F2] hover:bg-[#4752C4] px-4 py-2 text-sm font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            <span>Se connecter avec Discord</span>
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r p-6" style={{ backgroundColor: 'var(--color-sidebar-bg)', borderColor: 'var(--color-sidebar-border)' }}>
      <div className="space-y-4">
        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {discordUser.avatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
              alt={discordUser.username}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate" style={{ color: 'var(--color-text)' }}>{discordUser.username}</div>
            <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>@{discordUser.username}</div>
          </div>
        </div>

        {/* Menu utilisateur */}
        <nav className="space-y-2">
          <Link
            href="/membres/me"
            className="block rounded-lg px-4 py-3 text-sm font-medium transition-colors border"
            style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-card)';
            }}
          >
            Mon profil
          </Link>
          
          <Link
            href="/evaluation"
            className="block rounded-lg px-4 py-3 text-sm font-medium transition-colors border"
            style={{ 
              backgroundColor: 'var(--color-card)', 
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-card)';
            }}
          >
            Mon évaluation
          </Link>

          {/* Section TENF Academy */}
          <div className="space-y-1">
            <Link
              href="/academy"
              className="block rounded-lg px-4 py-3 text-sm font-medium transition-colors border"
              style={{ 
                backgroundColor: 'var(--color-card)', 
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-card)';
              }}
            >
              🎓 TENF Academy
            </Link>
            
            <Link
              href="/academy/access"
              className="block rounded-lg px-4 py-2 ml-4 text-xs font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--color-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }}
            >
              Entrer dans l'Academy
            </Link>
            
            {hasAcademyAccess && (
              <Link
                href="/academy/dashboard"
                className="block rounded-lg px-4 py-2 ml-4 text-xs font-medium transition-colors"
                style={{ color: 'var(--color-text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--color-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--color-text-secondary)';
                }}
              >
                Ma promo
              </Link>
            )}
          </div>

          {hasAdminAccess && (
            <Link
              href="/admin/dashboard"
              className="block rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-primary)';
              }}
            >
              Dashboard Admin
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: 'var(--color-text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </aside>
  );
}

