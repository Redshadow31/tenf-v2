/**
 * Liste statique des partenaires TENF.
 *
 * Architecture évolutive : ce fichier reste la source de vérité tant que la liste
 * est courte. Quand elle dépassera ~20 entrées, ce module pourra être remplacé
 * par une lecture DB / Netlify Blobs sans modifier la page (mêmes types).
 *
 * Règle : on n'ajoute jamais ici un partenaire qui n'est pas confirmé par un
 * contenu déjà présent dans le projet (page dédiée, bilan, données admin, etc.).
 */

export type PartnerCategory =
  | "association"
  | "serveur"
  | "evenement"
  | "createur"
  | "outil";

/** Statut d'un partenariat dans le temps. */
export type PartnerStatus = "actif" | "termine" | "ponctuel" | "historique";

export type PartnerHighlight = {
  /** Slug stable (URL friendly), sert d'id. */
  slug: string;
  /** Nom affiché. */
  name: string;
  /** Une phrase courte qui présente le partenaire (carte courte). */
  tagline: string;
  /** Résumé un peu plus long, pour la liste « actuels & passés ». */
  summary?: string;
  /** Résultat concret confirmé par les contenus du projet (chiffre, impact). */
  result?: string;
  /** Catégorie principale (sert au filtrage/groupement). */
  category: PartnerCategory;
  /** Statut du partenariat. */
  status: PartnerStatus;
  /** Lien externe principal. */
  url: string;
  /** Optionnel : URL d'un logo carré (PNG/SVG). */
  logoUrl?: string;
  /** Optionnel : page interne dédiée (ex. /partenaire-tenf pour UPA). */
  internalPath?: string;
  /** Optionnel : marqueur visuel "spotlight" (mise en avant prioritaire). */
  featured?: boolean;
  /** Tags libres pour filtrer ou décrire (max ~3 affichés). */
  tags?: string[];
};

export const PARTNER_CATEGORIES: Record<PartnerCategory, { label: string; description: string }> = {
  association: {
    label: "Associations",
    description: "Structures à but non lucratif partageant nos valeurs d'entraide et de bienveillance.",
  },
  serveur: {
    label: "Serveurs d'entraide",
    description: "Communautés Discord alliées avec lesquelles on construit des ponts.",
  },
  evenement: {
    label: "Événements caritatifs",
    description: "Mobilisations ponctuelles ou récurrentes pour des causes concrètes.",
  },
  createur: {
    label: "Créateurs de projets",
    description: "Initiatives portées par des créateurs qui font bouger l'écosystème.",
  },
  outil: {
    label: "Outils pour streamers",
    description: "Solutions techniques utiles aux créateurs francophones.",
  },
};

/** Libellés humains pour les statuts (utilisés dans les badges). */
export const PARTNER_STATUS_LABELS: Record<PartnerStatus, string> = {
  actif: "Partenariat actif",
  termine: "Édition terminée",
  ponctuel: "Action ponctuelle",
  historique: "Cause soutenue",
};

/**
 * Partenaires confirmés par les contenus du projet.
 *
 * Données reprises :
 *  - UPA — Unis pour l'Avenir : page /partenaire-tenf + DEFAULT_UPA_EVENT_CONTENT
 *    (lib/repositories/UpaEventRepository.ts). Édition commune TENF × UPA du
 *    18 au 26 avril 2026, environ 38 participants, plus de 4 500 € collectés
 *    en 9 jours au profit de la cause "Lutte contre le cancer".
 *  - La Ligue contre le cancer : citée comme bénéficiaire de la campagne UPA × TENF
 *    dans partners.ts (état précédent) et confirmée par la cause soutenue.
 */
export const PARTNERS: PartnerHighlight[] = [
  {
    slug: "upa-event",
    name: "UPA — Unis pour l'Avenir",
    tagline:
      "Première édition caritative TENF × UPA au profit de la Ligue contre le cancer (18 → 26 avril 2026).",
    summary:
      "Pendant 9 jours, streamers TENF, bénévoles et équipes UPA ont mobilisé leurs communautés autour d'une cause solidaire. Une première édition commune dont le bilan complet est disponible sur la page dédiée.",
    result: "Environ 38 participants — plus de 4 500 € collectés en 9 jours.",
    category: "evenement",
    status: "termine",
    url: "https://www.upa-event.fr",
    internalPath: "/partenaire-tenf",
    featured: true,
    tags: ["caritatif", "TENF × UPA", "9 jours"],
  },
  {
    slug: "ligue-contre-le-cancer",
    name: "La Ligue contre le cancer",
    tagline:
      "Cause bénéficiaire de la campagne UPA × TENF : recherche, accompagnement des malades et prévention.",
    summary:
      "Soutenue par l'édition commune TENF × UPA. La Ligue contre le cancer agit sur l'ensemble du territoire pour la recherche, le soutien aux personnes touchées et la prévention.",
    category: "association",
    status: "historique",
    url: "https://www.ligue-cancer.net",
    featured: true,
    tags: ["santé", "association", "France"],
  },
];

/** Retourne les partenaires regroupés par catégorie, dans l'ordre PARTNER_CATEGORIES. */
export function getPartnersByCategory(): Array<{
  category: PartnerCategory;
  label: string;
  description: string;
  items: PartnerHighlight[];
}> {
  return (Object.keys(PARTNER_CATEGORIES) as PartnerCategory[]).map((category) => ({
    category,
    label: PARTNER_CATEGORIES[category].label,
    description: PARTNER_CATEGORIES[category].description,
    items: PARTNERS.filter((p) => p.category === category),
  }));
}
