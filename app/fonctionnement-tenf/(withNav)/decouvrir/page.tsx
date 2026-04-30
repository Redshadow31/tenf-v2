import Link from "next/link";
import { ArrowRight, HeartHandshake, LineChart, Radio, ShieldCheck } from "lucide-react";
import styles from "../../fonctionnement.module.css";
import { FonctionnementPageHeader } from "@/components/fonctionnement/FonctionnementPageHeader";

export const metadata = {
  title: "Découvrir TENF — Fonctionnement",
  description:
    "TENF : une communauté de créateurs avec entraide concrète, progression suivie et événements pour avancer ensemble.",
};

const benefits = [
  {
    title: "Entraide réelle",
    text: "Retours sur tes lives, raids et présence quand tu en as besoin — pas une promo vide.",
    Icon: HeartHandshake,
  },
  {
    title: "Progression suivie",
    text: "Évaluations régulières, points selon ton implication et usage en boutique pour booster ta chaîne.",
    Icon: LineChart,
  },
  {
    title: "Cadre bienveillant",
    text: "Règles claires, staff disponible et événements pensés pour créer du lien sans toxicité.",
    Icon: ShieldCheck,
  },
  {
    title: "Visibilité collective",
    text: "Spotlights, films communautaires et agenda : des moments pour te faire connaître au bon moment.",
    Icon: Radio,
  },
];

export default function DecouvrirTenfPage() {
  return (
    <div className="about-fade-up space-y-12">
      <FonctionnementPageHeader
        eyebrow="Parcours guidé · Twitch Entraide New Family"
        title="Découvrir TENF"
        subtitle="Une communauté de streamers et de viewers qui avancent ensemble : intégration encadrée, points qui reflètent ton implication, et une vie serveur où l&apos;entraide devient naturelle — pas ponctuelle."
        icon={Radio}
        actions={
          <>
            <Link href="/fonctionnement-tenf/comment-ca-marche" className={styles.fnBtnPrimary}>
              Voir les 3 étapes
              <ArrowRight className="h-4 w-4" strokeWidth={2.25} aria-hidden />
            </Link>
            <Link href="https://discord.gg/WnpazgcZHk" target="_blank" rel="noopener noreferrer" className={styles.fnBtnGhost}>
              Discord TENF
            </Link>
          </>
        }
      />

      <section>
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className={styles.fnSectionTitle}>Ce que tu y gagnes concrètement</h2>
            <p className={styles.fnSectionLead}>Quatre piliers pensés pour les créateurs qui veulent progresser sans streamer dans le vide.</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:gap-6">
          {benefits.map((b) => (
            <article key={b.title} className={`${styles.fnCard} ${styles.fnCardPad} ${styles.fnCardInteractive}`}>
              <div className="flex gap-4">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border shadow-[0_0_22px_color-mix(in_srgb,var(--fn-purple)_22%,transparent)]"
                  style={{
                    borderColor: "color-mix(in srgb, var(--fn-purple) 35%, transparent)",
                    background: "linear-gradient(145deg, color-mix(in srgb, var(--fn-purple) 28%, transparent), color-mix(in srgb, #5da9ff 12%, transparent))",
                    color: "#f5f3ff",
                  }}
                  aria-hidden
                >
                  <b.Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold tracking-tight text-[var(--color-text)]">{b.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color-mix(in_srgb,var(--color-text-secondary)_96%,#c4b5fd)]">{b.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={`${styles.fnMutedCard} text-center`}>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          Envie de tout voir d&apos;un coup — comme avant ? Le parcours à onglets complet reste disponible.
        </p>
        <Link
          href="/fonctionnement-tenf/parcours-complet"
          className={`${styles.fnBtnGhost} mt-4 inline-flex border-[color-mix(in_srgb,var(--fn-purple)_35%,var(--color-border))]`}
        >
          Parcours complet (onglets)
        </Link>
      </section>

      <div className={styles.fnFlowFooter}>
        <p className="text-sm text-[var(--color-text-secondary)]">Étape suivante : les trois mouvements du début de parcours.</p>
        <Link href="/fonctionnement-tenf/comment-ca-marche" className={`${styles.fnFlowLink} font-semibold text-[var(--color-primary)]`}>
          Comment ça marche →
        </Link>
      </div>
    </div>
  );
}
