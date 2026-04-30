import { ClipboardCheck, Gauge, Gift, Megaphone } from "lucide-react";
import styles from "@/app/fonctionnement-tenf/fonctionnement.module.css";

const nodes = [
  {
    step: "01",
    title: "Cadre & retours",
    hint: "Évaluations transparentes et feedback pour ajuster ton cap.",
    Icon: ClipboardCheck,
  },
  {
    step: "02",
    title: "Points TENF",
    hint: "Ton implication se traduit en progression mesurable.",
    Icon: Gauge,
  },
  {
    step: "03",
    title: "Boutique",
    hint: "Convertis tes points en services utiles pour ta chaîne.",
    Icon: Gift,
  },
  {
    step: "04",
    title: "Visibilité",
    hint: "Spotlight et communauté pour te faire découvrir au bon moment.",
    Icon: Megaphone,
  },
] as const;

export function FonctionnementProgressRail() {
  return (
    <section className={`${styles.fnProgressRail} mb-10`} aria-labelledby="fn-progress-rail-title">
      <h2 id="fn-progress-rail-title" className="sr-only">
        Fil de progression TENF
      </h2>
      {nodes.map(({ step, title, hint, Icon }) => (
        <div key={step} className={styles.fnProgressNode}>
          <div className="flex items-start gap-3">
            <div className={styles.fnProgressIconWrap}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className={styles.fnProgressLabel}>{step}</p>
              <p className={`${styles.fnProgressTitle} mt-1`}>{title}</p>
              <p className={`${styles.fnProgressHint} mt-1`}>{hint}</p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
