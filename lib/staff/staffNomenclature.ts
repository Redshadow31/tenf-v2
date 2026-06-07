/**
 * Nomenclature officielle TENF — rôles staff & pôles de mission.
 *
 * Source de vérité humaine (labels publics, descriptions, missions) pour :
 *   - la page /organisation-staff
 *   - les composants de présentation du staff
 *   - l'organigramme public
 *   - les pages d'intégration / candidature
 *   - tout texte UX référant à la structure du staff
 *
 * Les CLÉS techniques sont historiquement définies dans `lib/staff/orgChartTypes.ts`
 * (OrgChartRoleKey / OrgChartPoleKey) afin de préserver la rétrocompatibilité avec :
 *   - l'enum PostgreSQL `member_role`
 *   - les colonnes `role_key`, `pole_key`, `pole_label` de `staff_org_chart_entries`
 *   - la couche permissions `AdminRole`
 *   - le système de badges `roleBadgeSystem.ts`
 *
 * Ce fichier mappe les clés techniques aux nouveaux labels & descriptions
 * et ajoute les nouveaux rôles/pôles introduits par la refonte de l'organisation.
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  Compass,
  Crown,
  GraduationCap,
  Heart,
  HeartHandshake,
  History,
  Megaphone,
  Network,
  Palette,
  PersonStanding,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  UserCheck,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";

// ============================================================================
// RÔLES PRINCIPAUX DU STAFF
// ============================================================================

export type StaffRoleKey =
  | "FONDATEUR_TENF"
  | "COORDINATEUR_TENF"
  | "MODERATEUR_TENF"
  | "MODERATEUR_AUTONOMIE"
  | "MODERATEUR_ACCOMPAGNEMENT"
  | "MODERATEUR_DECOUVERTE"
  | "SOUTIEN_TENF"
  | "CONTRIBUTEUR_INVITE_TENF"
  | "ANCIEN_STAFF_TENF";

export type StaffRoleFamily =
  | "direction"
  | "coordination"
  | "moderation"
  | "appui";

export interface StaffRoleDefinition {
  key: StaffRoleKey;
  label: string;
  short: string;
  family: StaffRoleFamily;
  accent: string; // couleur d'accent (palette site)
  Icon: LucideIcon;
  description: string;
  missions: string[];
  /** Clés legacy historiquement utilisées pour ce rôle (pour migrations & affichage des données existantes). */
  legacyKeys: string[];
  /** Libellés legacy historiquement affichés (pour mapping inverse). */
  legacyLabels: string[];
}

