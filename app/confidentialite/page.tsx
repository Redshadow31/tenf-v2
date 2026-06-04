import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell from "@/components/legal/LegalPageShell";
import LegalSection from "@/components/legal/LegalSection";
import styles from "@/components/legal/legal.module.css";
import { LegalValidationBox, OfficialEmailLink } from "@/components/legal/LegalNoticeBoxes";
import { TENF_FOUNDERS, TENF_OFFICIAL_NAME, TENF_RGPD_EMAIL } from "@/lib/legal/constants";

export const metadata: Metadata = {
  title: "Politique de confidentialité — TENF",
  description:
    "Politique de confidentialité TENF : données collectées, finalités, droits RGPD et contact.",
  alternates: { canonical: "https://tenf-community.com/confidentialite" },
  openGraph: {
    title: "Politique de confidentialité — TENF",
    description: "Comment TENF traite vos données personnelles sur le site et dans la communauté.",
    url: "https://tenf-community.com/confidentialite",
    type: "website",
  },
};

const NAV_ITEMS = [
  { id: "qui", label: "Qui sommes-nous" },
  { id: "donnees", label: "Données collectées" },
  { id: "finalites", label: "Finalités" },
  { id: "base-legale", label: "Base légale" },
  { id: "acces", label: "Accès aux données" },
  { id: "conservation", label: "Conservation" },
  { id: "droits", label: "Vos droits" },
  { id: "securite", label: "Sécurité" },
  { id: "cookies", label: "Cookies" },
  { id: "evolution", label: "Évolution" },
] as const;

const linkClass =
  "font-semibold underline underline-offset-2 transition hover:opacity-80";

