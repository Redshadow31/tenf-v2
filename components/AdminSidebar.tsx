"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/membres", label: "Membres" },
  { href: "/admin/spotlight", label: "Spotlight" },
  { href: "/admin/follow", label: "Suivi Follow" },
  { href: "/admin/evaluations", label: "Intégration" },
  { href: "/admin/statistiques", label: "Statistiques" },
  { href: "/admin/boutique", label: "Boutique" },
  { href: "/admin/events", label: "Événements" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen flex-col bg-[#1a1a1d] px-6 py-8">
      <div className="mb-8 flex items-center gap-2">
        <span className="font-bold text-xl text-[#9146ff]">TENF</span>
        <span className="text-sm text-gray-400">Admin</span>
      </div>
      <nav className="flex flex-col gap-2">
        {adminLinks.map((link) => {
          // Pour les événements et évaluations, considérer actif si on est sur la route ou une sous-page
          const isActive = link.href === "/admin/events"
            ? pathname?.startsWith("/admin/events")
            : link.href === "/admin/evaluations"
            ? pathname?.startsWith("/admin/evaluations")
            : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#9146ff] text-white"
                  : "text-gray-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