export const STAFF_ROLES: StaffRoleDefinition[] = [
  {
    key: "FONDATEUR_TENF",
    label: "Fondateurs TENF",
    short: "Vision globale et garants de l'identité TENF.",
    family: "direction",
    accent: "#3b82f6",
    Icon: Crown,
    description:
      "Créateurs et administrateurs principaux de TENF. Ils portent la vision globale du serveur, valident les grandes décisions, protègent l'identité de la communauté et garantissent la cohérence entre Discord, le site, les événements, les formations, les partenariats et l'évolution du projet.",
    missions: [
      "Définir l'orientation générale de TENF.",
      "Valider les grandes décisions.",
      "Superviser les pôles et les coordinateurs.",
      "Gérer les situations sensibles.",
      "Garantir la cohérence du projet dans la durée.",
    ],
    legacyKeys: ["FONDATEUR", "ADMIN_FONDATEUR", "FOUNDER"],
    legacyLabels: ["Admin", "Admin Fondateur", "Admin Fondateurs", "Fondateur"],
  },
  {
    key: "COORDINATEUR_TENF",
    label: "Coordinateurs TENF",
    short: "Bras droits des fondateurs, fluidité de l'organisation.",
    family: "coordination",
    accent: "#6366f1",
    Icon: Network,
    description:
      "Bras droits des fondateurs. Ils assurent la coordination opérationnelle, suivent les actions en cours, accompagnent les pôles et évitent que toute la charge repose uniquement sur les fondateurs.",
    missions: [
      "Faire le lien entre les pôles.",
      "Suivre les projets et validations.",
      "Aider à prioriser les actions.",
      "Accompagner les responsables de pôles.",
      "Remonter les informations importantes à la direction.",
    ],
    legacyKeys: ["ADMIN_COORDINATEUR", "ADMIN_ADJOINT"],
    legacyLabels: ["Admin Coordinateur", "Admin Adjoint", "Admin coordinateur"],
  },
  {
    key: "MODERATEUR_TENF",
    label: "Modérateur TENF",
    short: "Modérateur confirmé, garant du cadre au quotidien.",
    family: "moderation",
    accent: "#a855f7",
    Icon: ShieldCheck,
    description:
      "Membre confirmé du staff chargé de faire respecter le cadre TENF, d'accompagner les membres, de participer au bon fonctionnement du serveur et de contribuer à une ambiance saine et bienveillante.",
    missions: [
      "Accueillir et orienter les membres.",
      "Intervenir calmement en cas de tension.",
      "Faire des remontées claires.",
      "Participer aux pôles selon ses missions.",
      "Représenter l'esprit d'entraide de TENF.",
    ],
    legacyKeys: ["MODERATEUR", "MODO_MENTOR"],
    legacyLabels: [
      "Modérateur",
      "Modérateurs",
      "Modérateur actif",
      "Modérateur Mentor",
      "Mentor",
    ],
  },
  {
    key: "MODERATEUR_AUTONOMIE",
    label: "Modérateur en Autonomie",
    short: "Dernière phase de formation, intervient en autonomie sur les cas courants.",
    family: "moderation",
    accent: "#c084fc",
    Icon: UserCheck,
    description:
      "Modérateur en dernière phase de formation. Il agit avec une vraie autonomie sur les situations courantes, tout en restant accompagné pour les cas plus sensibles ou complexes.",
    missions: [
      "Gérer des situations simples avec autonomie.",
      "Participer activement à son ou ses pôles.",
      "Faire des remontées structurées.",
      "Demander validation lorsque nécessaire.",
      "Préparer sa validation comme modérateur confirmé.",
    ],
    legacyKeys: [],
    legacyLabels: [],
  },
  {
    key: "MODERATEUR_ACCOMPAGNEMENT",
    label: "Modérateur en Accompagnement",
    short: "Phase intermédiaire, intervient avec suivi régulier.",
    family: "moderation",
    accent: "#d8b4fe",
    Icon: GraduationCap,
    description:
      "Modérateur en phase intermédiaire de formation. Il commence à intervenir davantage, mais avec un suivi, des retours et un accompagnement régulier.",
    missions: [
      "Observer et pratiquer avec accompagnement.",
      "Apprendre la posture TENF.",
      "Participer à certains pôles selon son profil.",
      "Appliquer les retours reçus.",
      "Progresser vers plus d'autonomie.",
    ],
    legacyKeys: ["MODERATEUR_EN_FORMATION", "MODO_JUNIOR"],
    legacyLabels: [
      "Modérateur en formation",
      "Modérateur Junior",
      "Modérateur en Formation",
    ],
  },
  {
    key: "MODERATEUR_DECOUVERTE",
    label: "Modérateur en Découverte",
    short: "Première étape, observation et apprentissage des bases.",
    family: "moderation",
    accent: "#e9d5ff",
    Icon: BookOpenCheck,
    description:
      "Première étape du parcours de modération. La personne découvre le fonctionnement du staff, observe, apprend les bases et commence à comprendre la posture attendue.",
    missions: [
      "Lire les repères staff.",
      "Découvrir les procédures.",
      "Observer les échanges.",
      "Poser des questions.",
      "Participer à des tâches simples et encadrées.",
    ],
    legacyKeys: [],
    legacyLabels: [],
  },
  {
    key: "SOUTIEN_TENF",
    label: "Soutien TENF",
    short: "Aide active du staff sur une mission concrète en cours.",
    family: "appui",
    accent: "#22c55e",
    Icon: Heart,
    description:
      "Membre qui aide activement le staff sur une mission concrète et actuelle — ponctuelle ou régulière — sans exercer de modération active. Ce rôle reflète une contribution opérationnelle en cours, pas une reconnaissance passée.",
    missions: [
      "Aider sur un besoin ciblé et actuel.",
      "Contribuer à un pôle selon sa mission en cours.",
      "Respecter le cadre staff.",
      "Faire remonter les besoins ou limites.",
      "Renforcer l'équipe sans brouiller les responsabilités.",
    ],
    legacyKeys: ["SOUTIEN_TENF"],
    legacyLabels: ["Soutien TENF"],
  },
  {
    key: "ANCIEN_STAFF_TENF",
    label: "Ancien Staff TENF",
    short: "Reconnaissance d'un investissement passé dans l'équipe.",
    family: "appui",
    accent: "#d4a853",
    Icon: History,
    description:
      "Ancien membre du staff TENF ayant contribué à la construction, au développement ou à la vie de la communauté. Ce rôle est une reconnaissance de son investissement passé et ne correspond pas à une fonction active dans l'organisation actuelle.",
    missions: [],
    legacyKeys: ["ANCIEN_STAFF_TENF"],
    legacyLabels: ["Ancien Staff TENF"],
  },
  {
    key: "CONTRIBUTEUR_INVITE_TENF",
    label: "Contributeur Invité TENF",
    short: "Invité temporairement pour un projet précis.",
    family: "appui",
    accent: "#14b8a6",
    Icon: Sparkles,
    description:
      "Personne invitée temporairement dans un cadre staff pour aider sur un projet précis, généralement pour une période limitée.",
    missions: [
      "Participer uniquement au projet confié.",
      "Respecter le périmètre défini.",
      "Communiquer avec le référent du projet.",
      "Aider sur une période déterminée.",
      "Clore proprement sa contribution à la fin de la mission.",
    ],
    legacyKeys: ["CONTRIBUTEUR_TENF"],
    legacyLabels: ["Contributeur TENF"],
  },
];