export default function ConfidentialitePage() {
  return (
    <LegalPageShell
      icon="privacy"
      title="Politique de confidentialité"
      subtitle={`Comment ${TENF_OFFICIAL_NAME} traite les données personnelles sur le site et dans le cadre de la communauté Discord/Twitch.`}
      navItems={[...NAV_ITEMS]}
    >
      <LegalValidationBox type="privacy" />

      <LegalSection id="qui" title="Qui sommes-nous ?">
        <div className={styles.sectionGrid2}>
          <p>
            TENF est une communauté d&apos;entraide entre streamers Twitch. Le site{" "}
            <strong style={{ color: "var(--color-text)" }}>tenf-community.com</strong> est géré par
            l&apos;équipe fondatrice et le staff autorisé, sous la responsabilité de {TENF_FOUNDERS}.
          </p>
          <div className={styles.infoCard}>
            <p>
              <span className={styles.infoCardLabel}>Contact & RGPD</span>
              <br />
              <OfficialEmailLink subject="Contact TENF — Données personnelles" />
            </p>
          </div>
        </div>
        <div className={styles.highlightBox}>
          <p className="text-sm">
            L&apos;adresse postale de l&apos;éditeur n&apos;est pas publiée sur le site pour des raisons de
            sécurité personnelle. Elle pourra être adaptée après validation juridique si TENF adopte une
            structure officielle (association, domiciliation, etc.).
          </p>
        </div>
        <p>
          Cette page vous explique, en termes clairs, quelles données peuvent être collectées et pourquoi —
          sans jargon inutile.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="donnees" title="Quelles données pouvons-nous collecter ?">
        <p>Selon ce que vous utilisez sur le site, nous pouvons traiter notamment :</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[
            "votre pseudo Discord",
            "votre pseudo Twitch",
            "un identifiant Discord ou Twitch (connexion OAuth)",
            "une adresse e-mail si vous nous la communiquez",
            "le contenu des messages envoyés via nos formulaires",
            "des informations de profil membre",
            "des liens Twitch, Discord ou réseaux sociaux",
            "des inscriptions aux événements",
            "des points ou récompenses communautaires (si actifs)",
            "des logs techniques (sécurité et fonctionnement)",
          ].map((item) => (
            <li
              key={item}
              className="rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: "color-mix(in srgb, #9146ff 18%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #9146ff 4%, var(--color-card))",
              }}
            >
              {item}
            </li>
          ))}
        </ul>
        <p className="font-medium" style={{ color: "var(--color-text)" }}>
          Nous ne vendons pas vos données personnelles.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="finalites" title="Pourquoi utilisons-nous ces données ?">
        <ul className="list-disc space-y-2 pl-5">
          <li>faire vivre et organiser la communauté TENF ;</li>
          <li>traiter les demandes que vous adressez au staff ;</li>
          <li>afficher les profils membres validés sur le site ;</li>
          <li>organiser les événements et gérer les inscriptions ;</li>
          <li>assurer la sécurité, prévenir les abus et modérer la communauté ;</li>
          <li>améliorer le site et l&apos;expérience des membres.</li>
        </ul>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="base-legale" title="Base légale (en résumé)">
        <div className={styles.sectionGrid2}>
          <div className={styles.infoCard}>
            <p>
              <strong style={{ color: "var(--color-text)" }}>Consentement</strong> — lorsque vous envoyez
              volontairement un formulaire (case dédiée).
            </p>
          </div>
          <div className={styles.infoCard}>
            <p>
              <strong style={{ color: "var(--color-text)" }}>Intérêt légitime</strong> — sécurité,
              modération et bon fonctionnement du site.
            </p>
          </div>
          <div className={`${styles.infoCard} sm:col-span-2`}>
            <p>
              <strong style={{ color: "var(--color-text)" }}>Exécution de votre demande</strong> — contact
              staff ou inscription à un événement.
            </p>
          </div>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="acces" title="Qui peut accéder à vos données ?">
        <ul className="list-disc space-y-2 pl-5">
          <li>les fondateurs TENF ;</li>
          <li>les administrateurs autorisés ;</li>
          <li>le staff concerné, uniquement si cela est nécessaire à sa mission ;</li>
          <li>
            les prestataires techniques (hébergement, base de données, authentification), dans la limite de
            leur rôle.
          </li>
        </ul>
        <p>L&apos;accès est limité au strict nécessaire.</p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="conservation" title="Durée de conservation">
        <p>
          Nous conservons les données le temps nécessaire au traitement de votre demande et au
          fonctionnement de la communauté.
        </p>
        <p>
          Vous pouvez demander une modification ou une suppression légitime en écrivant à{" "}
          <OfficialEmailLink subject="Demande RGPD — TENF" />.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="droits" title="Vos droits">
        <div className={styles.sectionGrid2}>
          <ul className="list-disc space-y-2 pl-5">
            <li>l&apos;accès à vos données ;</li>
            <li>leur rectification ;</li>
            <li>leur suppression ;</li>
          </ul>
          <ul className="list-disc space-y-2 pl-5">
            <li>vous opposer à un traitement ;</li>
            <li>limiter un traitement ;</li>
            <li>retirer votre consentement lorsque applicable.</li>
          </ul>
        </div>
        <div className={styles.highlightBox}>
          <p>
            <strong style={{ color: "var(--color-text)" }}>Canal RGPD :</strong>{" "}
            <OfficialEmailLink subject="Exercice de mes droits RGPD — TENF" /> ({TENF_RGPD_EMAIL})
          </p>
          <p className="mt-2 text-sm">
            Formulaire :{" "}
            <Link href="/contact" className={linkClass} style={{ color: "#c4b5fd" }}>
              contact
            </Link>{" "}
            — précisez « Données personnelles / RGPD ».
          </p>
          <p className="mt-2 text-sm">
            En cas de difficulté non résolue :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              style={{ color: "#fca5a5" }}
            >
              CNIL
            </a>
            .
          </p>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="securite" title="Sécurité">
        <p>
          Nous mettons en place des mesures raisonnables pour protéger vos données (accès restreints,
          authentification, hébergement sécurisé). Aucun système n&apos;est invulnérable : n&apos;envoyez pas de
          mots de passe ou d&apos;informations ultra-sensibles via les formulaires publics.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="cookies" title="Cookies et stockage local">
        <p>
          Le site peut utiliser des cookies ou un stockage local pour la session, le thème d&apos;affichage ou
          la sécurité. Twitch, Discord et les autres services tiers appliquent leurs propres règles lorsque
          vous les utilisez.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="evolution" title="Évolution de cette politique">
        <p>
          Cette politique peut être mise à jour. Les changements importants pourront être signalés sur le site
          ou sur Discord.
        </p>
      </LegalSection>

      <p className="text-xs opacity-80">
        Dernière mise à jour : juin 2026. Document informatif — ne remplace pas un avis juridique
        professionnel.
      </p>
    </LegalPageShell>
  );
}
