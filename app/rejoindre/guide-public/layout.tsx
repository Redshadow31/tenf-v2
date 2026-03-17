import Link from "next/link";
import type { ReactNode } from "react";

const tabs = [
  { label: "Presentation rapide", href: "/rejoindre/guide-public/presentation-rapide" },
  { label: "Creer un compte", href: "/rejoindre/guide-public/creer-un-compte" },
  { label: "Liaison Twitch", href: "/rejoindre/guide-public/liaison-twitch" },
  { label: "FAQ publique", href: "/rejoindre/guide-public/faq-publique" },
];

export default function GuidePublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-xl border p-3 sm:p-4" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)" }}>
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-primary)" }}>
        Onglets du guide public
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href="/rejoindre/guide-public"
          className="rounded-full border px-3 py-1.5 text-xs sm:text-sm"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
        >
          Accueil du guide
        </Link>
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-full border px-3 py-1.5 text-xs sm:text-sm"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text)" }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
