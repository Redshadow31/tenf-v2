/**
 * Fonctions de vérification d'accès admin avec support du cache Blobs
 * Ce fichier est séparé de adminRoles.ts pour éviter que les composants clients
 * ne chargent @netlify/blobs (qui nécessite Node.js runtime)
 */

import { hasAdminRole } from './adminRoles';

/**
 * Vérifie l'accès au dashboard admin en incluant le cache Blobs (async)
 * Utilisé uniquement dans les routes API (Node.js runtime)
 * Pour les composants clients, utiliser hasAdminDashboardAccess de lib/adminRoles
 */
export async function hasAdminDashboardAccessAsync(discordId: string): Promise<boolean> {
  // Vérifier d'abord les rôles hardcodés
  if (hasAdminRole(discordId)) {
    return true;
  }
  
  // Vérifier le cache Blobs (uniquement dans Node.js runtime)
  try {
    const { loadAdminAccessCache, getAdminRoleFromCache } = await import('./adminAccessCache');
    await loadAdminAccessCache();
    const role = getAdminRoleFromCache(discordId);
    return role !== null;
  } catch (error) {
    // Si Blobs n'est pas disponible (Edge Runtime), ignorer l'erreur
    // Ne pas logger pour éviter le spam
    return false;
  }
}

