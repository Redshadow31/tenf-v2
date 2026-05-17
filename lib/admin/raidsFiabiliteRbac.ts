/**
 * Hrefs utilisés par `hasSectionAccess` (Blobs /admin/gestion-acces/permissions).
 * Chaque groupe liste le chemin hub communauté puis le legacy si pertinent,
 * pour que `requireSectionAccessAny` accepte l’une ou l’autre entrée sans
 * élargir l’accès au-delà de ce qui est déjà configuré côté permissions.
 */

/** Raids EventSub — page technique + shell hub. */
export const RAIDS_EVENTSUB_SECTION_HREFS = [
  "/admin/communaute/engagement/raids-eventsub",
  "/admin/engagement/raids-sub",
] as const;

/** File signalements / correctifs déclarations membres. */
export const RAIDS_SIGNALEMENTS_SECTION_HREFS = [
  "/admin/communaute/engagement/signalements-raids",
  "/admin/engagement/raids-a-valider",
] as const;

/**
 * Historique consolidé + actions de fiabilité (dédup / suppression raid stockage).
 * Garde le legacy `/admin/engagement/raids-a-valider` car les blobs existants
 * peuvent n’avoir que cette clé pour les rôles autorisés aux opérations avancées.
 */
export const RAIDS_HISTORIQUE_FIABILITE_SECTION_HREFS = [
  "/admin/communaute/engagement/historique-raids",
  "/admin/engagement/raids-a-valider",
] as const;

/**
 * GET liste `raid_declarations` : consommée depuis Signalements et Historique.
 * Un admin avec accès à l’un des trois hrefs peut charger la liste.
 */
export const RAIDS_DECLARATIONS_READ_SECTION_HREFS = [
  "/admin/communaute/engagement/signalements-raids",
  "/admin/communaute/engagement/historique-raids",
  "/admin/engagement/raids-a-valider",
] as const;
