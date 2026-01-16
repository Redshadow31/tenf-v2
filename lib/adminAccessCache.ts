/**
 * Gestion du cache des accès admin depuis Blobs
 * Ce fichier est séparé de adminRoles.ts pour éviter que le middleware (Edge Runtime)
 * n'importe pas @netlify/blobs qui nécessite Node.js runtime
 */

import type { AdminRole } from './adminRoles';
import { FOUNDERS } from './adminRoles';

// Ré-export pour compatibilité
export type { AdminRole };

// Cache en mémoire pour les accès admin depuis Blobs
// Format: { discordId: AdminRole }
let adminAccessCache: Record<string, AdminRole> = {};

/**
 * Charge le cache des accès admin depuis Blobs
 * Cette fonction est appelée uniquement dans les routes API (Node.js runtime, pas Edge Runtime)
 */
export async function loadAdminAccessCache(): Promise<void> {
  try {
    // Import dynamique uniquement dans Node.js runtime
    const { getBlobStore } = await import('./memberData');
    const store = getBlobStore('tenf-admin-access');
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
 * Récupère le rôle d'un utilisateur depuis le cache Blobs
 * (les fondateurs sont toujours vérifiés via FOUNDERS hardcodé dans adminRoles.ts)
 */
export function getAdminRoleFromCache(discordId: string): AdminRole | null {
  return adminAccessCache[discordId] || null;
}

/**
 * Récupère tous les IDs Discord des admins/staff (hardcodés + cache Blobs)
 */
export function getAllAdminIdsFromCache(): string[] {
  const ids = new Set<string>();
  
  // Toujours inclure les fondateurs
  FOUNDERS.forEach(id => ids.add(id));
  
  // Ajouter les IDs du cache Blobs
  Object.keys(adminAccessCache).forEach(id => ids.add(id));
  
  return Array.from(ids);
}

