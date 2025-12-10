"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";

export default function UserSidebar() {
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasAdminAccess, setHasAdminAccess] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      const user = await getDiscordUser();
      setDiscordUser(user);
      
      // Vérifier si l'utilisateur a accès au dashboard admin
      if (user) {
        try {
          const response = await fetch("/api/user/role", {
            cache: 'no-store',
          });
          if (response.ok) {
            const data = await response.json();
            console.log('UserSidebar - Role check result:', data);
            setHasAdminAccess(data.hasAdminAccess || false);
          } else {
            console.error('UserSidebar - Role check failed:', response.status, response.statusText);
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
      <aside className="w-64 bg-[#1a1a1d] border-r border-gray-700 p-6">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </aside>
    );
  }

  if (!discordUser) {
    return (
      <aside className="w-64 bg-[#1a1a1d] border-r border-gray-700 p-6">
        <div className="space-y-4">
          <h3 className="text-white font-semibold mb-4">Connexion</h3>
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
    <aside className="w-64 bg-[#1a1a1d] border-r border-gray-700 p-6">
      <div className="space-y-4">
        {/* Profil utilisateur */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
          {discordUser.avatar && (
            <img
              src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
              alt={discordUser.username}
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium truncate">{discordUser.username}</div>
            <div className="text-xs text-gray-400 truncate">@{discordUser.username}</div>
          </div>
        </div>

        {/* Menu utilisateur */}
        <nav className="space-y-2">
          <Link
            href="/membres/me"
            className="block rounded-lg bg-[#1a1a1d] hover:bg-[#252529] px-4 py-3 text-sm font-medium text-white transition-colors border border-gray-700"
          >
            Mon profil
          </Link>
          
          <Link
            href="/evaluation"
            className="block rounded-lg bg-[#1a1a1d] hover:bg-[#252529] px-4 py-3 text-sm font-medium text-white transition-colors border border-gray-700"
          >
            Mon évaluation
          </Link>

          {hasAdminAccess && (
            <Link
              href="/admin/dashboard"
              className="block rounded-lg bg-[#9146ff] hover:bg-[#5a32b4] px-4 py-3 text-sm font-semibold text-white transition-colors"
            >
              Dashboard Admin
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-gray-700 hover:bg-gray-600 px-4 py-3 text-sm font-medium text-white transition-colors"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </aside>
  );
}

