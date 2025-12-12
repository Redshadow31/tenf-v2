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

const FOUNDERS: string[] = [
  "1021398088474169414",
  "333001130705420299",
  "535244297214361603",
];

const ADMINS_ADJOINTS: string[] = [
  "372124598252077057",
  "1064901617289269318",
  "1304717040887660704",
  "1236323288544972960",
];

const MODOS_MENTORS: string[] = [
  "721805397295497237",
  "701817098027925505",
  "921082132259024927",
  "546513497404735489",
  "726438071108894760",
];

const MODOS_JUNIORS: string[] = [
  "1297107200623513645",
  "188305426960351232",
  "689798133932228649",
  "991741991530537011",
  "933465757403209758",
  "867006377494577203",
  "177710130853314561",
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
// FONCTIONS DE VÉRIFICATION
// ============================================

/**
 * Récupère le rôle d'un utilisateur Discord par son ID
 */
export function getAdminRole(discordId: string): AdminRole | null {
  if (FOUNDERS.includes(discordId)) return "FOUNDER";
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
    FOUNDER: "Fondateur",
    ADMIN_ADJOINT: "Admin Adjoint",
    MODO_MENTOR: "Modo Mentor",
    MODO_JUNIOR: "Modo Junior",
  };
  return names[role];
}

