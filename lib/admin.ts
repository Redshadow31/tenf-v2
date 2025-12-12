// Utilitaires pour la gestion des permissions admin et Safe Mode
// Note: Les fonctions serveur utilisent cookies() de next/headers
// Les fonctions client doivent utiliser getDiscordUser() de lib/discord

// IMPORTANT: Ce fichier est maintenant un wrapper pour compatibilité
// Le nouveau système de rôles est dans lib/adminRoles.ts

export { 
  getAdminRole,
  hasAdminRole,
  isFounder,
  hasPermission,
  hasAdminDashboardAccess,
  getUserPermissions,
  getRoleDisplayName,
  type AdminRole,
  type Permission,
} from "./adminRoles";

// Re-export canPerformAction avec un alias pour éviter les conflits
export { canPerformAction as canPerformAdminAction } from "./adminRoles";

// Re-export pour compatibilité avec l'ancien code
export type { AdminRole as LegacyAdminRole } from "./adminRoles";

// Fonctions de compatibilité (dépréciées, utiliser adminRoles.ts)
import { 
  getAdminRole as getNewAdminRole,
  hasAdminRole as hasNewAdminRole,
  isFounder as isNewFounder,
} from "./adminRoles";

/**
 * @deprecated Utiliser getAdminRole de adminRoles.ts
 */
export function isAdmin(discordId: string): boolean {
  const role = getNewAdminRole(discordId);
  return role === "FOUNDER" || role === "ADMIN_ADJOINT";
}

/**
 * @deprecated Utiliser hasAdminRole de adminRoles.ts
 */
export function isModerator(discordId: string): boolean {
  return hasNewAdminRole(discordId);
}

/**
 * @deprecated Utiliser hasAdminDashboardAccess de adminRoles.ts
 */
export function isAdminAdjoint(discordId: string, memberRole?: string): boolean {
  const role = getNewAdminRole(discordId);
  return role === "ADMIN_ADJOINT";
}

/**
 * @deprecated Utiliser hasAdminDashboardAccess de adminRoles.ts
 */
export function isAdminRole(discordId: string, memberRole?: string): boolean {
  const role = getNewAdminRole(discordId);
  return role === "ADMIN_ADJOINT";
}

/**
 * Récupère l'utilisateur Discord connecté depuis les cookies (serveur uniquement)
 * Pour le client, utilisez getDiscordUser() de lib/discord puis vérifiez avec getAdminRole()
 */
export async function getCurrentAdmin() {
  // Cette fonction doit être utilisée uniquement côté serveur (API routes)
  // Pour le client, utilisez getDiscordUser() puis getAdminRole()
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const userId = cookieStore.get("discord_user_id")?.value;
    const username = cookieStore.get("discord_username")?.value;

    if (!userId) {
      return null;
    }

    const role = getAdminRole(userId);
    if (!role) {
      return null;
    }

    return {
      id: userId,
      username: username || "Unknown",
      role,
    };
  } catch (error) {
    // Si appelé côté client, retourner null
    return null;
  }
}

/**
 * Vérifie si le Safe Mode est activé
 * Le Safe Mode ne peut être activé/désactivé que par les fondateurs
 */
let safeModeEnabled = false;

export function isSafeModeEnabled(): boolean {
  // TODO: Récupérer depuis une base de données ou variable d'environnement
  return safeModeEnabled;
}

export function setSafeMode(enabled: boolean, founderId: string): boolean {
  if (!isFounder(founderId)) {
    return false; // Seuls les fondateurs peuvent activer/désactiver le Safe Mode
  }

  safeModeEnabled = enabled;
  // TODO: Sauvegarder dans une base de données
  return true;
}

/**
 * Vérifie si un utilisateur peut effectuer une action administrative
 * En Safe Mode, seuls les fondateurs peuvent modifier des données
 * Cette fonction peut être utilisée côté client et serveur
 */
export function canPerformAction(discordId: string, action: "read" | "write", safeModeEnabled: boolean = false): boolean {
  if (action === "read") {
    // En lecture, tous les modérateurs peuvent voir
    return isModerator(discordId);
  }

  // En écriture
  if (safeModeEnabled || isSafeModeEnabled()) {
    // En Safe Mode, seuls les fondateurs peuvent modifier
    return isFounder(discordId);
  }

  // En mode normal, tous les modérateurs peuvent modifier
  return isModerator(discordId);
}

