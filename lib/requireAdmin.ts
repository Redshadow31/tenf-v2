/**
 * Fonctions d'authentification et d'autorisation robustes via NextAuth
 * Remplacent l'ancien système basé sur des cookies non signés
 */

import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { 
  getAdminRole, 
  hasAdminDashboardAccess, 
  normalizeAdminRole,
  ROLE_PERMISSIONS,
  type AdminRole, 
  type Permission 
} from "./adminRoles";
import { loadAdminAccessCache, getAdminRoleFromCache } from "./adminAccessCache";
import { loadSectionPermissionsCache, hasSectionAccess } from "./sectionPermissions";
import { hasAdvancedAdminAccess } from "./advancedAccess";
import { adminModerationCharterAccessBlocked } from "./adminModerationCharterGate";
import { isAdminPathAllowedDuringCharterBlock } from "./adminModerationCharterGatePaths";
import { getDevAdminRolePreview, isDevAdminRolePreviewActive } from "./admin/devRolePreview";

export interface AuthenticatedAdmin {
  id: string; // Alias de discordId pour compatibilité avec le code legacy
  discordId: string;
  username: string;
  avatar: string | null;
  role: AdminRole;
}

export type RequireAdminOptions = {
  /** Réservé aux routes « charte » : laisser passer si la charte bloquerait sinon tout le dashboard */
  bypassModerationCharterGate?: boolean;
  /** Ne pas appliquer la prévisualisation rôle dev (local). */
  skipDevRolePreview?: boolean;
};

async function applyDevRolePreviewIfAny(
  admin: AuthenticatedAdmin,
  skipDevRolePreview?: boolean,
): Promise<AuthenticatedAdmin> {
  if (skipDevRolePreview) return admin;
  const previewRole = await getDevAdminRolePreview();
  if (!previewRole) return admin;
  return { ...admin, role: previewRole };
}

/**
 * Récupère l'admin actuellement authentifié via NextAuth
 * Retourne null si non authentifié ou si pas de rôle admin
 */
