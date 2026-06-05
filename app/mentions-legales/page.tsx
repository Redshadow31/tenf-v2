import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell from "@/components/legal/LegalPageShell";
import LegalSection from "@/components/legal/LegalSection";
import styles from "@/components/legal/legal.module.css";
import { LegalValidationBox, OfficialEmailLink } from "@/components/legal/LegalNoticeBoxes";
import {
  TENF_EDITOR_ADDRESS_LEGAL_NOTE,
  TENF_EDITOR_ADDRESS_NOTICE,
  TENF_FOUNDERS,
  TENF_HOST,
  TENF_HOST_ADDRESS_LINES,
  TENF_INTELLECTUAL_PROPERTY_INTRO,
  TENF_INTELLECTUAL_PROPERTY_ITEMS,
  TENF_INTELLECTUAL_PROPERTY_PROHIBITION,
  TENF_INTELLECTUAL_PROPERTY_THIRD_PARTIES,
  TENF_LEGAL_CAUTION_NOTICE,
  TENF_OFFICIAL_NAME,
  TENF_RGPD_EMAIL,
  TENF_SITE_PURPOSE,
} from "@/lib/legal/constants";
import { INTELLECTUAL_PROPERTY_PATH, PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";

export const metadata: Metadata = {
  title: "Mentions légales — TENF",
  description:
    "Mentions légales du site Twitch Entraide New Family (TENF) : contact, hébergeur, propriété intellectuelle et responsabilité.",
  alternates: { canonical: "https://tenf-community.com/mentions-legales" },
  openGraph: {
    title: "Mentions légales — TENF",
    description: "Informations légales du site communautaire TENF.",
    url: "https://tenf-community.com/mentions-legales",
    type: "website",
  },
};

const NAV_ITEMS = [
  { id: "editeur", label: "Éditeur" },
  { id: "objet", label: "Objet du site" },
  { id: "hebergement", label: "Hébergement" },
  { id: "propriete", label: "Propriété intellectuelle" },
  { id: "responsabilite", label: "Responsabilité" },
  { id: "liens", label: "Liens externes" },
  { id: "donnees", label: "Données personnelles" },
] as const;

const linkClass = "font-semibold underline underline-offset-2 transition hover:opacity-80";

export default function MentionsLegalesPage() {
  return (
    <LegalPageShell
      icon="mentions"
      title="Mentions légales"
      subtitle={`Informations relatives au site ${TENF_OFFICIAL_NAME}.`}
      navItems={[...NAV_ITEMS]}
    >
      <LegalValidationBox type="mentions" />

      <LegalSection id="editeur" title="Éditeur du site">
        <div className={styles.sectionGrid2}>
          <div className={styles.infoCard}>
            <p>
              <span className={styles.infoCardLabel}>Nom</span>
              <br />
              <strong style={{ color: "var(--color-text)" }}>{TENF_OFFICIAL_NAME}</strong>
            </p>
            <p className="mt-3">
              <span className={styles.infoCardLabel}>Responsables de publication</span>
              <br />
              {TENF_FOUNDERS}
            </p>
          </div>
          <div className={styles.infoCard}>
            <p>
              <span className={styles.infoCardLabel}>Contact officiel</span>
              <br />
              <OfficialEmailLink subject="Contact TENF — Site web" />
            </p>
            <p className="mt-3">
              <span className={styles.infoCardLabel}>Canal RGPD</span>
              <br />
              <OfficialEmailLink subject="Demande RGPD — TENF" />
              <span className="mt-1 block text-xs opacity-80">({TENF_RGPD_EMAIL})</span>
            </p>
          </div>
        </div>
        <p className="text-sm">
          Vous pouvez aussi utiliser le{" "}
          <Link href="/contact" className={linkClass} style={{ color: "#c4b5fd" }}>
            formulaire de contact
          </Link>{" "}
          du site.
        </p>
        <div className={styles.highlightBox}>
          <p className="font-semibold" style={{ color: "var(--color-text)" }}>
            Adresse de l&apos;éditeur
          </p>
          <p className="mt-2">{TENF_EDITOR_ADDRESS_NOTICE}</p>
          <p className="mt-2">{TENF_EDITOR_ADDRESS_LEGAL_NOTE}</p>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="objet" title="Objet du site">
        <p>{TENF_SITE_PURPOSE}</p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="hebergement" title="Hébergement">
        <div className={styles.sectionGrid2}>
          <p>
            Le site est hébergé par <strong style={{ color: "var(--color-text)" }}>{TENF_HOST}</strong>.
          </p>
          <address
            className={`${styles.infoCard} not-italic text-sm leading-relaxed`}
            style={{ color: "var(--color-text-secondary)" }}
          >
            <span className={styles.infoCardLabel}>Adresse hébergeur</span>
            {TENF_HOST_ADDRESS_LINES.map((line) => (
              <span key={line} className="mt-2 block">
                {line}
              </span>
            ))}
          </address>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="propriete" title="Propriété intellectuelle">
        <p>{TENF_INTELLECTUAL_PROPERTY_INTRO}</p>
        <p>{TENF_INTELLECTUAL_PROPERTY_PROHIBITION}</p>
        <p className="font-medium" style={{ color: "var(--color-text)" }}>
          Sont notamment concernés :
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_INTELLECTUAL_PROPERTY_ITEMS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>{TENF_INTELLECTUAL_PROPERTY_THIRD_PARTIES}</p>
        <p className="text-sm">
          Page dédiée :{" "}
          <Link href={INTELLECTUAL_PROPERTY_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Propriété intellectuelle TENF
          </Link>
          .
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="responsabilite" title="Responsabilité">
        <p>
          Le site est mis à disposition à titre communautaire et informatif. Malgré le soin apporté aux
          contenus, certaines informations peuvent évoluer, être modifiées ou devenir temporairement
          inexactes.
        </p>
        <p>
          TENF ne peut garantir l&apos;absence totale d&apos;erreurs, d&apos;interruptions ou de contenus
          obsolètes.
        </p>
        <p>
          Chaque visiteur reste responsable de l&apos;usage qu&apos;il fait des informations et des liens
          proposés sur le site.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="liens" title="Liens externes">
        <p>
          Le site peut contenir des liens vers Twitch, Discord, des réseaux sociaux, des partenaires, des
          créateurs ou des services tiers.
        </p>
        <p>
          TENF n&apos;est pas responsable du contenu, des pratiques, des politiques de confidentialité ou du
          fonctionnement de ces sites externes.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="donnees" title="Données personnelles">
        <p>
          Pour savoir comment TENF traite les données personnelles, consultez la{" "}
          <Link href={PRIVACY_POLICY_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <div className={styles.highlightBox}>
        <p className="text-sm">{TENF_LEGAL_CAUTION_NOTICE}</p>
      </div>

      <p className="text-xs opacity-80">Dernière mise à jour : juin 2026.</p>
    </LegalPageShell>
  );
}
