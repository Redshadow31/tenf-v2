"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "@/components/Header";

type ClientLayoutProps = {
  children: ReactNode;
};

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/membres", label: "Membres" },
  { href: "/admin/spotlight", label: "Spotlight" },
  { href: "/admin/follow", label: "Suivi Follow" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle" },
  { href: "/admin/statistiques", label: "Statistiques" },
  { href: "/admin/boutique", label: "Boutique" },
  { href: "/admin/events", label: "Événements" },
];

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-[#e5e5e5]">
        <div className="grid min-h-screen grid-cols-[260px_1fr]">
          <aside className="bg-[#1a1a1d] px-6 py-8">
            <div className="mb-8 flex items-center gap-2">
              <span className="font-bold text-xl text-[#9146ff]">TENF</span>
              <span className="text-sm text-gray-400">Admin</span>
            </div>
            <nav className="space-y-2">
              {adminLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={[
                      "block rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[#9146ff]/10 text-[#9146ff]"
                        : "text-gray-300 hover:bg-white/5 hover:text-white",
                    ].join(" ")}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          <div className="flex flex-col bg-[#0e0e10]">
            <header className="border-b border-white/5 px-8 py-6">
              <h1 className="text-2xl font-semibold text-white">
                TENF Admin
              </h1>
            </header>
            <main className="flex-1 px-8 py-6">{children}</main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e10] text-[#e5e5e5]">
      <Header />
      <main className="mx-auto max-w-7xl px-8 py-6">{children}</main>
    </div>
  );
}

