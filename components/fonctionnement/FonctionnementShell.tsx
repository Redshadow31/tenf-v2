"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
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

// Routes "fluides" : le shell ne fixe plus de max-w-7xl, le contenu utilise
// tout l'espace disponible avec un padding scalable au zoom. Le main parent
// (layout.client.tsx) bascule lui aussi en w-full pour ces chemins.
const FLUID_PATHS = new Set<string>(["/fonctionnement-tenf/comment-ca-marche"]);

const FLUID_STYLE: CSSProperties = {
  // @ts-expect-error CSS custom property
  "--fn-px": "clamp(1rem, 3vw, 2.75rem)",
  paddingLeft: "var(--fn-px)",
  paddingRight: "var(--fn-px)",
  paddingTop: "clamp(1.25rem, 2vw, 2.25rem)",
  paddingBottom: "clamp(2rem, 3.5vw, 3rem)",
  maxWidth: "min(112rem, 100%)",
  marginLeft: "auto",
  marginRight: "auto",
  width: "100%",
};

export default function FonctionnementShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFluid = !!pathname && FLUID_PATHS.has(pathname);

  return (
    <div
      className={`min-h-screen ${styles.fonctionnementPage}`}
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      {isFluid ? (
        <div className="relative z-10" style={FLUID_STYLE}>
          <FonctionnementNav pathname={pathname} />
          <div className="prose-readable-mobile">{children}</div>
        </div>
      ) : (
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <FonctionnementNav pathname={pathname} />
          <div className="prose-readable-mobile">{children}</div>
        </div>
      )}
    </div>
  );
}

function FonctionnementNav({ pathname }: { pathname: string | null }) {
  return (
    <nav className={`${styles.fnNavBar} mb-8 sm:mb-10`} aria-label="Sections du fonctionnement TENF">
      <ul className={styles.fnNavList}>
        {SECTIONS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${styles.fnNavLink} ${styles.fonctionnementTabPill} ${
                  active ? `${styles.active} ${styles.fnNavLinkActive}` : ""
                }`}
              >
                <Icon
                  className={`${styles.fnNavIcon} h-[15px] w-[15px]`}
                  strokeWidth={2.25}
                  aria-hidden
                />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
