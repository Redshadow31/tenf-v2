"use client";

import Link from "next/link";
import { Mail, Scale, Shield } from "lucide-react";
import styles from "./legal.module.css";
import { TENF_FOUNDERS, TENF_OFFICIAL_EMAIL } from "@/lib/legal/constants";
import { LEGAL_NOTICE_PATH, PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";

export type LegalNavItem = { id: string; label: string };

type LegalSideRailProps = {
  variant: "mentions" | "privacy";
  navItems: LegalNavItem[];
};

export function LegalSideRailLeft({ navItems }: { navItems: LegalNavItem[] }) {
  return (
    <aside className={styles.sideRail} aria-label="Sommaire de la page">
      <div className={`${styles.sideCard} ${styles.sideCardAccent}`}>
        <p className={styles.sideCardTitle}>Sur cette page</p>
        <nav className={styles.sideNavList}>
          {navItems.map((item) => (
            <a key={item.id} href={`#${item.id}`} className={styles.sideNavLink}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className={`${styles.sideCard} ${styles.sideCardRed}`}>
        <p className={`${styles.sideCardTitle} ${styles.sideCardTitleRed}`}>TENF</p>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Communauté Twitch · entraide · événements
        </p>
      </div>
    </aside>
  );
}

export function LegalSideRailRight({ variant }: { variant: "mentions" | "privacy" }) {
  const Icon = variant === "privacy" ? Shield : Scale;

  return (
    <aside className={styles.sideRail} aria-label="Liens et contact">
      <div className={`${styles.sideCard} ${styles.sideCardAccent}`}>
        <p className={styles.sideCardTitle}>Contact</p>
        <a
          href={`mailto:${TENF_OFFICIAL_EMAIL}`}
          className="inline-flex items-center gap-2 break-all font-semibold transition hover:opacity-80"
          style={{ color: "var(--color-text)" }}
        >
          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: "#9146ff" }} aria-hidden />
          {TENF_OFFICIAL_EMAIL}
        </a>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          Canal RGPD : même adresse.
        </p>
      </div>

      <div className={styles.sideCard}>
        <p className={styles.sideCardTitle}>Pages</p>
        <nav className={styles.sideNavList}>
          <Link href={LEGAL_NOTICE_PATH} className={styles.sideNavLink}>
            Mentions légales
          </Link>
          <Link href={PRIVACY_POLICY_PATH} className={styles.sideNavLink}>
            Confidentialité
          </Link>
          <Link href="/contact" className={styles.sideNavLink}>
            Formulaire contact
          </Link>
        </nav>
      </div>

      <div className={`${styles.sideCard} ${styles.sideCardAccent}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "#9146ff" }} aria-hidden />
          <p className={styles.sideCardTitle} style={{ marginBottom: 0 }}>
            Responsables
          </p>
        </div>
        <p className="mt-2" style={{ color: "var(--color-text-secondary)" }}>
          {TENF_FOUNDERS}
        </p>
      </div>
    </aside>
  );
}
