// Système de rôles admin basé sur Discord IDs
// Tous les accès sont basés STRICTEMENT sur Discord user ID (pas username)

export type AdminRole =
  | "FONDATEUR"
  | "ADMIN_COORDINATEUR"
  | "MODERATEUR"
  | "MODERATEUR_AUTONOMIE"
  | "MODERATEUR_ACCOMPAGNEMENT"
  | "MODERATEUR_DECOUVERTE"
  | "MODERATEUR_EN_PAUSE"
  | "SOUTIEN_TENF"
  | "CONTRIBUTEUR_INVITE";

/** Ordre d’affichage — aligné sur `ORG_CHART_ROLE_OPTIONS` (organigramme staff). */
export const ADMIN_ROLE_ORDER: AdminRole[] = [
  "FONDATEUR",
  "ADMIN_COORDINATEUR",
  "MODERATEUR",
  "MODERATEUR_AUTONOMIE",
  "MODERATEUR_ACCOMPAGNEMENT",
  "MODERATEUR_DECOUVERTE",
  "MODERATEUR_EN_PAUSE",
  "SOUTIEN_TENF",
  "CONTRIBUTEUR_INVITE",
];

/** Rôles assignables sur /admin/gestion-acces/comptes (hors fondateurs). */
export const ASSIGNABLE_ADMIN_ROLES: AdminRole[] = ADMIN_ROLE_ORDER.filter((r) => r !== "FONDATEUR");

/** Hiérarchie pour comparer les niveaux d’accès (plus élevé = plus de droits). */
export const ADMIN_ROLE_HIERARCHY: Record<AdminRole, number> = {
  FONDATEUR: 8,
  ADMIN_COORDINATEUR: 7,
  MODERATEUR: 6,
  MODERATEUR_AUTONOMIE: 5,
  MODERATEUR_ACCOMPAGNEMENT: 4,
  MODERATEUR_DECOUVERTE: 3,
  MODERATEUR_EN_PAUSE: 2,
  SOUTIEN_TENF: 1,
  CONTRIBUTEUR_INVITE: 0,
};

export type LegacyAdminRole =
  | "FOUNDER"
  | "ADMIN_ADJOINT"
  | "MODO_MENTOR"
  | "MODO_JUNIOR"
  | "MODO_PAUSE"
  | "SOUTIEN_TENF";

export type Permission = 
  | "read" 
  | "write" 
  | "validate" 
  | "revert" 
  | "global_revert";

// ============================================
// RÔLES HARDCODÉS (IDs Discord)
// ============================================

export const FOUNDERS: string[] = [
  "1021398088474169414",
  "333001130705420299",
  "535244297214361603",
];

const ADMINS_ADJOINTS: string[] = [
  // Tous les admins adjoints ont été retirés du hardcode
  // Utiliser la page /admin/gestion-acces pour gérer les accès
];

const MODOS_MENTORS: string[] = [
  // Tous les modos mentors ont été retirés du hardcode
  // Utiliser la page /admin/gestion-acces pour gérer les accès
];

const MODOS_JUNIORS: string[] = [
  // Tous les modos juniors ont été retirés du hardcode
  // Utiliser la page /admin/gestion-acces pour gérer les accès
];

// ============================================
// PERMISSIONS PAR RÔLE
// ============================================

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  FONDATEUR: ["read", "write", "validate", "revert", "global_revert"],
  ADMIN_COORDINATEUR: ["read", "write", "validate", "revert"],
  MODERATEUR: ["read", "write", "validate"],
  MODERATEUR_AUTONOMIE: ["read", "write", "validate"],
  MODERATEUR_ACCOMPAGNEMENT: ["read", "write"],
  MODERATEUR_DECOUVERTE: ["read"],
  MODERATEUR_EN_PAUSE: ["read"],
  SOUTIEN_TENF: ["read"],
  CONTRIBUTEUR_INVITE: ["read"],
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole | null {
  if (!role) return null;
  const map: Record<string, AdminRole> = {
    FONDATEUR: "FONDATEUR",
    FOUNDER: "FONDATEUR",
    ADMIN_COORDINATEUR: "ADMIN_COORDINATEUR",
    ADMIN_ADJOINT: "ADMIN_COORDINATEUR",
    MODERATEUR: "MODERATEUR",
    MODO_MENTOR: "MODERATEUR",
    MODERATEUR_AUTONOMIE: "MODERATEUR_AUTONOMIE",
    MODERATEUR_ACCOMPAGNEMENT: "MODERATEUR_ACCOMPAGNEMENT",
    MODERATEUR_EN_FORMATION: "MODERATEUR_ACCOMPAGNEMENT",
    MODO_JUNIOR: "MODERATEUR_ACCOMPAGNEMENT",
    MODERATEUR_DECOUVERTE: "MODERATEUR_DECOUVERTE",
    MODERATEUR_EN_PAUSE: "MODERATEUR_EN_PAUSE",
    MODO_PAUSE: "MODERATEUR_EN_PAUSE",
    SOUTIEN_TENF: "SOUTIEN_TENF",
    CONTRIBUTEUR_INVITE: "CONTRIBUTEUR_INVITE",
    CONTRIBUTEUR_TENF: "CONTRIBUTEUR_INVITE",
  };
  return map[role] || null;
}

