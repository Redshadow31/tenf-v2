import Link from "next/link";
import { MessageCircle, Rocket, UserPlus } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { GuidancePanel } from "@/components/fonctionnement/GuidancePanel";
import {
  IntegrationStep1Card,
  IntegrationStep2Card,
  IntegrationStep3Card,
  integrationStepSummaries,
} from "@/components/fonctionnement/integration-sections";

export const metadata = {
  title: "Comment ça marche — Fonctionnement TENF",
  description: "Les trois étapes TENF : rejoindre, participer, progresser — avec le détail à la demande.",
};

const steps = [
  { summary: integrationStepSummaries[0], Card: IntegrationStep1Card, Icon: UserPlus },
  { summary: integrationStepSummaries[1], Card: IntegrationStep2Card, Icon: MessageCircle },
  { summary: integrationStepSummaries[2], Card: IntegrationStep3Card, Icon: Rocket },
] as const;

export default function CommentCaMarchePage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Les bases · onboarding TENF"
        title="Comment ça marche"
        subtitle="Trois étapes pour résumer le début du parcours. Les détails complets restent accessibles : ouvre « En savoir plus » ou passe par le parcours à onglets pour tout lire d&apos;affilée."
        icon={UserPlus}
      />

      <GuidancePanel tabId="integration" />

      <section aria-labelledby="steps-heading">
        <h2 id="steps-heading" className={`${styles.fnSectionTitle} sr-only`}>
          Les trois étapes
        </h2>
        <div className={styles.fnStepList}>
          {steps.map(({ summary, Card, Icon }, index) => (
            <div key={summary.title} className={styles.fnStepRow}>
              <div className={styles.fnStepRail}>
                <div className={styles.fnStepBadge} aria-hidden>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={2.25} />
                </div>
                {index < steps.length - 1 ? <div className={styles.fnStepLine} aria-hidden /> : null}
              </div>
              <article className={`${styles.fnCard} ${styles.fnCardPad} ${styles.fnCardInteractive} flex min-h-0 flex-col`}>
                <p className="text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--fn-purple)_88%,#fff)]">
                  Étape {index + 1}
                </p>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--color-text)]">{summary.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{summary.short}</p>
                <details className={`${styles.fnDetailsLite} mt-5`}>
                  <summary>En savoir plus</summary>
                  <div className={styles.fnDetailsInner}>
                    <Card />
                  </div>
                </details>
              </article>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.fnCard} ${styles.fnCardPad}`}>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Tu veux les sections détaillées (évaluation, rôles, FAQ…) dans l&apos;ordre d&apos;origine ? Utilise le{" "}
          <Link href="/fonctionnement-tenf/parcours-complet" className="font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline">
            parcours complet à onglets
          </Link>
          .
        </p>
      </section>

      <div className={styles.fnFlowFooter}>
        <Link href="/fonctionnement-tenf/decouvrir" className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}>
          ← Découvrir TENF
        </Link>
        <Link href="/fonctionnement-tenf/progression" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Ta progression →
        </Link>
      </div>
    </div>
  );
}