export async function getAuthenticatedAdmin(options?: {
  skipDevRolePreview?: boolean;
}): Promise<AuthenticatedAdmin | null> {
  try {
    const devAuthBypassEnabled =
      process.env.NODE_ENV !== "production" &&
      process.env.ENABLE_DEV_AUTH === "true";
    const session = await getServerSession(authOptions);

    // Bypass total en local/dev : force un profil admin fondateur
    // pour éviter tous les blocages de permissions pendant le développement.
    if (devAuthBypassEnabled) {
      const discordId =
        String(session?.user?.discordId || "").trim() ||
        process.env.DEV_BYPASS_DISCORD_ID ||
        "333001130705420299";
      const username =
        String(session?.user?.username || "").trim() ||
        process.env.DEV_BYPASS_USERNAME ||
        "Dev Fondateur";
      const avatar = (session?.user?.avatar as string | null | undefined) || null;
      return applyDevRolePreviewIfAny(
        {
          id: discordId,
          discordId,
          username,
          avatar,
          role: "FONDATEUR",
        },
        options?.skipDevRolePreview,
      );
    }

    if (!session?.user?.discordId) {
      return null;
    }

    const discordId = session.user.discordId;
    const username = session.user.username || "Unknown";
    const avatar = session.user.avatar || null;

    // Le rôle en session (JWT) peut être stale si un fondateur a modifié les accès
    // après la connexion de l'utilisateur.
    const sessionRole = normalizeAdminRole((session.user.role as string | null | undefined) || null);
    const sessionDevBypass = (session.user as any)?.devBypass === true;

    // En local/dev, un login via "dev-bypass" doit utiliser explicitement le rôle de session
    // pour éviter qu'un rôle hardcodé/cache du même discordId écrase le rôle demandé au test.
    if (devAuthBypassEnabled && sessionDevBypass && sessionRole) {
      return applyDevRolePreviewIfAny(
        {
          id: discordId,
          discordId,
          username,
          avatar,
          role: sessionRole,
        },
        options?.skipDevRolePreview,
      );
    }

    // Priorité au rôle "source de vérité" (hardcodé/cache), puis fallback session.
    let role: AdminRole | null = getAdminRole(discordId);
    if (!role) {
      try {
        await loadAdminAccessCache();
        role = getAdminRoleFromCache(discordId);
      } catch (error) {
        // Si Blobs n'est pas disponible, on tentera le fallback session.
        console.warn("[requireAdmin] Cannot load admin access cache:", error);
      }
    }
    if (!role) {
      role = sessionRole;
    }

    // Un admin avancé doit être reconnu même sans rôle admin explicite.
    // On mappe vers ADMIN_COORDINATEUR pour rester compatible avec les guards existants.
    if (!role && await hasAdvancedAdminAccess(discordId)) {
      role = "ADMIN_COORDINATEUR";
    }

    if (!role) {
      return null;
    }

    return applyDevRolePreviewIfAny(
      {
        id: discordId, // Alias pour compatibilité avec le code legacy
        discordId,
        username,
        avatar,
        role,
      },
      options?.skipDevRolePreview,
    );
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
export async function requireAdmin(options?: RequireAdminOptions): Promise<AuthenticatedAdmin | null> {
  const admin = await getAuthenticatedAdmin();
  
  if (!admin) {
    return null;
  }

  // Vérifier que l'admin a bien accès au dashboard
  const hasAccess = hasAdminDashboardAccess(admin.discordId) || admin.role !== null;
  
  if (!hasAccess) {
    return null;
  }

  if (!options?.bypassModerationCharterGate && (await adminModerationCharterAccessBlocked(admin.discordId))) {
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

  // Bypass total: accès admin avancé = mêmes droits qu'Admin Coordinateur
  if (!(await isDevAdminRolePreviewActive()) && (await hasAdvancedAdminAccess(admin.discordId))) {
    return admin;
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

  if (await adminModerationCharterAccessBlocked(admin.discordId)) {
    return false;
  }

  // Bypass total: accès admin avancé = mêmes droits qu'Admin Coordinateur
  if (!(await isDevAdminRolePreviewActive()) && (await hasAdvancedAdminAccess(admin.discordId))) {
    return true;
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

  return admin.role === "FONDATEUR";
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

  if (await adminModerationCharterAccessBlocked(admin.discordId)) {
    if (!isAdminPathAllowedDuringCharterBlock(sectionHref)) {
      return false;
    }
  }

  // Bypass total des permissions par section
  if (!(await isDevAdminRolePreviewActive()) && (await hasAdvancedAdminAccess(admin.discordId))) {
    return true;
  }

  // Charger le cache des permissions des sections
  try {
    await loadSectionPermissionsCache();
  } catch (error) {
    console.warn("[requireAdmin] Cannot load section permissions cache:", error);
    // Fail-closed: en cas d'erreur, refuser l'accès par défaut
    return false;
  }

  // Vérifier si le rôle de l'admin a accès à cette section
  return hasSectionAccess(sectionHref, admin.role, admin.discordId);
}

/**
 * Exige que l'admin authentifié ait accès à une section spécifique
 * Retourne l'admin si autorisé, null sinon
 * À utiliser dans les routes API : si null, retourner 403
 */
export async function requireSectionAccess(sectionHref: string): Promise<AuthenticatedAdmin | null> {
  const admin = await requireAdmin({
    bypassModerationCharterGate: isAdminPathAllowedDuringCharterBlock(sectionHref),
  });

  if (!admin) {
    return null;
  }

  // Bypass total des permissions par section
  if (!(await isDevAdminRolePreviewActive()) && (await hasAdvancedAdminAccess(admin.discordId))) {
    return admin;
  }

  // Charger le cache des permissions des sections
  try {
    await loadSectionPermissionsCache();
  } catch (error) {
    console.warn("[requireAdmin] Cannot load section permissions cache:", error);
    // Fail-closed: en cas d'erreur, refuser l'accès par défaut
    return null;
  }

  // Vérifier si le rôle de l'admin a accès à cette section
  const hasAccess = hasSectionAccess(sectionHref, admin.role, admin.discordId);

  if (!hasAccess) {
    return null;
  }

  return admin;
}

/**
 * Exige un rôle admin + accès à au moins une des sections listées (RBAC par href).
 * Utilisé pour les routes partagées entre hub `/admin/communaute/...` et chemins legacy.
 *
 * Charte modération : bypass si au moins une des sections est autorisée pendant le blocage.
 */
export async function requireSectionAccessAny(
  sectionHrefs: readonly string[],
  options?: RequireAdminOptions
): Promise<AuthenticatedAdmin | null> {
  if (!sectionHrefs.length) {
    return null;
  }
  const charterBypass =
    options?.bypassModerationCharterGate === true ||
    sectionHrefs.some((href) => isAdminPathAllowedDuringCharterBlock(href));
  const admin = await requireAdmin({
    ...options,
    bypassModerationCharterGate: charterBypass,
  });

  if (!admin) {
    return null;
  }

  if (!(await isDevAdminRolePreviewActive()) && (await hasAdvancedAdminAccess(admin.discordId))) {
    return admin;
  }

  try {
    await loadSectionPermissionsCache();
  } catch (error) {
    console.warn("[requireAdmin] Cannot load section permissions cache (requireSectionAccessAny):", error);
    return null;
  }

  for (const href of sectionHrefs) {
    if (hasSectionAccess(href, admin.role, admin.discordId)) {
      return admin;
    }
  }

  return null;
}

/**
 * Utilisateur connecté via Discord (session NextAuth avec `discordId`).
 * Pour les routes API partagées espace membre / admin qui ne doivent pas être publiques.
 * Les visiteurs anonymes reçoivent null → répondre en 401.
 */
export async function requireAuthenticatedDiscordUser(): Promise<{
  discordId: string;
  username: string;
} | null> {
  const session = await getServerSession(authOptions);
  const discordId = String(session?.user?.discordId || "").trim();
  if (!discordId) {
    return null;
  }
  return {
    discordId,
    username: String(session?.user?.username || "").trim() || "unknown",
  };
}

/**
 * Exige un accès admin avancé (ou fondateur)
 * Retourne l'admin authentifié si autorisé, sinon null
 */
export async function requireAdvancedAdminAccess(): Promise<AuthenticatedAdmin | null> {
  const admin = await requireAdmin();

  if (!admin) {
    return null;
  }

  const hasAdvancedAccess = await hasAdvancedAdminAccess(admin.discordId);
  if (!hasAdvancedAccess) {
    return null;
  }

  return admin;
}