/** Familles de rôles, pour regroupements visuels. */
export const STAFF_ROLE_FAMILIES: Array<{
  key: StaffRoleFamily;
  label: string;
  caption: string;
  Icon: LucideIcon;
  accent: string;
}> = [
  {
    key: "direction",
    label: "Direction",
    caption: "Vision globale et arbitrages.",
    Icon: Compass,
    accent: "#3b82f6",
  },
  {
    key: "coordination",
    label: "Coordination",
    caption: "Lien entre les pôles et fluidité.",
    Icon: Network,
    accent: "#6366f1",
  },
  {
    key: "moderation",
    label: "Modération",
    caption: "Cadre, sécurité et accompagnement.",
    Icon: Shield,
    accent: "#a855f7",
  },
  {
    key: "appui",
    label: "Appui ponctuel",
    caption: "Soutien et contributions ciblées.",
    Icon: Heart,
    accent: "#22c55e",
  },
];

// ============================================================================
// PÔLES DE MISSION
// ============================================================================

export type StaffPoleKey =
  | "POLE_VISION_PILOTAGE"
  | "POLE_COORDINATION"
  | "POLE_VIE_STAFF"
  | "POLE_CADRE_FORMATION_STAFF"
  | "POLE_PARCOURS_MEMBRES"
  | "POLE_ANIMATIONS_ATELIERS_CREATEURS"
  | "POLE_IMAGE_RAYONNEMENT"
  | "POLE_OUTILS_DEVELOPPEMENT"
  | "POLE_VEILLE_SITUATIONS_SENSIBLES";

export interface StaffPoleDefinition {
  key: StaffPoleKey;
  label: string;
  shortLabel: string;
  emoji: string;
  accent: string;
  Icon: LucideIcon;
  tagline: string;
  description: string;
  missions: string[];
  /** Indice quotidien à destination des membres pour repérer le pôle utile. */
  memberTip: string;
  /** Si vrai, le pôle est plus restreint (visibilité réduite). */
  restricted?: boolean;
  /** Anciennes clés historiquement utilisées (référencées par la base / l'API). */
  legacyKeys: string[];
  /** Anciens libellés (pour mapping inverse texte). */
  legacyLabels: string[];
}

