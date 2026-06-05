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
  TENF_OFFICIAL_NAME,
  TENF_PRIVACY_CAUTION_NOTICE,
  TENF_PRIVACY_COOKIES_ITEMS,
  TENF_PRIVACY_DATA_CATEGORIES,
  TENF_PRIVACY_DATA_SOURCES,
  TENF_PRIVACY_LEGAL_BASES,
  TENF_PRIVACY_MINORS_NOTE,
  TENF_PRIVACY_NO_SALE,
  TENF_PRIVACY_PROCESSORS,
  TENF_PRIVACY_PUBLIC_PROFILE_NOTE,
  TENF_PRIVACY_PURPOSES_DETAILED,
  TENF_PRIVACY_RETENTION_RULES,
  TENF_PRIVACY_SCOPE,
  TENF_PRIVACY_SECURITY_MEASURES,
  TENF_PRIVACY_THIRD_SERVICES_NOTE,
  TENF_PRIVACY_USER_RIGHTS,
  TENF_RGPD_EMAIL,
} from "@/lib/legal/constants";
import { INTELLECTUAL_PROPERTY_PATH, LEGAL_NOTICE_PATH } from "@/lib/legal/privacyConsent";

export const metadata: Metadata = {
  title: "Politique de confidentialité — TENF",
  description:
    "Politique de confidentialité TENF : données collectées, finalités, bases légales, droits RGPD, cookies et contact.",
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
  { id: "perimetre", label: "Périmètre" },
  { id: "donnees", label: "Données collectées" },
  { id: "sources", label: "Origine des données" },
  { id: "finalites", label: "Finalités" },
  { id: "base-legale", label: "Base légale" },
  { id: "acces", label: "Accès aux données" },
  { id: "prestataires", label: "Prestataires" },
  { id: "conservation", label: "Conservation" },
  { id: "profils-publics", label: "Profils publics" },
  { id: "droits", label: "Vos droits" },
  { id: "securite", label: "Sécurité" },
  { id: "cookies", label: "Cookies" },
  { id: "services-tiers", label: "Services tiers" },
  { id: "mineurs", label: "Mineurs" },
  { id: "evolution", label: "Évolution" },
] as const;

