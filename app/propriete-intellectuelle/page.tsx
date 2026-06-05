import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell from "@/components/legal/LegalPageShell";
import LegalSection from "@/components/legal/LegalSection";
import styles from "@/components/legal/legal.module.css";
import { OfficialEmailLink } from "@/components/legal/LegalNoticeBoxes";
import {
  TENF_FOUNDERS,
  TENF_INTELLECTUAL_PROPERTY_PROHIBITION,
  TENF_INTELLECTUAL_PROPERTY_THIRD_PARTIES,
  TENF_IP_ALLOWED_USES,
  TENF_IP_AUTHORIZATION_PROCESS,
  TENF_IP_FORBIDDEN_USES,
  TENF_IP_MEMBER_CONTENT_NOTE,
  TENF_IP_PAGE_GENERAL_IDEAS_NOTE,
  TENF_IP_PAGE_INTRO,
  TENF_IP_PAGE_PROTECTED_ELEMENTS,
  TENF_IP_PAGE_PROTECTED_NAMES,
  TENF_IP_PAGE_SCOPE,
  TENF_IP_PAGE_SYSTEMS,
  TENF_IP_VALIDATION_NOTICE,
  TENF_LEGAL_CAUTION_NOTICE,
  TENF_OFFICIAL_NAME,
} from "@/lib/legal/constants";
import { LEGAL_NOTICE_PATH, PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";

export const metadata: Metadata = {
  title: "Propriété intellectuelle — TENF",
  description:
    "Protection des contenus, visuels, systèmes, identité et organisation de Twitch Entraide New Family / TENF.",
  alternates: { canonical: "https://tenf-community.com/propriete-intellectuelle" },
  openGraph: {
    title: "Propriété intellectuelle — TENF",
    description:
      "Textes, visuels, logos, systèmes communautaires et structure du site TENF — droits, usages et autorisations.",
    url: "https://tenf-community.com/propriete-intellectuelle",
    type: "website",
  },
};

const NAV_ITEMS = [
  { id: "protection", label: "Protection TENF" },
  { id: "perimetre", label: "Périmètre" },
  { id: "noms", label: "Noms protégés" },
  { id: "systemes", label: "Systèmes TENF" },
  { id: "contenus", label: "Contenus protégés" },
  { id: "usages", label: "Usages autorisés" },
  { id: "interdits", label: "Usages interdits" },
  { id: "membres", label: "Contenus membres" },
  { id: "tiers", label: "Marques tierces" },
  { id: "autorisations", label: "Autorisations" },
  { id: "principe", label: "Principe général" },
] as const;

const linkClass = "font-semibold underline underline-offset-2 transition hover:opacity-80";

export default function ProprieteIntellectuellePage() {
  return (
    <LegalPageShell
      icon="ip"
      title="Propriété intellectuelle TENF"
      subtitle={`Protection de l'identité, des contenus, des systèmes et de l'organisation de ${TENF_OFFICIAL_NAME}.`}
      navItems={[...NAV_ITEMS]}
    >
      <div className={styles.highlightBox}>
        <p className={styles.infoCardLabel}>Validation avant publication officielle</p>
        <p className="mt-2" style={{ color: "var(--color-text)" }}>
          {TENF_IP_VALIDATION_NOTICE}
        </p>
      </div>

      <LegalSection id="protection" title="Protection de l'identité TENF">
        <p>{TENF_IP_PAGE_INTRO}</p>
        <p>{TENF_INTELLECTUAL_PROPERTY_PROHIBITION}</p>
        <p>
          TENF investit du temps, de la créativité et de l&apos;organisation collective pour construire une
          expérience communautaire cohérente : identité visuelle, parcours membres, systèmes d&apos;entraide,
          événements, guides et outils numériques. Cette page rappelle que cette œuvre collective et cette
          organisation originale ne peuvent pas être reprises librement par des tiers.
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Compléments :{" "}
          <Link href={LEGAL_NOTICE_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Mentions légales
          </Link>
          {" · "}
          <Link href={PRIVACY_POLICY_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Politique de confidentialité
          </Link>
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="perimetre" title="Périmètre de protection">
        <p>{TENF_IP_PAGE_SCOPE}</p>
        <div className={styles.sectionGrid2}>
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Sont couverts</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm">
              <li>le site public et ses pages thématiques</li>
              <li>l&apos;espace membre et ses interfaces</li>
              <li>les textes, visuels et documents TENF</li>
              <li>les systèmes, noms et présentations propres au projet</li>
            </ul>
          </div>
          <div className={`${styles.infoCard} ${styles.sideCardRed}`}>
            <p className={styles.infoCardLabel}>Responsables</p>
            <p className="mt-2 text-sm">
              Sous la responsabilité de <strong style={{ color: "var(--color-text)" }}>{TENF_FOUNDERS}</strong>
              . Contact pour toute question liée à la propriété intellectuelle :{" "}
              <OfficialEmailLink subject="Propriété intellectuelle — TENF" />.
            </p>
          </div>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="noms" title="Noms, sigles et identités protégés">
        <p>
          Les dénominations ci-dessous — et leurs déclinaisons graphiques ou textuelles — font partie de
          l&apos;identité TENF. Leur usage sur un autre support, projet, serveur, site ou communication
          externe, sans accord préalable, est interdit.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TENF_IP_PAGE_PROTECTED_NAMES.map((entry) => (
            <li
              key={entry.name}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: "color-mix(in srgb, #9146ff 24%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #9146ff 6%, var(--color-card))",
              }}
            >
              <p className="font-bold" style={{ color: "var(--color-text)" }}>
                {entry.name}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {entry.detail}
              </p>
            </li>
          ))}
        </ul>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="systemes" title="Systèmes et organisation propres à TENF">
        <p>
          Au-delà des noms, TENF a développé des systèmes, parcours et modes de présentation qui structurent
          la vie de la communauté. Leur reproduction ou leur imitation substantielle — même avec d&apos;autres
          intitulés — peut porter atteinte à l&apos;identité du projet.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_IP_PAGE_SYSTEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="contenus" title="Contenus, visuels et structure du site">
        <p>Sont notamment protégés, sans que cette liste soit limitative :</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {TENF_IP_PAGE_PROTECTED_ELEMENTS.map((item) => (
            <li
              key={item}
              className="rounded-lg border px-3 py-2.5 text-sm leading-relaxed"
              style={{
                borderColor: "color-mix(in srgb, #dc2626 18%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #dc2626 4%, var(--color-card))",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
        <div className={styles.highlightBox}>
          <p>
            La combinaison de ces éléments — pages, textes, visuels, systèmes et parcours — forme une
            organisation originale propre à TENF. Une reprise partielle ou totale de cette combinaison, même
            déguisée, reste soumise à autorisation.
          </p>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="usages" title="Usages généralement autorisés">
        <p>Sans autorisation préalable, les usages suivants restent en principe acceptables :</p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_IP_ALLOWED_USES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          En cas de doute — notamment pour une communication publique, une vidéo, un article de presse ou un
          partenariat — demandez une validation écrite avant publication.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="interdits" title="Usages interdits sans autorisation écrite">
        <p>Les pratiques suivantes sont expressément interdites sans accord préalable de l&apos;équipe TENF :</p>
        <ul className="space-y-2">
          {TENF_IP_FORBIDDEN_USES.map((item) => (
            <li
              key={item}
              className="rounded-lg border px-3 py-2.5 text-sm leading-relaxed"
              style={{
                borderColor: "color-mix(in srgb, #dc2626 28%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #dc2626 6%, var(--color-card))",
                color: "var(--color-text)",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
        <p>{TENF_INTELLECTUAL_PROPERTY_PROHIBITION}</p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="membres" title="Contenus des membres et présentation TENF">
        <p>{TENF_IP_MEMBER_CONTENT_NOTE}</p>
        <p>
          Les avatars, streams, clips ou créations personnelles des membres ne deviennent pas la propriété
          de TENF du seul fait de leur présence dans la communauté. En revanche, toute réutilisation des
          contenus agrégés, sélectionnés ou mis en forme par TENF sur le site (annuaire, lives, VIP,
          témoignages, interviews, clips à découvrir, etc.) hors du cadre prévu par le site relève des
          règles de cette page.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="tiers" title="Marques, partenaires et contenus de tiers">
        <p>{TENF_INTELLECTUAL_PROPERTY_THIRD_PARTIES}</p>
        <p>
          Twitch, Discord, Netlify, partenaires institutionnels, créateurs, marques caritatives ou sponsors
          peuvent apparaître sur le site ou dans les communications TENF. Leur présence n&apos;emporte aucune
          licence générale sur leurs contenus respectifs.
        </p>
        <p>
          TENF ne revendique aucun droit sur les marques, logos, jeux, musiques, overlays ou contenus
          appartenant à des tiers. Toute réutilisation de ces éléments reste soumise aux conditions de leurs
          titulaires respectifs.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="autorisations" title="Demander une autorisation">
        <p>{TENF_IP_AUTHORIZATION_PROCESS}</p>
        <div className={styles.sectionGrid2}>
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Par e-mail</p>
            <p className="mt-2">
              <OfficialEmailLink subject="Demande d'autorisation — Propriété intellectuelle TENF" />
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Précisez : l&apos;élément concerné, le support, la durée, l&apos;usage envisagé et votre
              identité / structure.
            </p>
          </div>
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Via le site</p>
            <p className="mt-2 text-sm">
              <Link href="/contact" className={linkClass} style={{ color: "#c4b5fd" }}>
                Formulaire de contact
              </Link>{" "}
              — objet « Propriété intellectuelle / autorisation de réutilisation ».
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              L&apos;absence de réponse ou de refus explicite ne vaut pas autorisation tacite.
            </p>
          </div>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="principe" title="Principe général">
        <div className={styles.highlightBox}>
          <p>{TENF_IP_PAGE_GENERAL_IDEAS_NOTE}</p>
        </div>
        <p>
          TENF encourage l&apos;entraide, le partage et la visibilité des créateurs — mais pas la copie de
          son identité, de ses systèmes ou de son travail éditorial et technique. En cas de constat
          d&apos;usage non autorisé, l&apos;équipe TENF se réserve le droit de demander le retrait du contenu
          concerné et d&apos;engager les démarches appropriées selon la gravité de la situation.
        </p>
      </LegalSection>

      <div className={styles.highlightBox}>
        <p className="text-sm">{TENF_LEGAL_CAUTION_NOTICE}</p>
      </div>

      <p className="text-xs opacity-80">Dernière mise à jour : juin 2026.</p>
    </LegalPageShell>
  );
}
