"use client";

import Link from "next/link";
import TENFLogo from "./TENFLogo";

const publicLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/membres", label: "Membres" },
  { href: "/lives", label: "Lives" },
  { href: "/events", label: "Événements" },
  { href: "/integration", label: "Intégration" },
  { href: "/vip", label: "VIP" },
  { href: "/boutique", label: "Boutique" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0e0e10]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo TENF */}
        <TENFLogo showTagline={true} size="xl" />

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
    </header>
  );
}