// ============================================
// CACHE DES ACCÈS ADMIN
// ============================================
// Le cache Blobs est géré dans lib/adminAccessCache.ts
// pour éviter que le middleware (Edge Runtime) n'importe @netlify/blobs

/**
 * Récupère le rôle d'un utilisateur Discord par son ID
 * Vérifie d'abord les fondateurs hardcodés, puis les données hardcodées
 * Pour le cache Blobs, utiliser getAdminRoleFromCache de lib/adminAccessCache.ts
 */
export function getAdminRole(discordId: string): AdminRole | null {
  // Les fondateurs sont toujours hardcodés et prioritaires
  if (FOUNDERS.includes(discordId)) return "FONDATEUR";
  
  // Fallback sur les données hardcodées (pour compatibilité)
  // Le cache Blobs est vérifié séparément dans les routes API via getAdminRoleFromCache
  if (ADMINS_ADJOINTS.includes(discordId)) return "ADMIN_COORDINATEUR";
  if (MODOS_MENTORS.includes(discordId)) return "MODERATEUR";
  if (MODOS_JUNIORS.includes(discordId)) return "MODERATEUR_ACCOMPAGNEMENT";
  
  return null;
}

/**
 * Vérifie si un utilisateur a un rôle admin
 */
export function hasAdminRole(discordId: string): boolean {
  return getAdminRole(discordId) !== null;
}

/**
 * Vérifie si un utilisateur est founder
 */
export function isFounder(discordId: string): boolean {
  return FOUNDERS.includes(discordId);
}

/**
 * Vérifie si un utilisateur a une permission spécifique
 */
export function hasPermission(
  discordId: string,
  permission: Permission
): boolean {
  const role = getAdminRole(discordId);
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Vérifie si un utilisateur peut effectuer une action
 */
export function canPerformAction(
  discordId: string,
  action: "read" | "write" | "validate" | "revert" | "global_revert"
): boolean {
  return hasPermission(discordId, action);
}

/**
 * Vérifie l'accès au dashboard admin (tous les rôles ont accès)
 * Cette fonction vérifie uniquement les rôles hardcodés.
 * Pour vérifier aussi le cache Blobs, utiliser hasAdminDashboardAccessAsync
 */
export function hasAdminDashboardAccess(discordId: string): boolean {
  return hasAdminRole(discordId);
}


/**
 * Récupère toutes les permissions d'un utilisateur
 */
export function getUserPermissions(discordId: string): Permission[] {
  const role = getAdminRole(discordId);
  if (!role) return [];
  return ROLE_PERMISSIONS[role];
}

/**
 * Récupère le nom d'affichage d'un rôle (nomenclature TENF actuelle).
 *
 * Les CLÉS techniques (`FONDATEUR`, `ADMIN_COORDINATEUR`, …) restent celles
 * stockées dans la base et le cache d'accès admin pour préserver la
 * rétrocompatibilité. Les LABELS sont alignés sur la nouvelle nomenclature
 * (Fondateur TENF / Coordinateur TENF / Modérateur TENF / …).
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    FONDATEUR: "Fondateurs TENF",
    ADMIN_COORDINATEUR: "Coordinateurs TENF",
    MODERATEUR: "Modérateur TENF",
    MODERATEUR_AUTONOMIE: "Modérateur en Autonomie",
    MODERATEUR_ACCOMPAGNEMENT: "Modérateur en Accompagnement",
    MODERATEUR_DECOUVERTE: "Modérateur en Découverte",
    MODERATEUR_EN_PAUSE: "Modérateur en pause",
    SOUTIEN_TENF: "Soutien TENF",
    CONTRIBUTEUR_INVITE: "Contributeur Invité TENF",
  };
  return names[role];
}

/** Classes Tailwind pour les pastilles rôle (page permissions). */
export function getAdminRoleToggleClass(role: AdminRole): string {
  switch (role) {
    case "FONDATEUR":
      return "bg-red-700 ring-red-400/40";
    case "ADMIN_COORDINATEUR":
      return "bg-orange-700 ring-orange-400/35";
    case "MODERATEUR":
      return "bg-orange-600 ring-orange-300/30";
    case "MODERATEUR_AUTONOMIE":
      return "bg-violet-700 ring-violet-400/35";
    case "MODERATEUR_ACCOMPAGNEMENT":
      return "bg-blue-700 ring-blue-400/35";
    case "MODERATEUR_DECOUVERTE":
      return "bg-indigo-700/90 ring-indigo-400/30";
    case "MODERATEUR_EN_PAUSE":
      return "bg-slate-600 ring-slate-400/30";
    case "SOUTIEN_TENF":
      return "bg-teal-700 ring-teal-400/35";
    case "CONTRIBUTEUR_INVITE":
      return "bg-zinc-600 ring-zinc-400/30";
    default:
      return "bg-slate-700 ring-slate-400/25";
  }
}

/**
 * Récupère tous les IDs Discord des admins/staff (hardcodés uniquement)
 * Pour inclure le cache Blobs, utiliser getAllAdminIdsFromCache de lib/adminAccessCache.ts
 */
export function getAllAdminIds(): string[] {
  return [
    ...FOUNDERS,
    ...ADMINS_ADJOINTS,
    ...MODOS_MENTORS,
    ...MODOS_JUNIORS,
  ];
}

