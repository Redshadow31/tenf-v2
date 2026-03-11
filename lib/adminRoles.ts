// Système de rôles admin basé sur Discord IDs
// Tous les accès sont basés STRICTEMENT sur Discord user ID (pas username)

export type AdminRole =
  | "FONDATEUR"
  | "ADMIN_COORDINATEUR"
  | "MODERATEUR"
  | "MODERATEUR_EN_FORMATION"
  | "MODERATEUR_EN_PAUSE"
  | "SOUTIEN_TENF";

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
  MODERATEUR_EN_FORMATION: ["read", "write"],
  MODERATEUR_EN_PAUSE: ["read"],
  SOUTIEN_TENF: ["read"],
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
    MODERATEUR_EN_FORMATION: "MODERATEUR_EN_FORMATION",
    MODO_JUNIOR: "MODERATEUR_EN_FORMATION",
    MODERATEUR_EN_PAUSE: "MODERATEUR_EN_PAUSE",
    MODO_PAUSE: "MODERATEUR_EN_PAUSE",
    SOUTIEN_TENF: "SOUTIEN_TENF",
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
  if (MODOS_JUNIORS.includes(discordId)) return "MODERATEUR_EN_FORMATION";
  
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
 * Récupère le nom d'affichage d'un rôle
 */
export function getRoleDisplayName(role: AdminRole): string {
  const names: Record<AdminRole, string> = {
    FONDATEUR: "Fondateur",
    ADMIN_COORDINATEUR: "Admin Coordinateur",
    MODERATEUR: "Modérateur",
    MODERATEUR_EN_FORMATION: "Modérateur en formation",
    MODERATEUR_EN_PAUSE: "Modérateur en pause",
    SOUTIEN_TENF: "Soutien TENF",
  };
  return names[role];
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

