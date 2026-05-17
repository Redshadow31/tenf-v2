/**
 * Source unique de vérité pour l'arborescence du Centre de modération TENF.
 *
 * Sont dérivés d'ici :
 * - les hubs admin et staff (`/admin/moderation`, `/admin/moderation/staff`)
 * - les pages de groupe / module
 * - la navigation admin (sidebar)
 * - le gate charte (chemins escape autorisés sans signature)
 * - les badges de statut "Actif / En préparation / Bientôt"
 *
 * IMPORTANT
 * - Ne pas modifier les `slug` sans plan de redirect : les URLs sont stables.
 * - `legacy: true` signifie qu'on conserve la route pour rétrocompatibilité
 *   mais qu'elle n'est pas affichée dans la navigation principale.
 * - `persona` distingue ce qui est visible côté admin coordinateur ("admin"),
 *   côté modérateur opérationnel ("staff"), ou les deux ("both").
 * - `status` distingue les modules réellement branchés ("active"),
 *   en construction ("wip") et ceux prévus mais sans logique ("placeholder").
 */

export type ModerationPersona = "admin" | "staff" | "both";
export type ModerationStatus = "active" | "wip" | "placeholder";
export type ModerationTone =
  | "violet"
  | "indigo"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "slate";

export type ModerationModule = {
  /** Slug d'URL dans `[module]`. Stable. */
  slug: string;
  /** Libellé court affiché en sidebar. */
  label: string;
  /** Libellé long (titre de page). Optionnel, fallback sur label. */
  longLabel?: string;
  /** Texte rapide affiché sous le titre. */
  description: string;
  /** Vue dédiée : admin only, staff only, ou les deux. */
  persona: ModerationPersona;
  /** Statut fonctionnel actuel. */
  status: ModerationStatus;
  /** Tonalité de couleur pour l'accent visuel. */
  tone?: ModerationTone;
  /** Mots-clés pour recherche / aide. */
  keywords?: string[];
  /**
   * Indique qu'on garde la route pour rétrocompatibilité, mais qu'elle
   * ne doit plus apparaître dans la navigation principale.
   */
  legacy?: boolean;
  /**
   * Pour les modules `active`, indique brièvement ce qui est ouvert
   * (UI métier vs simple template) — purement informatif.
   */
  hint?: string;
};

export type ModerationGroup = {
  /** Slug d'URL dans `[group]`. Stable. */
  slug: string;
  /** Libellé court affiché en navigation. */
  label: string;
  /** Description du groupe. */
  description: string;
  /** Vue dédiée : admin, staff ou les deux. */
  persona: ModerationPersona;
  /** Tonalité d'accent visuel du groupe. */
  tone: ModerationTone;
  /** Modules contenus. */
  modules: ModerationModule[];
};

/**
 * Arbre canonique. Ordonné selon le parcours UX souhaité.
 * - "Documentation & repères" : charte, annonces, CR, validations
 * - "Exercices & progression"  : exercices mensuels, soumissions, assignations
 * - "Discord & terrain"         : tickets, incidents, cas sensibles
 * - "Pilotage admin"            : config, audit, exports
 */
