import Link from "next/link";
import { HelpCircle } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { FonctionnementFaq } from "@/components/fonctionnement/FonctionnementFaq";
import { fonctionnementFaqItems } from "@/lib/fonctionnement/faq-data";

export const metadata = {
  title: "FAQ — Fonctionnement TENF",
  description: "Réponses aux questions les plus fréquentes sur l'intégration et la vie dans TENF.",
};

export default function FonctionnementFaqPage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Réponses rapides"
        title="Questions fréquentes"
        subtitle="Les mêmes réponses que dans le guide complet — format accordéon pour parcourir sans surcharge."
        icon={HelpCircle}
      />

      <FonctionnementFaq items={fonctionnementFaqItems} variant="accordion" />

      <section className={`${styles.fnMutedCard} text-center`}>
        <p className="text-sm text-[var(--color-text-secondary)]">Tu préfères la FAQ en cartes avec le reste du guide ?</p>
        <Link
          href="/fonctionnement-tenf/parcours-complet"
          className={`${styles.fnBtnGhost} mt-4 inline-flex border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]`}
        >
          Parcours complet (onglet Intégration)
        </Link>
      </section>

      <div className={styles.fnFlowFooter}>
        <Link href="/fonctionnement-tenf/ressources" className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}>
          ← Ressources & aide
        </Link>
        <Link href="/fonctionnement-tenf/decouvrir" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Revenir à Découvrir TENF
        </Link>
      </div>
    </div>
  );
}
