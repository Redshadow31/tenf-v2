// Système de rôles admin basé sur Discord IDs
// Tous les accès sont basés STRICTEMENT sur Discord user ID (pas username)

export type AdminRole = 
  | "FOUNDER" 
  | "ADMIN_ADJOINT" 
  | "MODO_MENTOR" 
  | "MODO_JUNIOR";

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

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  FOUNDER: ["read", "write", "validate", "revert", "global_revert"],
  ADMIN_ADJOINT: ["read", "write", "validate", "revert"],
  MODO_MENTOR: ["read", "write", "validate"],
  MODO_JUNIOR: ["read", "write"],
};

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
  if (FOUNDERS.includes(discordId)) return "FOUNDER";
  
  // Fallback sur les données hardcodées (pour compatibilité)
  // Le cache Blobs est vérifié séparément dans les routes API via getAdminRoleFromCache
  if (ADMINS_ADJOINTS.includes(discordId)) return "ADMIN_ADJOINT";
  if (MODOS_MENTORS.includes(discordId)) return "MODO_MENTOR";
  if (MODOS_JUNIORS.includes(discordId)) return "MODO_JUNIOR";
  
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
 * Vérifie l'accès au dashboard admin en incluant le cache Blobs (async)
 * Utilisé dans les routes API pour vérifier les membres ajoutés manuellement
 * Cette fonction utilise des imports dynamiques pour éviter les problèmes Edge Runtime
 */
export async function hasAdminDashboardAccessAsync(discordId: string): Promise<boolean> {
  // Vérifier d'abord les rôles hardcodés
  if (hasAdminRole(discordId)) {
    return true;
  }
  
  // Vérifier le cache Blobs (uniquement dans Node.js runtime)
  // Utiliser une vérification dynamique pour éviter les imports au build time
  try {
    if (typeof window === 'undefined' && typeof process !== 'undefined' && process.versions?.node) {
      const { loadAdminAccessCache, getAdminRoleFromCache } = await import('./adminAccessCache');
      await loadAdminAccessCache();
      const role = getAdminRoleFromCache(discordId);
      return role !== null;
    }
  } catch (error) {
    // Si Blobs n'est pas disponible (Edge Runtime), ignorer l'erreur
    // Ne pas logger en production pour éviter le spam
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AdminRoles] Cannot load admin access cache:', error);
    }
  }
  
  return false;
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
    FOUNDER: "Fondateur",
    ADMIN_ADJOINT: "Admin Adjoint",
    MODO_MENTOR: "Modo Mentor",
    MODO_JUNIOR: "Modo Junior",
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

