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
// CACHE DES ACCÈS ADMIN (chargé depuis Blobs)
// ============================================

// Cache en mémoire pour les accès admin depuis Blobs
// Format: { discordId: AdminRole }
let adminAccessCache: Record<string, AdminRole> = {};

/**
 * Charge le cache des accès admin depuis Blobs
 * Cette fonction est appelée de manière asynchrone pour initialiser le cache
 */
export async function loadAdminAccessCache(): Promise<void> {
  try {
    // Vérifier si on peut utiliser Blobs
    const { getStore } = await import('@netlify/blobs');
    const store = getStore('tenf-admin-access');
    const stored = await store.get('admin-access-list');
    
    if (stored) {
      const accessList: Array<{ discordId: string; role: AdminRole }> = JSON.parse(stored);
      // Reconstruire le cache (exclure les fondateurs car ils sont hardcodés)
      adminAccessCache = {};
      accessList.forEach(access => {
        // Ne pas mettre en cache les fondateurs, ils sont toujours hardcodés
        if (access.role !== 'FOUNDER' || !FOUNDERS.includes(access.discordId)) {
          adminAccessCache[access.discordId] = access.role;
        }
      });
    }
  } catch (error) {
    // Si Blobs n'est pas disponible ou erreur, utiliser les données hardcodées
    console.warn('Error loading admin access cache from Blobs, using hardcoded data:', error);
    adminAccessCache = {};
  }
}

/**
 * Initialise le cache au démarrage (si possible)
 */
if (typeof window === 'undefined') {
  // Seulement côté serveur
  loadAdminAccessCache().catch(err => {
    console.warn('Failed to load admin access cache:', err);
  });
}

/**
 * Récupère le rôle d'un utilisateur Discord par son ID
 * Vérifie d'abord les fondateurs hardcodés, puis le cache Blobs
 */
export function getAdminRole(discordId: string): AdminRole | null {
  // Les fondateurs sont toujours hardcodés et prioritaires
  if (FOUNDERS.includes(discordId)) return "FOUNDER";
  
  // Vérifier le cache Blobs
  if (adminAccessCache[discordId]) {
    return adminAccessCache[discordId];
  }
  
  // Fallback sur les données hardcodées (pour compatibilité)
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

/**
 * Récupère tous les IDs Discord des admins/staff
 * Combine les fondateurs hardcodés avec le cache Blobs
 */
export function getAllAdminIds(): string[] {
  const ids = new Set<string>();
  
  // Toujours inclure les fondateurs
  FOUNDERS.forEach(id => ids.add(id));
  
  // Ajouter les IDs du cache Blobs
  Object.keys(adminAccessCache).forEach(id => ids.add(id));
  
  // Ajouter les IDs hardcodés (pour compatibilité)
  ADMINS_ADJOINTS.forEach(id => ids.add(id));
  MODOS_MENTORS.forEach(id => ids.add(id));
  MODOS_JUNIORS.forEach(id => ids.add(id));
  
  return Array.from(ids);
}

