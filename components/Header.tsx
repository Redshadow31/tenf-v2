"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getDiscordUser, logoutDiscord, loginWithDiscord, type DiscordUser } from "@/lib/discord";
import TENFLogo from "./TENFLogo";

const publicLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/membres", label: "Membres" },
  { href: "/lives", label: "Lives" },
  { href: "/events", label: "Événements" },
  { href: "/spotlight", label: "Spotlight" },
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
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo TENF */}
        <TENFLogo showTagline={true} size="md" />

        {/* Navigation - Centrée */}
        <nav className="hidden items-center gap-8 text-[15px] font-medium text-gray-200 md:flex">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative transition-colors hover:text-[#9146ff] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-[#9146ff] after:transition-all hover:after:w-full"
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
              {/* Connexions en mode icône minimal avec logos réels */}
              <button
                onClick={() => console.log("Connexion Twitch - À implémenter")}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#9146ff]/10 hover:bg-[#9146ff]/20 transition-colors group"
                title="Connexion Twitch"
              >
                <Image
                  src="/logos/twitch.png"
                  alt="Twitch"
                  width={20}
                  height={20}
                  className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </button>
              <button
                onClick={handleDiscordLogin}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 transition-colors group"
                title="Connexion Discord"
              >
                <Image
                  src="/logos/discord.png"
                  alt="Discord"
                  width={20}
                  height={20}
                  className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                />
              </button>
            </>
          )}
          {/* Bouton Rejoindre le serveur - Toujours visible à droite */}
          <Link
            href="https://discord.gg/tenf"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#9146ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a32b4]"
          >
            Rejoindre le serveur
          </Link>
        </div>
      </div>
    </header>
  );
}
