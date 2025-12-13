// Helper pour filtrer les liens de navigation admin selon les permissions

import { getAdminRole, hasPermission, isFounder, type AdminRole, type Permission } from "./adminRoles";

export interface NavLink {
  href: string;
  label: string;
  active?: boolean;
  requiredPermission?: Permission;
  requiredRole?: AdminRole;
  foundersOnly?: boolean;
}

/**
 * Filtre les liens de navigation selon les permissions de l'utilisateur
 */
export function filterNavLinks(
  discordId: string,
  links: NavLink[]
): NavLink[] {
  const role = getAdminRole(discordId);
  
  if (!role) {
    return []; // Pas d'accès admin
  }

  return links.filter(link => {
    // Si foundersOnly, vérifier que c'est un founder
    if (link.foundersOnly && !isFounder(discordId)) {
      return false;
    }

    // Si requiredRole, vérifier le rôle
    if (link.requiredRole) {
      const roleHierarchy: Record<AdminRole, number> = {
        FOUNDER: 4,
        ADMIN_ADJOINT: 3,
        MODO_MENTOR: 2,
        MODO_JUNIOR: 1,
      };
      
      const userLevel = roleHierarchy[role] || 0;
      const requiredLevel = roleHierarchy[link.requiredRole] || 0;
      
      if (userLevel < requiredLevel) {
        return false;
      }
    }

    // Si requiredPermission, vérifier la permission
    if (link.requiredPermission) {
      if (!hasPermission(discordId, link.requiredPermission)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Liens de navigation par défaut pour le dashboard admin
 */
export const defaultAdminNavLinks: NavLink[] = [
  { href: "/admin/dashboard", label: "Dashboard Général" },
  { href: "/admin/membres", label: "Gestion des Membres", requiredPermission: "read" },
  { href: "/admin/raids", label: "Suivi des Raids", requiredPermission: "read" },
  { href: "/admin/raids/twitch", label: "Suivi des Raids Twitch", requiredPermission: "read" },
  { href: "/admin/evaluation-mensuelle", label: "Évaluation Mensuelle", requiredPermission: "read" },
  { href: "/admin/spotlight", label: "Gestion Spotlight", requiredPermission: "read" },
  { href: "/admin/planification", label: "Événements", requiredPermission: "read" },
  { href: "/admin/logs", label: "Logs", requiredPermission: "read" },
  { href: "/admin/founders/audit", label: "Audit Logs", foundersOnly: true },
];

