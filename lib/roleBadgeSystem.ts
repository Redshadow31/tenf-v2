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

const ROLE_BADGE_CONFIG: Record<string, RoleBadgeConfig> = {
  Nouveau: { label: "Nouveau", variant: "newcomer", family: "membres" },
  "Affilié": { label: "Créateur Affilié", variant: "active-affilie", family: "membres" },
  "Développement": { label: "Créateur en Développement", variant: "active-dev", family: "membres" },
  "Soutien TENF": { label: "Soutien TENF", variant: "active-support", family: "membres" },
  "Créateur Junior": { label: "Créateurs Juniors", variant: "minor-creator", family: "mineurs" },
  "Les P'tits Jeunes": { label: "Les P'tits Jeunes", variant: "minor-community", family: "mineurs" },
  "Communauté": { label: "Communauté", variant: "community", family: "communaute" },
  Admin: { label: "Admin Fondateurs", variant: "staff-founder", family: "staff" },
  "Admin Fondateurs": { label: "Admin Fondateurs", variant: "staff-founder", family: "staff" },
  "Admin Coordinateur": { label: "Admin Coordinateur", variant: "staff-coordinator", family: "staff" },
  "Modérateur": { label: "Modérateurs", variant: "staff-moderator", family: "staff" },
  "Modérateur en formation": { label: "Modérateur en formation", variant: "staff-trainee", family: "staff" },
  "Modérateur en activité réduite": { label: "Modérateur en activité réduite", variant: "staff-reduced", family: "staff" },
  "Modérateur en pause": { label: "Modérateur en pause", variant: "staff-paused", family: "staff" },
  "Contributeur TENF du Mois": { label: "Contributeur TENF du Mois", variant: "contributor", family: "special" },
  "VIP Élite": { label: "VIP", variant: "vip", family: "special" },
  VIP: { label: "VIP", variant: "vip", family: "special" },
};

const LEGACY_ROLE_ALIASES: Record<string, string> = {
  Fondateur: "Admin",
  "Admin Adjoint": "Admin Coordinateur",
  Mentor: "Modérateur",
  "Modérateur Mentor": "Modérateur",
  "Modérateur Junior": "Modérateur en formation",
  "Communauté (mineur)": "Communauté",
};

export const ROLE_BADGE_PICKER_OPTIONS = [
  "Nouveau",
  "Affilié",
  "Développement",
  "Soutien TENF",
  "Créateur Junior",
  "Les P'tits Jeunes",
  "Communauté",
  "Modérateur en formation",
  "Modérateur",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Admin",
  "Admin Coordinateur",
  "Contributeur TENF du Mois",
] as const;

export const SYSTEM_BADGES = [
  "VIP Élite",
  "Modérateur en formation",
  "Modérateur",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Admin Coordinateur",
  "Admin Fondateurs",
  "Soutien TENF",
  "Contributeur TENF du Mois",
  "Créateur Junior",
  "Les P'tits Jeunes",
] as const;

export function normalizeRoleLabel(value: string): string {
  return LEGACY_ROLE_ALIASES[value] || value;
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
