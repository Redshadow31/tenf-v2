import type { ReactNode } from "react";
import styles from "./legal.module.css";

export type LegalSectionProps = {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
};

export default function LegalSection({ id, title, children, className = "" }: LegalSectionProps) {
  return (
    <section id={id} className={`${styles.section} ${className}`.trim()}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionMarker} aria-hidden />
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}
