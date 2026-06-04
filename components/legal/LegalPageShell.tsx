import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, Scale, Shield } from "lucide-react";
import { TENF_OFFICIAL_EMAIL } from "@/lib/legal/constants";
import { LEGAL_NOTICE_PATH, PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";
import styles from "./legal.module.css";
import { LegalSideRailLeft, LegalSideRailRight, type LegalNavItem } from "./LegalSideRail";

type LegalPageShellProps = {
  title: string;
  subtitle: string;
  icon: "mentions" | "privacy";
  navItems: LegalNavItem[];
  children: ReactNode;
};

export default function LegalPageShell({
  title,
  subtitle,
  icon,
  navItems,
  children,
}: LegalPageShellProps) {
  const Icon = icon === "privacy" ? Shield : Scale;

  return (
    <main className={styles.page}>
      <div className={styles.glowLeft} aria-hidden />
      <div className={styles.glowRight} aria-hidden />

      <div className={styles.container}>
        <div className={styles.grid}>
          <LegalSideRailLeft navItems={navItems} />

          <div className={styles.mainColumn}>
            <Link href="/" className={styles.backLink}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour à l&apos;accueil
            </Link>

            <header className={styles.hero}>
              <div className={styles.heroInner}>
                <div className={styles.heroIcon}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "#9146ff" }} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className={styles.heroTitle}>{title}</h1>
                  <p className={styles.heroSubtitle}>{subtitle}</p>
                </div>
              </div>
            </header>

            <article className={styles.contentPanel}>
              <div className={styles.contentBody}>{children}</div>
            </article>

            <nav className={styles.footerNav} aria-label="Autres pages légales">
              <Link href={LEGAL_NOTICE_PATH}>Mentions légales</Link>
              <Link href={PRIVACY_POLICY_PATH}>Politique de confidentialité</Link>
              <a href={`mailto:${TENF_OFFICIAL_EMAIL}`}>Contact</a>
            </nav>
          </div>

          <LegalSideRailRight variant={icon} />
        </div>
      </div>
    </main>
  );
}