export const moderationTree: readonly ModerationGroup[] = [
  {
    slug: "info",
    label: "Documentation & repères",
    description: "Charte, annonces staff, comptes-rendus et validations de la charte.",
    persona: "both",
    tone: "indigo",
    modules: [
      {
        slug: "annonces-staff",
        label: "Annonces staff",
        longLabel: "Annonces staff",
        description: "Annonces envoyées à l'équipe modération et au staff TENF.",
        persona: "both",
        status: "active",
        tone: "indigo",
        keywords: ["annonces", "staff", "communication"],
      },
      {
        slug: "charte",
        label: "Charte de modération",
        longLabel: "Charte de modération TENF",
        description: "La charte que chaque modérateur doit lire et signer.",
        persona: "both",
        status: "active",
        tone: "violet",
        keywords: ["charte", "règles", "signature"],
      },
      {
        slug: "validation-charte",
        label: "Validation de la charte",
        longLabel: "Validation de la charte",
        description: "Signature personnelle et historique de tes validations.",
        persona: "staff",
        status: "active",
        tone: "violet",
        keywords: ["validation", "signature", "charte"],
      },
      {
        slug: "comptes-rendus-reunions",
        label: "Comptes-rendus de réunion",
        longLabel: "Comptes-rendus de réunion",
        description: "Lecture des CR envoyés à l'équipe modération.",
        persona: "both",
        status: "active",
        tone: "sky",
        keywords: ["cr", "réunion", "compte-rendu"],
      },
      {
        slug: "annonces",
        label: "Pilotage des annonces",
        description: "Vue admin coordonnée des annonces publiées au staff.",
        persona: "admin",
        status: "wip",
        tone: "indigo",
      },
      {
        slug: "charte-versions",
        label: "Versions de la charte",
        description: "Historique des versions publiées de la charte.",
        persona: "admin",
        status: "wip",
        tone: "violet",
      },
      {
        slug: "charte-validations",
        label: "Validations de la charte",
        longLabel: "Validations de la charte",
        description: "Tableau de bord des signatures et feedbacks reçus.",
        persona: "admin",
        status: "active",
        tone: "violet",
      },
    ],
  },
  {
    slug: "petits-travaux",
    label: "Exercices & progression",
    description: "Exercices mensuels, soumissions et suivi des assignations.",
    persona: "both",
    tone: "emerald",
    modules: [
      {
        slug: "questionnaire-posture",
        label: "Questionnaire posture staff",
        longLabel: "Questionnaire posture staff / CM",
        description:
          "Comprendre ton fonctionnement, ta communication, ton autonomie et ta posture staff.",
        persona: "staff",
        status: "active",
        tone: "emerald",
        keywords: ["questionnaire", "posture", "formation", "cm"],
        hint: "Route dédiée /admin/moderation/staff/questionnaire",
      },
      {
        slug: "exercices-mensuels",
        label: "Mes exercices mensuels",
        longLabel: "Mes exercices mensuels",
        description: "Les scénarios assignés ce mois-ci à ton profil de modérateur.",
        persona: "staff",
        status: "active",
        tone: "emerald",
        keywords: ["exercices", "scénarios", "mensuel"],
      },
      {
        slug: "mes-soumissions",
        label: "Mes soumissions",
        description: "Tes réponses transmises pour relecture.",
        persona: "staff",
        status: "wip",
        tone: "emerald",
        keywords: ["soumissions", "réponses"],
      },
      {
        slug: "mes-validations",
        label: "Mes validations reçues",
        description: "Retours du staff sur tes soumissions.",
        persona: "staff",
        status: "wip",
        tone: "emerald",
      },
      {
        slug: "questionnaires-posture",
        label: "Questionnaires posture staff",
        longLabel: "Suivi questionnaires posture staff",
        description:
          "Réponses, analyses internes, synthèses modérateurs et objectifs sur 3 mois.",
        persona: "admin",
        status: "active",
        tone: "amber",
        keywords: ["questionnaire", "posture", "synthèse", "formation"],
        hint: "Route dédiée /admin/moderation/staff/questionnaires",
      },
      {
        slug: "assignations",
        label: "Assignations mensuelles",
        longLabel: "Assignations d'exercices mensuels",
        description: "Composer la campagne du mois et l'attribuer aux modérateurs.",
        persona: "admin",
        status: "active",
        tone: "amber",
        keywords: ["assignations", "campagne", "exercices"],
      },
      {
        slug: "catalogue-exercices",
        label: "Catalogue d'exercices",
        description: "Bibliothèque des scénarios disponibles.",
        persona: "admin",
        status: "wip",
        tone: "amber",
      },
      {
        slug: "campagnes-mensuelles",
        label: "Campagnes mensuelles",
        description: "Historique et pilotage des campagnes passées.",
        persona: "admin",
        status: "wip",
        tone: "amber",
      },
      {
        slug: "soumissions",
        label: "Suivi des soumissions",
        description: "Vue admin du flux des soumissions à relire.",
        persona: "admin",
        status: "wip",
        tone: "amber",
      },
      {
        slug: "validations",
        label: "Suivi des validations",
        description: "Vue admin des retours envoyés aux modérateurs.",
        persona: "admin",
        status: "wip",
        tone: "amber",
      },
    ],
  },
  {
    slug: "discord",
    label: "Discord & terrain",
    description: "Tickets, incidents et cas sensibles côté Discord.",
    persona: "both",
    tone: "sky",
    modules: [
      {
        slug: "tickets",
        label: "Forum tickets",
        description: "Suivi des tickets de modération sur Discord.",
        persona: "both",
        status: "wip",
        tone: "sky",
      },
      {
        slug: "incidents-streamers",
        label: "Incidents entre streamers",
        description: "Incidents inter-créateurs nécessitant un cadre staff.",
        persona: "both",
        status: "wip",
        tone: "rose",
      },
      {
        slug: "cas-sensibles",
        label: "Comportements & cas sensibles",
        description: "Cas qui ne se gèrent pas seul — escalade staff.",
        persona: "both",
        status: "wip",
        tone: "rose",
      },
      {
        slug: "incidents",
        label: "Incidents Discord",
        description: "Vue admin agrégée des incidents.",
        persona: "admin",
        status: "wip",
        tone: "rose",
        legacy: true,
      },
      {
        slug: "transferts-admin",
        label: "Transferts admin",
        description: "Cas remontés à l'équipe admin pour décision finale.",
        persona: "admin",
        status: "wip",
        tone: "rose",
      },
    ],
  },
  {
    slug: "config",
    label: "Pilotage admin",
    description: "Paramètres, rôles et configuration de la modération.",
    persona: "admin",
    tone: "slate",
    modules: [
      {
        slug: "navigation-labels",
        label: "Labels de navigation",
        description: "Personnalisation des libellés affichés en navigation modération.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
      {
        slug: "roles-permissions",
        label: "Rôles & permissions",
        description: "Distribution des rôles et de leurs permissions.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
      {
        slug: "parametres",
        label: "Paramètres modération",
        description: "Réglages globaux du centre de modération.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
    ],
  },
  {
    slug: "logs",
    label: "Journal & exports",
    description: "Audit, historique et exports des actions de modération.",
    persona: "admin",
    tone: "slate",
    modules: [
      {
        slug: "actions",
        label: "Journal des actions",
        description: "Actions de modération enregistrées avec horodatage et auteur.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
      {
        slug: "status-history",
        label: "Historique des statuts",
        description: "Changements de statut sur les dossiers de modération.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
      {
        slug: "exports",
        label: "Exports & archives",
        description: "Téléchargement des journaux et archives consolidées.",
        persona: "admin",
        status: "wip",
        tone: "slate",
      },
    ],
  },
] as const;

// -----------------------------------------------------------------------------
// HELPERS — toutes les dérivations doivent passer par ces fonctions, pas par
// l'arbre brut, pour rester cohérent en cas de futures évolutions.
// -----------------------------------------------------------------------------

/**
 * Préfixe URL du centre de modération côté admin.
 * Toutes les routes du centre commencent ici.
 */
export const MODERATION_BASE = "/admin/moderation" as const;

/** Sous-section staff (modules opérationnels modérateurs). */
export const MODERATION_STAFF_BASE = "/admin/moderation/staff" as const;

/** Vue (admin = pilotage / staff = opérationnel). */
export type ModerationView = "admin" | "staff";

export function getBaseForView(view: ModerationView): string {
  return view === "admin" ? MODERATION_BASE : MODERATION_STAFF_BASE;
}

/** Construit l'URL canonique d'un module pour une vue donnée. */
export function buildModerationHref(
  view: ModerationView,
  groupSlug: string,
  moduleSlug: string,
): string {
  return `${getBaseForView(view)}/${groupSlug}/${moduleSlug}`;
}

/** Construit l'URL d'un groupe pour une vue donnée. */
export function buildModerationGroupHref(view: ModerationView, groupSlug: string): string {
  return `${getBaseForView(view)}/${groupSlug}`;
}

/**
 * Certains modules actifs utilisent une route dédiée hors `[group]/[module]`.
 * Centralise les redirections pour cartes hub, listes de groupe et router.
 */
export function resolveModerationModuleHref(
  view: ModerationView,
  groupSlug: string,
  moduleSlug: string,
): string {
  if (groupSlug === "petits-travaux" && moduleSlug === "questionnaire-posture") {
    return "/admin/moderation/staff/questionnaire";
  }
  if (groupSlug === "petits-travaux" && moduleSlug === "questionnaires-posture") {
    return "/admin/moderation/staff/questionnaires";
  }
  return buildModerationHref(view, groupSlug, moduleSlug);
}

/**
 * Filtre les groupes / modules visibles pour une vue donnée.
 * Un module `persona: "both"` est visible des deux côtés.
 * Un groupe `persona: "admin"` n'apparaît jamais côté staff.
 */
export function getGroupsForView(view: ModerationView): ModerationGroup[] {
  return moderationTree
    .filter((group) => isVisibleForView(group.persona, view))
    .map((group) => ({
      ...group,
      modules: group.modules.filter(
        (mod) => !mod.legacy && isVisibleForView(mod.persona, view),
      ),
    }))
    .filter((group) => group.modules.length > 0);
}

function isVisibleForView(persona: ModerationPersona, view: ModerationView): boolean {
  if (persona === "both") return true;
  return persona === view;
}

export function findGroup(slug: string): ModerationGroup | undefined {
  return moderationTree.find((group) => group.slug === slug);
}

export function findModule(
  groupSlug: string,
  moduleSlug: string,
): { group: ModerationGroup; module: ModerationModule } | undefined {
  const group = findGroup(groupSlug);
  if (!group) return undefined;
  const moduleEntry = group.modules.find((mod) => mod.slug === moduleSlug);
  if (!moduleEntry) return undefined;
  return { group, module: moduleEntry };
}

/**
 * Liste les chemins admin autorisés sans signature de charte.
 * Dérivé du tree : tout module flaggué `unlockedDuringCharterBlock` apparaît ici.
 * Note : on s'aligne sur le comportement historique = uniquement la charte et la validation.
 */
export const charterEscapeModuleIds: ReadonlyArray<{ group: string; module: string }> = [
  { group: "info", module: "charte" },
  { group: "info", module: "validation-charte" },
] as const;

/**
 * Préfixes d'URL accessibles à un modérateur n'ayant pas encore signé la charte.
 * Utilisé côté middleware Edge (sans accès DB).
 */
export const moderationCharterEscapePrefixes: readonly string[] = charterEscapeModuleIds.flatMap(
  ({ group, module }) => [
    buildModerationHref("staff", group, module),
    // Pas d'équivalent admin : le bypass ne concerne que la zone staff
    // (un admin coordinateur n'est jamais bloqué — cf. adminModerationCharterGate).
  ],
);

/** Statut "lisible" pour les badges UI. */
export function describeStatus(status: ModerationStatus): {
  label: string;
  tone: ModerationTone;
} {
  switch (status) {
    case "active":
      return { label: "Actif", tone: "emerald" };
    case "wip":
      return { label: "En préparation", tone: "amber" };
    case "placeholder":
    default:
      return { label: "Bientôt", tone: "slate" };
  }
}
