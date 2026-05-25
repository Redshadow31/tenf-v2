export type BadgeVisualVariant =
  | "newcomer"
  | "active-affilie"
  | "active-dev"
  | "active-support"
  | "minor-creator"
  | "minor-community"
  | "community"
  | "staff-founder"
  | "staff-coordinator"
  | "staff-moderator"
  | "staff-trainee"
  | "staff-reduced"
  | "staff-paused"
  | "contributor"
  | "vip"
  | "default";

export type BadgeFamily = "membres" | "mineurs" | "communaute" | "staff" | "special";

type RoleBadgeConfig = {
  label: string;
  variant: BadgeVisualVariant;
  family: BadgeFamily;
};

// Les CLÉS de ce mapping restent identiques aux valeurs historiquement stockées
// (par exemple `members.role` ou la liste `SYSTEM_BADGES`) afin de ne pas casser
// la base de données ; les LABELS affichés sont alignés sur la nouvelle
// nomenclature TENF (Fondateurs TENF, Coordinateurs TENF, paliers modérateur…).
const ROLE_BADGE_CONFIG: Record<string, RoleBadgeConfig> = {
  Nouveau: { label: "Nouveau", variant: "newcomer", family: "membres" },
  "Affilié": { label: "Créateur Affilié", variant: "active-affilie", family: "membres" },
  "Développement": { label: "Créateur en Développement", variant: "active-dev", family: "membres" },
  "Soutien TENF": { label: "Soutien TENF", variant: "active-support", family: "membres" },
  "Créateur Junior": { label: "Créateurs Juniors", variant: "minor-creator", family: "mineurs" },
  "Les P'tits Jeunes": { label: "Les P'tits Jeunes", variant: "minor-community", family: "mineurs" },
  "Communauté": { label: "Communauté", variant: "community", family: "communaute" },
  "Départ": { label: "A quitté TENF", variant: "default", family: "communaute" },
  Banni: { label: "Banni TENF", variant: "default", family: "communaute" },
  Admin: { label: "Fondateurs TENF", variant: "staff-founder", family: "staff" },
  "Admin Fondateurs": { label: "Fondateurs TENF", variant: "staff-founder", family: "staff" },
  "Admin Coordinateur": { label: "Coordinateurs TENF", variant: "staff-coordinator", family: "staff" },
  "Modérateur": { label: "Modérateur TENF", variant: "staff-moderator", family: "staff" },
  "Modérateur en formation": { label: "Modérateur en Accompagnement", variant: "staff-trainee", family: "staff" },
  "Modérateur en activité réduite": { label: "Modérateur en activité réduite", variant: "staff-reduced", family: "staff" },
  "Modérateur en pause": { label: "Modérateur en pause", variant: "staff-paused", family: "staff" },
  "Contributeur TENF du Mois": { label: "Contributeur TENF du Mois", variant: "contributor", family: "special" },
  // Nouveaux libellés issus de la refonte 2026 (organisation staff & pôles)
  "Fondateur TENF": { label: "Fondateurs TENF", variant: "staff-founder", family: "staff" },
  "Fondateurs TENF": { label: "Fondateurs TENF", variant: "staff-founder", family: "staff" },
  "Coordinateur TENF": { label: "Coordinateurs TENF", variant: "staff-coordinator", family: "staff" },
  "Modérateur TENF": { label: "Modérateur TENF", variant: "staff-moderator", family: "staff" },
  "Modérateur en Autonomie": { label: "Modérateur en Autonomie", variant: "staff-moderator", family: "staff" },
  "Modérateur en Accompagnement": { label: "Modérateur en Accompagnement", variant: "staff-trainee", family: "staff" },
  "Modérateur en Découverte": { label: "Modérateur en Découverte", variant: "staff-trainee", family: "staff" },
  "Contributeur Invité TENF": { label: "Contributeur Invité TENF", variant: "contributor", family: "staff" },
  "VIP Élite": { label: "VIP", variant: "vip", family: "special" },
  VIP: { label: "VIP", variant: "vip", family: "special" },
};

const LEGACY_ROLE_ALIASES: Record<string, string> = {
  Fondateur: "Admin",
  "Admin Adjoint": "Admin Coordinateur",
  Mentor: "Modérateur",
  "Modérateur Mentor": "Modérateur",
  "Modérateur Junior": "Modérateur en Accompagnement",
  "Communauté (mineur)": "Communauté",
  // Ponts vers la nouvelle nomenclature TENF
  "Admin Fondateur": "Admin Fondateurs",
  "Admin coordinateur": "Admin Coordinateur",
  "Coordinateur TENF": "Coordinateur TENF",
  "Modérateur en Formation": "Modérateur en formation",
  "Contributeur TENF": "Contributeur Invité TENF",
};

