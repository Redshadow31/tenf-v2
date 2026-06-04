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
  TENF_OFFICIAL_NAME,
  TENF_RGPD_EMAIL,
  TENF_SITE_PURPOSE,
} from "@/lib/legal/constants";
import { PRIVACY_POLICY_PATH } from "@/lib/legal/privacyConsent";

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
              <span className={styles.infoCardLabel}>Éditeur</span>
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
              <span className="block text-xs mt-1 opacity-80">({TENF_RGPD_EMAIL})</span>
            </p>
          </div>
        </div>
        <p className="text-sm">
          Vous pouvez aussi utiliser le{" "}
          <Link
            href="/contact"
            className="font-semibold underline underline-offset-2 transition hover:opacity-80"
            style={{ color: "#c4b5fd" }}
          >
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
        <p>
          Les textes, visuels, logos, éléments graphiques, noms, contenus communautaires et éléments liés à
          TENF ne peuvent pas être repris, copiés ou diffusés sans autorisation préalable de l&apos;équipe
          TENF.
        </p>
        <p>
          Les marques, logos et contenus de tiers (Twitch, Discord, partenaires, créateurs) restent la
          propriété de leurs titulaires respectifs.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="responsabilite" title="Responsabilité">
        <p>
          Le site est mis à disposition à titre communautaire et informatif. Les informations peuvent
          évoluer. TENF ne peut pas garantir l&apos;absence totale d&apos;erreurs, d&apos;interruptions ou de
          contenus obsolètes.
        </p>
        <p>
          Chaque visiteur reste responsable de l&apos;usage qu&apos;il fait des informations et des liens
          proposés sur le site.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="liens" title="Liens externes">
        <p>
          Le site peut contenir des liens vers Twitch, Discord, des réseaux sociaux, des partenaires ou des
          services tiers. TENF n&apos;est pas responsable du contenu, des pratiques ou des politiques de
          confidentialité de ces sites externes.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="donnees" title="Données personnelles">
        <p>
          Pour savoir comment TENF traite les données personnelles, consultez la{" "}
          <Link
            href={PRIVACY_POLICY_PATH}
            className="font-semibold underline underline-offset-2 transition hover:opacity-80"
            style={{ color: "#c4b5fd" }}
          >
            politique de confidentialité
          </Link>
          .
        </p>
      </LegalSection>

      <p className="text-xs opacity-80">
        Dernière mise à jour : juin 2026. Ce document est fourni à titre informatif et ne constitue pas un
        conseil juridique.
      </p>
    </LegalPageShell>
  );
}