export const STAFF_POLES: StaffPoleDefinition[] = [
  {
    key: "POLE_VISION_PILOTAGE",
    label: "Pôle Vision & Pilotage",
    shortLabel: "Vision & Pilotage",
    emoji: "🧭",
    accent: "#3b82f6",
    Icon: Compass,
    tagline: "Cap, valeurs et grandes décisions.",
    description:
      "Pôle chargé de la vision globale, des grandes décisions, des arbitrages, de la stratégie et de la cohérence générale de TENF.",
    missions: [
      "Définir l'évolution de TENF.",
      "Valider les décisions stratégiques.",
      "Gérer les situations sensibles.",
      "Protéger l'identité et les valeurs de la communauté.",
      "Assurer une cohérence globale entre Discord, site, staff, événements et partenariats.",
    ],
    memberTip: "C'est l'instance qui valide les grands choix et l'identité de TENF.",
    legacyKeys: [],
    legacyLabels: ["Direction TENF"],
  },
  {
    key: "POLE_COORDINATION",
    label: "Pôle Coordination",
    shortLabel: "Coordination",
    emoji: "🔗",
    accent: "#6366f1",
    Icon: Network,
    tagline: "Faire circuler l'info entre les pôles.",
    description:
      "Pôle chargé de faire le lien entre les différents pôles, de suivre les actions en cours et de fluidifier l'organisation interne.",
    missions: [
      "Suivre les tâches importantes.",
      "Faire circuler les informations.",
      "Relier les pôles entre eux.",
      "Suivre les validations.",
      "Éviter que les projets restent bloqués ou dispersés.",
    ],
    memberTip: "Si tu sens qu'un sujet est dispersé, ce pôle aide à le remettre sur les rails.",
    legacyKeys: [],
    legacyLabels: [],
  },
  {
    key: "POLE_VIE_STAFF",
    label: "Pôle Vie Staff",
    shortLabel: "Vie Staff",
    emoji: "💬",
    accent: "#0ea5e9",
    Icon: Users,
    tagline: "Cohésion d'équipe et repères internes.",
    description:
      "Pôle centré sur la vie quotidienne du staff, les annonces internes, les repères communs, la cohésion et l'accompagnement général de l'équipe.",
    missions: [
      "Diffuser les informations internes.",
      "Maintenir une bonne ambiance staff.",
      "Donner des repères clairs.",
      "Faciliter l'intégration des nouveaux membres du staff.",
      "Centraliser les améliorations internes.",
    ],
    memberTip: "Pôle interne : il assure que l'équipe reste alignée et soudée.",
    legacyKeys: [],
    legacyLabels: ["Staff Central"],
  },
  {
    key: "POLE_CADRE_FORMATION_STAFF",
    label: "Pôle Cadre & Formation Staff",
    shortLabel: "Cadre & Formation Staff",
    emoji: "🛡️",
    accent: "#f59e0b",
    Icon: Shield,
    tagline: "Former et accompagner les modérateurs.",
    description:
      "Pôle chargé de former les modérateurs, d'accompagner les parcours de modération et de maintenir un cadre interne sain et cohérent.",
    missions: [
      "Former les modérateurs en Découverte, Accompagnement et Autonomie.",
      "Transmettre la posture TENF.",
      "Clarifier les procédures internes.",
      "Proposer des cas pratiques.",
      "Améliorer la qualité de la modération.",
    ],
    memberTip:
      "Référent pour la posture de modération et la montée en compétence du staff.",
    legacyKeys: ["POLE_FORMATION_COORD_STAFF"],
    legacyLabels: [
      "Pôle Formation & Coordination Staff",
      "Pôle Formation & Coordination",
    ],
  },
  {
    key: "POLE_PARCOURS_MEMBRES",
    label: "Pôle Parcours Membres",
    shortLabel: "Parcours Membres",
    emoji: "🤝",
    accent: "#f97316",
    Icon: UserPlus,
    tagline: "Accueil, intégration et suivi des membres.",
    description:
      "Pôle chargé d'accompagner les membres depuis leur arrivée jusqu'à leur intégration complète, puis de suivre leur engagement, leurs retours et leur évolution dans la communauté.",
    missions: [
      "Suivre l'accueil et l'intégration.",
      "Observer l'engagement des membres.",
      "Repérer les membres en pause ou en difficulté.",
      "Valoriser les profils investis.",
      "Centraliser les retours et besoins des membres.",
    ],
    memberTip:
      "Premiers pas sur le serveur, parcours d'arrivée, suivi et valorisation des membres.",
    legacyKeys: ["POLE_ACCUEIL_INTEGRATION", "POLE_FORMATION_COORD_MEMBERS"],
    legacyLabels: [
      "Pôle Accueil & Intégration",
      "Pôle Formation & Coordination Membres",
    ],
  },
  {
    key: "POLE_ANIMATIONS_ATELIERS_CREATEURS",
    label: "Pôle Animations & Ateliers Créateurs",
    shortLabel: "Animations & Ateliers Créateurs",
    emoji: "🩷",
    accent: "#ec4899",
    Icon: Star,
    tagline: "Faire vivre la communauté et former les créateurs.",
    description:
      "Pôle chargé de faire vivre la communauté grâce aux événements, animations, soirées, ateliers et formations destinées aux créateurs.",
    missions: [
      "Organiser des événements communautaires.",
      "Proposer des animations Discord ou Twitch.",
      "Préparer les ateliers créateurs.",
      "Gérer les formations membres comme OBS, Wizebot, budget, Twitch, entraide ou TENF Academy.",
      "Faire les bilans des animations et ateliers.",
    ],
    memberTip:
      "Événements, animations et ateliers créateurs : ce pôle pilote le calendrier communautaire.",
    legacyKeys: ["POLE_ANIMATION_EVENTS"],
    legacyLabels: ["Pôle Animation & Événements", "Pôle Animation et Événements"],
  },
  {
    key: "POLE_IMAGE_RAYONNEMENT",
    label: "Pôle Image & Rayonnement",
    shortLabel: "Image & Rayonnement",
    emoji: "📣",
    accent: "#06b6d4",
    Icon: Megaphone,
    tagline: "Image, visuels et communication externe.",
    description:
      "Pôle chargé de l'image de TENF, des annonces, des visuels, des réseaux sociaux, des mises en avant et de la communication externe.",
    missions: [
      "Préparer les annonces.",
      "Créer ou coordonner les visuels.",
      "Mettre en avant les membres, partenaires et projets.",
      "Gérer les publications réseaux.",
      "Préserver un ton cohérent et chaleureux dans la communication TENF.",
    ],
    memberTip:
      "Annonces, visuels et cohérence de l'image TENF en interne et à l'extérieur.",
    legacyKeys: ["POLE_COMMUNICATION_VISUALS"],
    legacyLabels: ["Pôle Communication & Visuels"],
  },
  {
    key: "POLE_OUTILS_DEVELOPPEMENT",
    label: "Pôle Outils & Développement",
    shortLabel: "Outils & Développement",
    emoji: "🛠️",
    accent: "#a855f7",
    Icon: Wrench,
    tagline: "Site, bots, automatisations et outils internes.",
    description:
      "Pôle chargé du site, des bots, des automatisations, des permissions, des tickets, des points, de la boutique et des outils techniques de TENF.",
    missions: [
      "Maintenir le site web.",
      "Corriger les bugs.",
      "Gérer les bots et automatisations.",
      "Suivre les permissions et rôles Discord.",
      "Améliorer les outils internes.",
      "Suivre les systèmes de points, boutique et récompenses.",
    ],
    memberTip:
      "Bugs outils, bots, accès techniques : le bon interlocuteur côté tooling.",
    legacyKeys: ["POLE_TECH_BOTS"],
    legacyLabels: ["Pôle Technique & Bots", "Pôle Technique et Bots"],
  },
  {
    key: "POLE_VEILLE_SITUATIONS_SENSIBLES",
    label: "Pôle Veille & Situations Sensibles",
    shortLabel: "Veille & Situations Sensibles",
    emoji: "🛟",
    accent: "#ef4444",
    Icon: ShieldAlert,
    tagline: "Suivi discret des situations délicates.",
    description:
      "Pôle discret et restreint chargé de suivre les situations délicates, les tensions, les comportements à risque ou les dossiers nécessitant une attention renforcée.",
    missions: [
      "Repérer les situations sensibles.",
      "Suivre les alertes et signaux sensibles.",
      "Préserver la sécurité de la communauté.",
      "Faire remonter les cas importants à la direction.",
      "Garder un suivi factuel et confidentiel.",
    ],
    memberTip:
      "Pôle restreint et discret : il agit en silence pour préserver un cadre sain.",
    restricted: true,
    legacyKeys: [],
    legacyLabels: [],
  },
];