const linkClass = "font-semibold underline underline-offset-2 transition hover:opacity-80";

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
              <span className={styles.infoCardLabel}>Contact RGPD</span>
              <br />
              <OfficialEmailLink subject="Contact TENF — Données personnelles" />
              <span className="mt-1 block text-xs opacity-80">({TENF_RGPD_EMAIL})</span>
            </p>
          </div>
        </div>
        <div className={styles.highlightBox}>
          <p className="font-semibold" style={{ color: "var(--color-text)" }}>
            Adresse postale de l&apos;éditeur
          </p>
          <p className="mt-2 text-sm">{TENF_EDITOR_ADDRESS_NOTICE}</p>
          <p className="mt-2 text-sm">{TENF_EDITOR_ADDRESS_LEGAL_NOTE}</p>
        </div>
        <p>
          Cette page vous explique, en termes clairs, quelles données peuvent être collectées, pourquoi,
          pendant combien de temps, qui peut y accéder et quels sont vos droits — sans jargon inutile.
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Voir aussi :{" "}
          <Link href={LEGAL_NOTICE_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Mentions légales
          </Link>
          {" · "}
          <Link href={INTELLECTUAL_PROPERTY_PATH} className={linkClass} style={{ color: "#c4b5fd" }}>
            Propriété intellectuelle
          </Link>
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="perimetre" title="Périmètre de cette politique">
        <p>{TENF_PRIVACY_SCOPE}</p>
        <div className={styles.sectionGrid2}>
          <div className={styles.infoCard}>
            <p className={styles.infoCardLabel}>Couvert par cette page</p>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 text-sm">
              <li>navigation sur le site public</li>
              <li>connexion et espace membre</li>
              <li>formulaires, inscriptions et demandes</li>
              <li>données techniques de sécurité et de fonctionnement</li>
            </ul>
          </div>
          <div className={`${styles.infoCard} ${styles.sideCardRed}`}>
            <p className={styles.infoCardLabel}>Hors périmètre direct</p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Les règles propres à Discord, Twitch ou à un service tiers s&apos;appliquent lorsque vous
              utilisez leurs plateformes en dehors du site TENF.
            </p>
          </div>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="donnees" title="Quelles données pouvons-nous collecter ?">
        <p>Selon l&apos;usage du site ou des formulaires, nous pouvons traiter les catégories suivantes :</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TENF_PRIVACY_DATA_CATEGORIES.map((category) => (
            <div
              key={category.title}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: "color-mix(in srgb, #9146ff 22%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #9146ff 5%, var(--color-card))",
              }}
            >
              <p className="font-bold" style={{ color: "var(--color-text)" }}>
                {category.title}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {category.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.highlightBox}>
          <p className="font-semibold" style={{ color: "var(--color-text)" }}>
            {TENF_PRIVACY_NO_SALE}
          </p>
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="sources" title="D'où viennent ces données ?">
        <p>Les données peuvent provenir notamment :</p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_PRIVACY_DATA_SOURCES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Vous restez responsable de l&apos;exactitude des informations que vous nous transmettez et de ce
          que vous choisissez d&apos;afficher publiquement sur votre profil.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="finalites" title="Pourquoi utilisons-nous ces données ?">
        <p>Les données peuvent être utilisées pour les finalités suivantes :</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TENF_PRIVACY_PURPOSES_DETAILED.map((purpose) => (
            <li
              key={purpose.title}
              className="rounded-lg border px-3 py-3"
              style={{
                borderColor: "color-mix(in srgb, #dc2626 16%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #dc2626 4%, var(--color-card))",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {purpose.title}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {purpose.detail}
              </p>
            </li>
          ))}
        </ul>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="base-legale" title="Base légale">
        <p>En résumé, nos traitements peuvent reposer sur :</p>
        <div className={styles.sectionGrid2}>
          {TENF_PRIVACY_LEGAL_BASES.map((base) => (
            <div key={base.title} className={styles.infoCard}>
              <p className="font-bold" style={{ color: "var(--color-text)" }}>
                {base.title}
              </p>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {base.detail}
              </p>
            </div>
          ))}
        </div>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="acces" title="Qui peut accéder aux données ?">
        <p>Les données peuvent être accessibles uniquement :</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>aux fondateurs TENF ;</li>
          <li>aux administrateurs autorisés ;</li>
          <li>au staff concerné, uniquement si cela est nécessaire à sa mission (modération, événement, support, technique) ;</li>
          <li>
            aux prestataires techniques agissant pour notre compte, dans la limite strictement nécessaire à
            leur intervention.
          </li>
        </ul>
        <p>L&apos;accès est limité au strict nécessaire et selon les rôles autorisés.</p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="prestataires" title="Prestataires et sous-traitants">
        <p>
          Pour faire fonctionner le site, TENF peut s&apos;appuyer sur des prestataires techniques. Ils
          n&apos;accèdent aux données que dans la mesure requise par leurs missions.
        </p>
        <ul className="space-y-3">
          {TENF_PRIVACY_PROCESSORS.map((processor) => (
            <li
              key={processor.name}
              className="rounded-xl border px-4 py-3"
              style={{
                borderColor: "color-mix(in srgb, #9146ff 18%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #9146ff 4%, var(--color-card))",
              }}
            >
              <p className="font-bold" style={{ color: "var(--color-text)" }}>
                {processor.name}
              </p>
              <p className="mt-1 text-sm">{processor.role}</p>
              <p className="mt-1.5 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {processor.note}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Certains prestataires peuvent être situés hors Union européenne. Dans ce cas, TENF vise à encadrer
          ces transferts avec des garanties appropriées selon la nature du service utilisé.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="conservation" title="Durée de conservation">
        <p>
          Nous conservons les données le temps nécessaire au traitement de votre demande, au fonctionnement de
          la communauté ou à la sécurité du site.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_PRIVACY_RETENTION_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
        <p>
          Vous pouvez demander la modification ou la suppression légitime de vos données en écrivant à :{" "}
          <OfficialEmailLink subject="Demande RGPD — TENF" />.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="profils-publics" title="Profils publics et visibilité">
        <p>{TENF_PRIVACY_PUBLIC_PROFILE_NOTE}</p>
        <p>
          Si vous souhaitez limiter certaines informations, vous pouvez mettre à jour votre profil dans
          l&apos;espace membre lorsque l&apos;option est disponible, ou contacter le staff pour examiner les
          possibilités de retrait ou de correction.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="droits" title="Vos droits">
        <p>Conformément au RGPD, vous pouvez demander :</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TENF_PRIVACY_USER_RIGHTS.map((entry) => (
            <li
              key={entry.right}
              className="rounded-lg border px-3 py-3 text-sm"
              style={{
                borderColor: "color-mix(in srgb, #9146ff 18%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #9146ff 4%, var(--color-card))",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {entry.right}
              </p>
              <p className="mt-1 leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
                {entry.detail}
              </p>
            </li>
          ))}
        </ul>
        <div className={styles.highlightBox}>
          <p>
            <strong style={{ color: "var(--color-text)" }}>Contact RGPD :</strong>{" "}
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
            Nous pourrons vous demander de préciser votre identité ou votre login Discord/Twitch afin de
            traiter votre demande de manière sécurisée.
          </p>
          <p className="mt-2 text-sm">
            En cas de difficulté non résolue, vous pouvez contacter la{" "}
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
        <p>Nous mettons en place des mesures raisonnables pour protéger vos données, notamment :</p>
        <ul className="list-disc space-y-2 pl-5">
          {TENF_PRIVACY_SECURITY_MEASURES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Aucun système n&apos;est invulnérable : n&apos;envoyez pas de mot de passe ou d&apos;information
          ultra-sensible via les formulaires publics. En cas d&apos;incident ayant un impact sur vos données,
          TENF pourra prendre les mesures de correction et de notification appropriées selon la gravité de la
          situation.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="cookies" title="Cookies et stockage local">
        <p>Le site peut utiliser des cookies ou du stockage local pour :</p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {TENF_PRIVACY_COOKIES_ITEMS.map((item) => (
            <li
              key={item.title}
              className="rounded-lg border px-3 py-3"
              style={{
                borderColor: "color-mix(in srgb, #dc2626 14%, var(--color-border))",
                backgroundColor: "color-mix(in srgb, #dc2626 4%, var(--color-card))",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--color-text)" }}>
                {item.title}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Vous pouvez configurer votre navigateur pour limiter certains cookies ; cela peut toutefois
          dégrader certaines fonctionnalités du site, notamment la connexion membre.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="services-tiers" title="Services tiers (Discord, Twitch, réseaux)">
        <p>{TENF_PRIVACY_THIRD_SERVICES_NOTE}</p>
        <p>
          La connexion via Discord permet d&apos;identifier votre compte membre. Les données visibles
          dépendent des autorisations que vous accordez lors de l&apos;authentification et des informations
          que vous choisissez ensuite de compléter sur TENF.
        </p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="mineurs" title="Mineurs">
        <p>{TENF_PRIVACY_MINORS_NOTE}</p>
      </LegalSection>

      <hr className={styles.divider} />

      <LegalSection id="evolution" title="Évolution de cette politique">
        <p>
          Cette politique peut être mise à jour pour refléter l&apos;évolution du site, des outils
          communautaires ou du cadre légal. Les changements importants pourront être signalés sur le site ou
          sur Discord.
        </p>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          Nous vous invitons à consulter cette page régulièrement, notamment avant d&apos;utiliser un
          nouveau formulaire ou une nouvelle fonctionnalité membre.
        </p>
      </LegalSection>

      <div className={styles.highlightBox}>
        <p className="text-sm">{TENF_PRIVACY_CAUTION_NOTICE}</p>
      </div>

      <p className="text-xs opacity-80">Dernière mise à jour : juin 2026.</p>
    </LegalPageShell>
  );
}
