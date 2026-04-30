import Link from "next/link";
import { Sparkles, Users } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";
import { GuidancePanel } from "@/components/fonctionnement/GuidancePanel";
import { SpotlightContent } from "@/components/fonctionnement/FonctionnementLegacyPage";
import { IntegrationActivitiesSection, IntegrationRolesSection } from "@/components/fonctionnement/integration-sections";

export const metadata = {
  title: "Communauté & activités — Fonctionnement TENF",
  description: "Rôles, événements et spotlight : la vie collective TENF et les temps forts à vivre ensemble.",
};

export default function CommunautePage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Ensemble · dynamique collective"
        title="Communauté & activités"
        subtitle="Qui fait quoi, quels rendez-vous rythment la semaine, et comment les temps forts sont pensés pour créer du lien — sans pression inutile."
        icon={Users}
      />

      <div className={`${styles.fnLiveStrip} max-w-3xl`}>
        <span className={styles.fnLiveDot} aria-hidden />
        <p className={styles.fnLiveText}>Agenda, lives, raids et événements : une communauté qui bouge en continu.</p>
        <span className={styles.fnLiveBadge}>Live</span>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-[color-mix(in_srgb,var(--fn-purple)_22%,var(--color-border))] bg-[color-mix(in_srgb,var(--fn-purple)_10%,transparent)] px-4 py-3 text-sm text-[color-mix(in_srgb,var(--color-text-secondary)_95%,#e9d5ff)]">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[color-mix(in_srgb,var(--fn-purple)_90%,#fff)]" strokeWidth={2} aria-hidden />
        <p>
          Les <strong className="font-semibold text-[var(--color-text)]">Spotlights</strong> et les temps communautaires sont faits pour mettre en avant des créateurs — avec une vraie présence collective autour du live.
        </p>
      </div>

      <GuidancePanel tabId="spotlight" />

      <div className={styles.fnEmbedGlow}>
        <IntegrationRolesSection />
      </div>

      <div className={styles.fnEmbedGlow}>
        <IntegrationActivitiesSection />
      </div>

      <div className={styles.fnEmbedGlow}>
        <SpotlightContent />
      </div>

      <div className={styles.fnFlowFooter}>
        <Link href="/fonctionnement-tenf/progression" className={`${styles.fnFlowLink} text-[var(--color-text-secondary)]`}>
          ← Ta progression
        </Link>
        <Link href="/fonctionnement-tenf/ressources" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Ressources & aide →
        </Link>
      </div>
    </div>
  );
}