// ============================================================================
// HELPERS DE MAPPING (clés stables ↔ nouvelle nomenclature)
// ============================================================================

/** Renvoie la définition complète d'un rôle, ou null si la clé est inconnue. */
export function getStaffRoleDefinition(
  key: string | null | undefined,
): StaffRoleDefinition | null {
  if (!key) return null;
  const normalized = key.toString().trim();
  const direct = STAFF_ROLES.find((role) => role.key === normalized);
  if (direct) return direct;
  return (
    STAFF_ROLES.find(
      (role) =>
        role.legacyKeys.includes(normalized) ||
        role.legacyLabels.includes(normalized),
    ) || null
  );
}

/** Renvoie la définition complète d'un pôle, ou null si la clé est inconnue. */
export function getStaffPoleDefinition(
  key: string | null | undefined,
): StaffPoleDefinition | null {
  if (!key) return null;
  const normalized = key.toString().trim();
  const direct = STAFF_POLES.find((pole) => pole.key === normalized);
  if (direct) return direct;
  return (
    STAFF_POLES.find(
      (pole) =>
        pole.legacyKeys.includes(normalized) ||
        pole.legacyLabels.includes(normalized),
    ) || null
  );
}

/** Retourne le label TENF officiel pour un rôle (chaîne libre ou clé). */
export function resolveStaffRoleLabel(value: string | null | undefined): string {
  const def = getStaffRoleDefinition(value);
  return def?.label || (value ?? "");
}

