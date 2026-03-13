// Helper pour l'authentification et l'autorisation admin
// Utilisé dans les routes API

import { type AdminRole, type Permission } from "./adminRoles";
import { logAdminAction } from "./adminAudit";
import {
  getAuthenticatedAdmin,
  requireAuth as requireAuthStrict,
  requirePermission as requirePermissionStrict,
  type AuthenticatedAdmin,
} from "./requireAdmin";

export type AdminUser = AuthenticatedAdmin;

/**
 * Récupère l'utilisateur admin actuel depuis les cookies (serveur uniquement)
 * Vérifie d'abord les rôles hardcodés, puis le cache Blobs (uniquement dans Node.js runtime)
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  // P0 sécurité: suppression totale de la confiance sur discord_user_id (cookie forgeable).
  // Auth admin strictement basée sur la session serveur NextAuth.
  return getAuthenticatedAdmin();
}

/**
 * Vérifie l'authentification et retourne l'admin ou null
 * Utilisé dans les routes API pour vérifier l'accès
 */
export async function requireAuth(): Promise<AdminUser | null> {
  return requireAuthStrict();
}

/**
 * Vérifie l'authentification et les permissions
 * Retourne l'admin si autorisé, null sinon
 * Utilise le rôle de l'admin (qui inclut le cache Blobs) au lieu de hasPermission
 */
export async function requirePermission(permission: Permission): Promise<AdminUser | null> {
  return requirePermissionStrict(permission);
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

