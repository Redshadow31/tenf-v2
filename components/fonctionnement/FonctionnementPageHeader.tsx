import type { LucideIcon } from "lucide-react";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

type Props = {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  actions?: React.ReactNode;
};

export function FonctionnementPageHeader({ eyebrow, title, subtitle, icon: Icon, actions }: Props) {
  return (
    <header className={`${styles.fnPageHero} mb-10`}>
      <div className={styles.fnPageHeroInner}>
        <p className={`${styles.fnEyebrow} flex items-center gap-2`}>
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl border shadow-[0_0_22px_color-mix(in_srgb,var(--fn-purple)_28%,transparent)]"
            style={{
              borderColor: "color-mix(in srgb, var(--fn-purple) 42%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--fn-purple) 22%, #0f081c)",
              color: "#e9d5ff",
            }}
            aria-hidden
          >
            <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </span>
          {eyebrow}
        </p>
        <h1 className={styles.fnHeroTitle}>{title}</h1>
        <p className={styles.fnHeroSubtitle}>{subtitle}</p>
        {actions ? <div className={styles.fnHeroActions}>{actions}</div> : null}
      </div>
    </header>
  );
}
