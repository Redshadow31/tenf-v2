import type { StaffMember } from "@/lib/staff/types";

/**
 * TODO: Remplacer ce dataset statique par une source DB.
 * Champs prévus pour l'admin:
 * - create/update staff member
 * - order d'affichage
 * - visibilité publique
 * - archivage / désactivation / suppression
 */
export const staffPlaceholderData: StaffMember[] = [
  {
    id: "placeholder-founder-1",
    displayName: "Fondateur TENF",
    role: "FONDATEUR",
    order: 1,
    isVisiblePublic: true,
    isArchived: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "placeholder-admin-coord-1",
    displayName: "Admin Coordinateur",
    role: "ADMIN_COORDINATEUR",
    order: 2,
    isVisiblePublic: true,
    isArchived: false,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

