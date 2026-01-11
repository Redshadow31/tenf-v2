// Helper pour l'authentification et l'autorisation admin
// Utilisé dans les routes API

import { cookies } from "next/headers";
import { getAdminRole, hasAdminDashboardAccess, hasPermission, type AdminRole, type Permission } from "./adminRoles";
import { logAdminAction } from "./adminAudit";

export interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
}

/**
 * Récupère l'utilisateur admin actuel depuis les cookies (serveur uniquement)
 * Vérifie d'abord les rôles hardcodés, puis le cache Blobs (uniquement dans Node.js runtime)
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get("discord_user_id")?.value;
    const username = cookieStore.get("discord_username")?.value;

    if (!userId) {
      return null;
    }

    // Vérifier d'abord les rôles hardcodés
    let role = getAdminRole(userId);
    
    // Si pas trouvé dans les hardcodés, vérifier le cache Blobs (uniquement dans Node.js runtime)
    if (!role && typeof process !== 'undefined' && process.versions?.node) {
      try {
        const { loadAdminAccessCache, getAdminRoleFromCache } = await import('./adminAccessCache');
        await loadAdminAccessCache();
        role = getAdminRoleFromCache(userId);
      } catch (error) {
        // Si Blobs n'est pas disponible (Edge Runtime), ignorer l'erreur
        console.warn('[AdminAuth] Cannot load admin access cache (Edge Runtime):', error);
      }
    }

    if (!role) {
      return null;
    }

    return {
      id: userId,
      username: username || "Unknown",
      role,
    };
  } catch (error) {
    console.error("[AdminAuth] Erreur getCurrentAdmin:", error);
    return null;
  }
}

/**
 * Vérifie l'authentification et retourne l'admin ou null
 * Utilisé dans les routes API pour vérifier l'accès
 */
export async function requireAuth(): Promise<AdminUser | null> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return null;
  }
  return admin;
}

/**
 * Vérifie l'authentification et les permissions
 * Retourne l'admin si autorisé, null sinon
 * Utilise le rôle de l'admin (qui inclut le cache Blobs) au lieu de hasPermission
 */
export async function requirePermission(permission: Permission): Promise<AdminUser | null> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return null;
  }

  // Vérifier les permissions en utilisant directement le rôle de l'admin (qui inclut le cache Blobs)
  const { ROLE_PERMISSIONS } = await import('./adminRoles');
  const permissions = ROLE_PERMISSIONS[admin.role] || [];
  if (!permissions.includes(permission)) {
    return null;
  }

  return admin;
}

/**
 * Helper pour logger une action admin avec les informations de l'acteur
 */
export async function logAction(
  admin: AdminUser,
  action: string,
  resourceType: string,
  options: {
    resourceId?: string;
    previousValue?: any;
    newValue?: any;
    metadata?: Record<string, any>;
  } = {}
): Promise<void> {
  try {
    await logAdminAction(
      admin.id,
      admin.role,
      action,
      resourceType,
      {
        actorUsername: admin.username,
        ...options,
      }
    );
  } catch (error) {
    console.error("[AdminAuth] Erreur logging:", error);
    // Ne pas throw pour ne pas bloquer l'action principale
  }
}

