"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
              {/* Connexions en mode icône minimal */}
              <button
                onClick={() => console.log("Connexion Twitch - À implémenter")}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#9146ff]/10 hover:bg-[#9146ff]/20 transition-colors group"
                title="Connexion Twitch"
              >
                <svg
                  className="w-5 h-5 text-[#9146ff] group-hover:text-[#9146ff]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428H12l-3.429 3.428v-3.428H5.143V1.714h15.428Z" />
                </svg>
              </button>
              <button
                onClick={handleDiscordLogin}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-[#5865F2]/10 hover:bg-[#5865F2]/20 transition-colors group"
                title="Connexion Discord"
              >
                <svg
                  className="w-5 h-5 text-[#5865F2] group-hover:text-[#5865F2]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z" />
                </svg>
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
