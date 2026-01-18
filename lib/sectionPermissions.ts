/**
 * Gestion des permissions par section du dashboard admin
 * Permet de contrôler quels rôles ont accès à quelles sections
 */

import type { AdminRole } from "./adminRoles";

export interface SectionPermission {
  href: string;
  label: string;
  roles: AdminRole[];
}

interface PermissionsData {
  sections: Record<string, SectionPermission>;
  lastUpdated?: string;
  updatedBy?: string;
}

// Cache en mémoire pour les permissions des sections
let sectionPermissionsCache: Record<string, SectionPermission> = {};
let cacheLoaded = false;

/**
 * Charge le cache des permissions des sections depuis Blobs
 * Cette fonction est appelée uniquement dans les routes API (Node.js runtime)
 */
export async function loadSectionPermissionsCache(): Promise<void> {
  if (cacheLoaded) {
    return; // Déjà chargé
  }

  try {
    // Import dynamique uniquement dans Node.js runtime
    const { getBlobStore } = await import('./memberData');
    const store = getBlobStore('tenf-admin-permissions');
    const stored = await store.get('dashboard-permissions');
    
    if (stored) {
      const permissionsData: PermissionsData = JSON.parse(stored);
      sectionPermissionsCache = permissionsData.sections || {};
    } else {
      sectionPermissionsCache = {};
    }
    
    cacheLoaded = true;
  } catch (error) {
    // Si Blobs n'est pas disponible, utiliser des permissions par défaut (tous ont accès)
    console.warn('[SectionPermissions] Cannot load from Blobs, using defaults:', error);
    sectionPermissionsCache = {};
    cacheLoaded = true;
  }
}

/**
 * Vérifie si un rôle a accès à une section spécifique
 * @param sectionHref - Le href de la section (ex: "/admin/dashboard")
 * @param role - Le rôle à vérifier
 * @returns true si le rôle a accès, false sinon
 */
export function hasSectionAccess(sectionHref: string, role: AdminRole): boolean {
  const section = sectionPermissionsCache[sectionHref];
  
  // Si la section n'a pas de permissions définies (pas dans le cache), tous les rôles ont accès par défaut
  if (!section || !section.roles || section.roles.length === 0) {
    return true;
  }
  
  // Si des rôles sont définis, vérifier que le rôle est dans la liste
  return section.roles.includes(role);
}

/**
 * Vérifie si une section a des restrictions (i.e. des rôles spécifiques définis)
 * @param sectionHref - Le href de la section
 * @returns true si la section a des restrictions, false sinon
 */
export function hasSectionRestrictions(sectionHref: string): boolean {
  const section = sectionPermissionsCache[sectionHref];
  return section && section.roles && section.roles.length > 0;
}

/**
 * Réinitialise le cache (utile après une mise à jour)
 */
export function resetSectionPermissionsCache(): void {
  sectionPermissionsCache = {};
  cacheLoaded = false;
}

/**
 * Récupère toutes les permissions des sections (pour affichage)
 * @returns Un objet avec toutes les permissions des sections
 */
export function getAllSectionPermissions(): Record<string, SectionPermission> {
  return { ...sectionPermissionsCache };
}
