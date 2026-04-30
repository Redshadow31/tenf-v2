import Link from "next/link";
import { LifeBuoy } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { GuidancePanel } from "@/components/fonctionnement/GuidancePanel";
import { ConseilContent, ReglementContent } from "@/components/fonctionnement/FonctionnementLegacyPage";
import { IntegrationResourcesSection } from "@/components/fonctionnement/integration-sections";

export const metadata = {
  title: "Ressources & aide — Fonctionnement TENF",
  description: "Support staff, outils, règlement et conseils pour progresser sereinement dans TENF.",
};

export default function RessourcesPage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Cadre · outils · soutien"
        title="Ressources & accompagnement"
        subtitle="Où trouver de l&apos;aide, comment le site et Discord s&apos;articulent, puis le cadre commun et des conseils pour tenir dans la durée."
        icon={LifeBuoy}
      />

      <GuidancePanel tabId="integration" />

      <div className={styles.fnEmbedGlow}>
        <IntegrationResourcesSection />
      </div>

      <GuidancePanel tabId="reglement" />

      <div className={styles.fnEmbedGlow}>
        <ReglementContent />
      </div>

      <GuidancePanel tabId="conseil" />

      <div className={styles.fnEmbedGlow}>
        <ConseilContent />
      </div>

      <div className={styles.fnFlowFooter}>
        <Link href="/fonctionnement-tenf/communaute" className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}>
          ← Communauté & activités
        </Link>
        <Link href="/fonctionnement-tenf/faq" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          FAQ →
        </Link>
      </div>
    </div>
  );
}
