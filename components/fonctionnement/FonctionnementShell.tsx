"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, HelpCircle, Layers, Library, TrendingUp, Users, Workflow } from "lucide-react";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

const SECTIONS = [
  { href: "/fonctionnement-tenf/decouvrir", label: "Découvrir TENF", Icon: Compass },
  { href: "/fonctionnement-tenf/comment-ca-marche", label: "Comment ça marche", Icon: Workflow },
  { href: "/fonctionnement-tenf/progression", label: "Ta progression", Icon: TrendingUp },
  { href: "/fonctionnement-tenf/communaute", label: "Communauté & activités", Icon: Users },
  { href: "/fonctionnement-tenf/ressources", label: "Ressources & aide", Icon: Library },
  { href: "/fonctionnement-tenf/faq", label: "FAQ", Icon: HelpCircle },
  { href: "/fonctionnement-tenf/parcours-complet", label: "Parcours complet", Icon: Layers },
] as const;

export default function FonctionnementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={`min-h-screen ${styles.fonctionnementPage}`} style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <nav className={`${styles.fnNavBar} mb-8 sm:mb-10`} aria-label="Sections du fonctionnement TENF">
          <ul className={styles.fnNavList}>
            {SECTIONS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.Icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`${styles.fnNavLink} ${styles.fonctionnementTabPill} ${active ? `${styles.active} ${styles.fnNavLinkActive}` : ""}`}
                  >
                    <Icon className={`${styles.fnNavIcon} h-[15px] w-[15px]`} strokeWidth={2.25} aria-hidden />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="prose-readable-mobile">{children}</div>
      </div>
    </div>
  );
}
