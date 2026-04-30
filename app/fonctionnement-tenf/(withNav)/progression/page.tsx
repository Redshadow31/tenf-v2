import Link from "next/link";
import { Gauge } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { FonctionnementProgressRail } from "@/components/fonctionnement/FonctionnementProgressRail";
import { GuidancePanel } from "@/components/fonctionnement/GuidancePanel";
import { BoutiquePointsContent, SystemePointsContent } from "@/components/fonctionnement/FonctionnementLegacyPage";
import { IntegrationEvaluationSection } from "@/components/fonctionnement/integration-sections";

export const metadata = {
  title: "Ta progression — Fonctionnement TENF",
  description: "Évaluations, points TENF et boutique : ce que tu débloques en t'impliquant dans la communauté.",
};

export default function ProgressionPage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Évolution · implication"
        title="Ta progression"
        subtitle="Ce que tu débloques dans le temps : visibilité sur ton engagement, retours réguliers et usage de tes points — sans jargon inutile."
        icon={Gauge}
      />

      <FonctionnementProgressRail />

      <div className={styles.fnEmbedGlow}>
        <IntegrationEvaluationSection />
      </div>

      <GuidancePanel tabId="systeme-points" />

      <div className={styles.fnEmbedGlow}>
        <SystemePointsContent />
      </div>

      <GuidancePanel tabId="boutique-points" />

      <div className={styles.fnEmbedGlow}>
        <BoutiquePointsContent />
      </div>

      <div className={styles.fnFlowFooter}>
        <Link href="/fonctionnement-tenf/comment-ca-marche" className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}>
          ← Comment ça marche
        </Link>
        <Link href="/fonctionnement-tenf/communaute" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Communauté & activités →
        </Link>
      </div>
    </div>
  );
}
