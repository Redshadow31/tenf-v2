"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, HelpCircle, Link2, UserPlus } from "lucide-react";

const tabs = [
  { label: "Presentation rapide", href: "/rejoindre/guide-public/presentation-rapide", icon: BookOpen },
  { label: "Creer un compte", href: "/rejoindre/guide-public/creer-un-compte", icon: UserPlus },
  { label: "Liaison Twitch", href: "/rejoindre/guide-public/liaison-twitch", icon: Link2 },
  { label: "FAQ publique", href: "/rejoindre/guide-public/faq-publique", icon: HelpCircle },
];

export default function GuidePublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mt-6 rounded-2xl border p-3 sm:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", boxShadow: "0 10px 20px rgba(0,0,0,0.16)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
        Onglets du guide public
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href="/rejoindre/guide-public" className="rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: pathname === "/rejoindre/guide-public" ? "rgba(145,70,255,0.45)" : "var(--color-border)", color: pathname === "/rejoindre/guide-public" ? "var(--color-primary)" : "var(--color-text)" }}>
          Accueil du guide
        </Link>
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href} className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs sm:text-sm" style={{ borderColor: pathname === tab.href ? "rgba(145,70,255,0.45)" : "var(--color-border)", color: pathname === tab.href ? "var(--color-primary)" : "var(--color-text)" }}>
            <tab.icon size={14} />
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
