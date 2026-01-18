/**
 * Fonctions d'authentification et d'autorisation robustes via NextAuth
 * Remplacent l'ancien système basé sur des cookies non signés
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { 
  getAdminRole, 
  hasAdminDashboardAccess, 
  hasPermission, 
  ROLE_PERMISSIONS,
  type AdminRole, 
  type Permission 
} from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";
import { loadSectionPermissionsCache, hasSectionAccess } from "./sectionPermissions";

export interface AuthenticatedAdmin {
  discordId: string;
  username: string;
  avatar: string | null;
  role: AdminRole;
}

/**
 * Récupère l'admin actuellement authentifié via NextAuth
 * Retourne null si non authentifié ou si pas de rôle admin
 */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.discordId) {
      return null;
    }

    const discordId = session.user.discordId;
    const username = session.user.username || "Unknown";
    const avatar = session.user.avatar || null;

    // Si le rôle est déjà dans la session (depuis le JWT), l'utiliser
    let role: AdminRole | null = session.user.role || null;

    // Sinon, vérifier les rôles hardcodés
    if (!role) {
      role = getAdminRole(discordId);
    }

    // Si toujours pas trouvé, vérifier le cache Blobs
    if (!role) {
      try {
        await loadAdminAccessCache();
        role = getAdminRoleFromCache(discordId);
      } catch (error) {
        // Si Blobs n'est pas disponible, ignorer
        console.warn("[requireAdmin] Cannot load admin access cache:", error);
      }
    }

    if (!role) {
      return null;
    }

    return {
      discordId,
      username,
      avatar,
      role,
    };
  } catch (error) {
    console.error("[requireAdmin] Error getting authenticated admin:", error);
    return null;
  }
}

/**
 * Exige une authentification NextAuth valide
 * Retourne l'admin authentifié ou null
 * À utiliser dans les routes API : si null, retourner 401
 */
export async function requireAuth(): Promise<AuthenticatedAdmin | null> {
  return await getAuthenticatedAdmin();
}

/**
 * Exige une authentification NextAuth + un rôle admin
 * Retourne l'admin authentifié avec rôle ou null
 * À utiliser dans les routes API : si null, retourner 403
 */
export async function requireAdmin(): Promise<AuthenticatedAdmin | null> {
  const admin = await getAuthenticatedAdmin();
  
  if (!admin) {
    return null;
  }

  // Vérifier que l'admin a bien accès au dashboard
  const hasAccess = hasAdminDashboardAccess(admin.discordId) || admin.role !== null;
  
  if (!hasAccess) {
    return null;
  }

  return admin;
}

/**
 * Exige un rôle spécifique (founder, adminAdjoint, modoMentor, modoJunior)
 * Retourne l'admin authentifié avec le rôle requis ou null
 * À utiliser dans les routes API : si null, retourner 403
 */
export async function requireRole(requiredRole: AdminRole): Promise<AuthenticatedAdmin | null> {
  const admin = await requireAdmin();
  
  if (!admin) {
    return null;
  }

  // Vérifier que l'admin a le rôle requis
  if (admin.role !== requiredRole) {
    return null;
  }

  return admin;
}

/**
 * Exige une permission spécifique (read, write, validate, revert, global_revert)
 * Retourne l'admin authentifié avec la permission requise ou null
 * À utiliser dans les routes API : si null, retourner 403
 */
export async function requirePermission(requiredPermission: Permission): Promise<AuthenticatedAdmin | null> {
  const admin = await requireAdmin();
  
  if (!admin) {
    return null;
  }

  // Vérifier que l'admin a la permission requise
  const permissions = ROLE_PERMISSIONS[admin.role] || [];
  if (!permissions.includes(requiredPermission)) {
    return null;
  }

  return admin;
}

/**
 * Vérifie si l'utilisateur actuel a une permission spécifique
 * Retourne true/false sans exiger l'authentification
 * Utile pour afficher/masquer des éléments UI conditionnellement
 */
export async function checkPermission(requiredPermission: Permission): Promise<boolean> {
  const admin = await getAuthenticatedAdmin();
  
  if (!admin) {
    return false;
  }

  const permissions = ROLE_PERMISSIONS[admin.role] || [];
  return permissions.includes(requiredPermission);
}

/**
 * Vérifie si l'utilisateur actuel est founder
 * Retourne true/false
 */
export async function checkIsFounder(): Promise<boolean> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return false;
  }

  return admin.role === "FOUNDER";
}

/**
 * Vérifie si l'admin authentifié a accès à une section spécifique du dashboard
 * @param sectionHref - Le href de la section (ex: "/admin/dashboard")
 * @returns true si l'admin a accès, false sinon
 */
export async function hasAccessToSection(sectionHref: string): Promise<boolean> {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return false;
  }

  // Charger le cache des permissions des sections
  try {
    await loadSectionPermissionsCache();
  } catch (error) {
    console.warn("[requireAdmin] Cannot load section permissions cache:", error);
    // En cas d'erreur, autoriser l'accès par défaut (sécurité permissive)
    return true;
  }

  // Vérifier si le rôle de l'admin a accès à cette section
  return hasSectionAccess(sectionHref, admin.role);
}

/**
 * Exige que l'admin authentifié ait accès à une section spécifique
 * Retourne l'admin si autorisé, null sinon
 * À utiliser dans les routes API : si null, retourner 403
 */
export async function requireSectionAccess(sectionHref: string): Promise<AuthenticatedAdmin | null> {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  // Charger le cache des permissions des sections
  try {
    await loadSectionPermissionsCache();
  } catch (error) {
    console.warn("[requireAdmin] Cannot load section permissions cache:", error);
    // En cas d'erreur, autoriser l'accès par défaut (sécurité permissive)
    return admin;
  }

  // Vérifier si le rôle de l'admin a accès à cette section
  const hasAccess = hasSectionAccess(sectionHref, admin.role);

  if (!hasAccess) {
    return null;
  }

  return admin;
}