/** Retourne le label TENF officiel pour un pôle (chaîne libre ou clé). */
export function resolveStaffPoleLabel(value: string | null | undefined): string {
  const def = getStaffPoleDefinition(value);
  return def?.label || (value ?? "");
}

/** Indices visuels minimaux (utiles pour les helpers org chart). */
export const STAFF_ROLE_OPTIONS = STAFF_ROLES.map((role) => ({
  key: role.key,
  label: role.label,
  family: role.family,
}));

export const STAFF_POLE_OPTIONS = STAFF_POLES.map((pole) => ({
  key: pole.key,
  label: pole.label,
  emoji: pole.emoji,
}));

// ============================================================================
// MESSAGES D'ACCOMPAGNEMENT (utilisés par la section Rôles & Pôles)
// ============================================================================

/** Pôles proposés dans le formulaire de candidature (hors pôle restreint « veille »). */
export const STAFF_CANDIDACY_POLE_INTEREST_OPTIONS: readonly string[] = [
  ...STAFF_POLES.filter((p) => !p.restricted).map((p) => p.shortLabel),
  "Autre (à préciser dans ton message)",
];

export const STAFF_NOMENCLATURE_EXPLAINER = {
  intro:
    "Au sein de TENF, deux notions cohabitent : ton rôle principal indique ta place dans l'équipe, et tes pôles de mission indiquent les domaines dans lesquels tu agis concrètement.",
  examples: [
    "Modérateur TENF + Pôle Parcours Membres.",
    "Soutien TENF + Pôle Image & Rayonnement.",
    "Coordinateurs TENF + Pôle Coordination + Pôle Cadre & Formation Staff.",
    "Contributeur Invité TENF + Pôle Animations & Ateliers Créateurs pour un projet temporaire.",
  ],
  philosophy:
    "Cette organisation vise à mieux répartir les responsabilités sans créer une hiérarchie froide : chacun garde son énergie pour ce qui lui correspond, et personne ne porte tout seul.",
} as const;

// Réexport d'icônes utilitaires (utilisé par certains composants pour les "héros").
export const STAFF_NOMENCLATURE_ICONS = {
  RoleFamily: PersonStanding,
  Helper: HeartHandshake,
  Heart: Heart,
  Brush: Palette,
} as const;
