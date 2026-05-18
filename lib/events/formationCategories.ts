/**
 * Catégories de formation TENF — source unique pour admin, API et affichage public.
 */

export type FormationCategoryKey =
  | "streaming_tools"
  | "twitch_best_practices"
  | "moderation_live_management"
  | "channel_branding_growth"
  | "creator_management_organization"
  | "creator_wellbeing"
  | "awareness_inclusion"
  | "community_drama_prevention"
  | "tenf_academy";

export type FormationCategoryDefinition = {
  key: FormationCategoryKey;
  label: string;
  description: string;
  examples: string[];
};

export const FORMATION_CATEGORY_OPTIONS: FormationCategoryDefinition[] = [
  {
    key: "streaming_tools",
    label: "Streaming & Outils",
    description:
      "Formations liées aux outils techniques du streaming, à la configuration du live et à la création de contenu.",
    examples: ["OBS", "Stream Deck", "Wizebot", "alertes", "points de chaîne", "montage vidéo"],
  },
  {
    key: "twitch_best_practices",
    label: "Twitch & Bonnes Pratiques",
    description:
      "Formations pour comprendre le fonctionnement de Twitch, ses règles, ses usages et les bons comportements à adopter sur la plateforme.",
    examples: [
      "Comprendre Twitch et ses règles",
      "faire un raid",
      "envoyer un raid correctement",
      "recevoir un raid",
      "accueillir une communauté",
    ],
  },
  {
    key: "moderation_live_management",
    label: "Modération & Gestion du Live",
    description:
      "Formations liées à la sécurité du live, à la gestion du chat et au rôle des modérateurs Twitch.",
    examples: [
      "Modération Twitch",
      "gérer son chat",
      "réagir aux comportements toxiques",
      "choisir ses modérateurs",
      "préparer ses commandes de modération",
    ],
  },
  {
    key: "channel_branding_growth",
    label: "Image & Développement de Chaîne",
    description:
      "Formations pour aider les créateurs à améliorer leur image, leur identité visuelle, leur communication et leur visibilité.",
    examples: [
      "Branding Twitch",
      "image de chaîne",
      "communication Twitch et réseaux sociaux",
      "création d'un serveur Discord",
      "amélioration de la présentation de chaîne",
    ],
  },
  {
    key: "creator_management_organization",
    label: "Gestion & Organisation du Créateur",
    description:
      "Formations pour aider les streamers à mieux organiser leur activité, leurs projets, leurs finances et leur progression.",
    examples: [
      "Gestion de budget",
      "analyser ses statistiques sainement",
      "organiser son planning",
      "fixer des objectifs réalistes",
      "préparer ses projets Twitch",
    ],
  },
  {
    key: "creator_wellbeing",
    label: "Bien-être du Créateur",
    description:
      "Formations centrées sur l'équilibre personnel, la confiance, la gestion du stress et la protection émotionnelle du créateur.",
    examples: [
      "Confiance en soi",
      "gestion émotionnelle",
      "syndrome de l'imposteur",
      "stress du streaming",
      "savoir poser ses limites",
    ],
  },
  {
    key: "awareness_inclusion",
    label: "Sensibilisation & Inclusion",
    description:
      "Formations de sensibilisation autour du respect, de l'inclusion, de la santé, du handicap invisible et de la lutte contre les discriminations.",
    examples: [
      "Sensibilisation contre l'homophobie",
      "maladie de l'hypophyse",
      "handicap invisible",
      "respect des différences",
      "harcèlement et cyberharcèlement",
    ],
  },
  {
    key: "community_drama_prevention",
    label: "Communauté & Prévention des Dramas",
    description:
      "Formations pour mieux vivre en communauté, prévenir les tensions, gérer les conflits et éviter les dramas inutiles.",
    examples: [
      "Gestion des dramas",
      "communication bienveillante",
      "gérer les tensions",
      "donner un retour constructif",
      "se protéger des comportements toxiques",
    ],
  },
  {
    key: "tenf_academy",
    label: "TENF Academy",
    description:
      "Formations ou modules liés à l'accompagnement avancé des créateurs dans le cadre de la TENF Academy.",
    examples: [
      "Formation TENF Academy",
      "analyse de live",
      "auto-évaluation",
      "retours entre créateurs",
      "progression accompagnée",
    ],
  },
];

const BY_KEY = new Map(FORMATION_CATEGORY_OPTIONS.map((item) => [item.key, item]));

export function isFormationCategoryKey(value: string): value is FormationCategoryKey {
  return BY_KEY.has(value as FormationCategoryKey);
}

export function getFormationCategoryByKey(key: string | null | undefined): FormationCategoryDefinition | null {
  if (!key || !isFormationCategoryKey(key)) return null;
  return BY_KEY.get(key) ?? null;
}

export function formationCategoryLabel(key: string | null | undefined): string | null {
  return getFormationCategoryByKey(key)?.label ?? null;
}
