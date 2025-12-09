"use client";

import Link from "next/link";

const publicLinks = [
  { href: "/membres", label: "Membres" },
  { href: "/lives", label: "Lives" },
  { href: "/events", label: "Evènements" },
  { href: "/vip", label: "VIP" },
  { href: "/boutique", label: "Boutique" },
];

export default function Header() {
  // TODO: Gérer l'état de connexion (Twitch/Discord)
  const isAuthenticated = false; // À remplacer par la vraie logique d'authentification

  const handleTwitchLogin = () => {
    // TODO: Implémenter la connexion Twitch
    console.log("Connexion Twitch");
  };

  const handleDiscordLogin = () => {
    // TODO: Implémenter la connexion Discord
    console.log("Connexion Discord");
  };

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
          {isAuthenticated ? (
            <>
              {/* Menu utilisateur connecté */}
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
            </>
          ) : (
            <>
              {/* Boutons de connexion */}
              <button
                onClick={handleTwitchLogin}
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
