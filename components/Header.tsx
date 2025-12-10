"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";

const publicLinks = [
  { href: "/membres", label: "Membres" },
  { href: "/lives", label: "Lives" },
  { href: "/events", label: "Evènements" },
  { href: "/vip", label: "VIP" },
  { href: "/boutique", label: "Boutique" },
];

export default function Header() {
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const user = await getDiscordUser();
      setDiscordUser(user);
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

  const isAuthenticated = !!discordUser;

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0e0e10]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
        {/* Logo TENF */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-gradient-to-br from-[#9146ff] to-[#5a32b4]">
            <span className="text-lg font-bold text-white">T</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl text-white">TENF</span>
            <span className="text-xs text-gray-400">Plus qu'une communauté</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-200 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Boutons d'action */}
        <div className="flex items-center gap-3">
          {loading ? (
            <div className="text-gray-400 text-sm">Chargement...</div>
          ) : isAuthenticated ? (
            <>
              {/* Menu utilisateur connecté */}
              <div className="flex items-center gap-3">
                {discordUser?.avatar && (
                  <img
                    src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                    alt={discordUser.username}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-sm text-gray-300 hidden md:block">
                  {discordUser?.username}
                </span>
              </div>
              <Link
                href="/membres/me"
                className="rounded-lg bg-[#1a1a1d] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5 border border-gray-700"
              >
                Mon profil
              </Link>
              <Link
                href="/admin/dashboard"
                className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a32b4]"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              {/* Boutons de connexion */}
              <button
                onClick={() => console.log("Connexion Twitch - À implémenter")}
                className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a32b4]"
              >
                Connexion Twitch
              </button>
              <button
                onClick={handleDiscordLogin}
                className="rounded-lg bg-[#5865F2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752C4]"
              >
                Connexion Discord
              </button>
            </>
          )}
          <Link
            href="https://discord.gg/tenf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5a32b4]"
          >
            Rejoindre sur Discord
          </Link>
        </div>
      </div>
    </header>
  );
}