// Ordre d'affichage suggéré dans les pickers (les CLÉS restent compatibles
// avec les valeurs persistées en base ; le label affiché est résolu par
// `getRoleBadgeLabel`).
/** Clés persistées en base — ordre d’affichage staff (nomenclature TENF 2026). */
export const STAFF_MEMBER_ROLE_KEYS = [
  "Admin",
  "Admin Coordinateur",
  "Modérateur",
  "Modérateur en Autonomie",
  "Modérateur en Accompagnement",
  "Modérateur en Découverte",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Soutien TENF",
  "Contributeur Invité TENF",
] as const;

export const COMMUNITY_MEMBER_ROLE_KEYS = [
  "Nouveau",
  "Affilié",
  "Développement",
  "Créateur Junior",
  "Les P'tits Jeunes",
  "Communauté",
  "Contributeur TENF du Mois",
] as const;

export const EXIT_MEMBER_ROLE_KEYS = ["Départ", "Banni"] as const;

export const ROLE_BADGE_PICKER_OPTIONS = [
  ...STAFF_MEMBER_ROLE_KEYS,
  ...COMMUNITY_MEMBER_ROLE_KEYS,
  ...EXIT_MEMBER_ROLE_KEYS,
] as const;

export const MEMBER_ROLE_PICKER_GROUPS = [
  { label: "Staff TENF", keys: STAFF_MEMBER_ROLE_KEYS },
  { label: "Créateurs & communauté", keys: COMMUNITY_MEMBER_ROLE_KEYS },
  { label: "Sorties (inactif forcé)", keys: EXIT_MEMBER_ROLE_KEYS },
] as const;

export const SYSTEM_BADGES = [
  "VIP Élite",
  "Modérateur en Découverte",
  "Modérateur en Accompagnement",
  "Modérateur en Autonomie",
  "Modérateur",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Admin Coordinateur",
  "Admin Fondateurs",
  "Soutien TENF",
  "Contributeur Invité TENF",
  "Contributeur TENF du Mois",
  "Créateur Junior",
  "Les P'tits Jeunes",
] as const;

export function normalizeRoleLabel(value: string): string {
  return LEGACY_ROLE_ALIASES[value] || value;
}

const PICKER_ORDER = new Map<string, number>(
  ROLE_BADGE_PICKER_OPTIONS.map((role, index) => [role, index]),
);

/** Trie les rôles pour filtres / listes (staff en premier, ordre nomenclature). */
export function sortMemberRolesForPicker(roles: Iterable<string>): string[] {
  return [...roles].sort((a, b) => {
    const na = normalizeRoleLabel(a);
    const nb = normalizeRoleLabel(b);
    const ia = PICKER_ORDER.get(na) ?? PICKER_ORDER.get(a) ?? 999;
    const ib = PICKER_ORDER.get(nb) ?? PICKER_ORDER.get(b) ?? 999;
    if (ia !== ib) return ia - ib;
    return getRoleBadgeLabel(a).localeCompare(getRoleBadgeLabel(b), "fr", { sensitivity: "base" });
  });
}

export function getRoleBadgeLabel(value: string): string {
  const normalized = normalizeRoleLabel(value);
  return ROLE_BADGE_CONFIG[normalized]?.label || normalized;
}

export function getRoleBadgeVariant(value: string): BadgeVisualVariant {
  const normalized = normalizeRoleLabel(value);
  return ROLE_BADGE_CONFIG[normalized]?.variant || "default";
}

export function getRoleBadgeClassName(value: string): string {
  const variant = getRoleBadgeVariant(value);
  const base = `role-badge role-badge--${variant}`;
  if (
    variant.startsWith("staff-") ||
    variant === "active-support" ||
    variant === "contributor"
  ) {
    return `${base} role-badge--animated role-badge--shimmer`;
  }
  if (variant === "vip") {
    return `${base} role-badge--shimmer`;
  }
  return base;
}

export function getRoleBadgeFamily(value: string): BadgeFamily {
  const normalized = normalizeRoleLabel(value);
  return ROLE_BADGE_CONFIG[normalized]?.family || "special";
}
