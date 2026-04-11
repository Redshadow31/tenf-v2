import { getAdminRoleFromCache, getAllAdminIdsFromCache, loadAdminAccessCache } from "@/lib/adminAccessCache";
import { hasAdvancedAdminAccess } from "@/lib/advancedAccess";
import { getAdminRole, type AdminRole } from "@/lib/adminRoles";
import {
  getAllSectionPermissions,
  hasSectionAccess,
  loadSectionPermissionsCache,
} from "@/lib/sectionPermissions";

const STAFF_MODERATION_ROOT = "/admin/moderation/staff";

/**
 * Href(s) du blob « permissions par section » concernant la modération staff.
 * Si aucune clé ne correspond, on teste au moins la racine (comportement hasSectionAccess par défaut).
 */
export function listStaffModerationPermissionHrefs(): string[] {
  const sections = getAllSectionPermissions();
  const keys = Object.keys(sections).filter(
    (h) => h === STAFF_MODERATION_ROOT || h.startsWith(`${STAFF_MODERATION_ROOT}/`),
  );
  if (keys.length > 0) return keys;
  return [STAFF_MODERATION_ROOT];
}

export function resolveAdminRoleForDiscord(discordId: string): AdminRole | null {
  return getAdminRole(discordId) ?? getAdminRoleFromCache(discordId);
}

/**
 * True si l’utilisateur peut ouvrir au moins une page sous /admin/moderation/staff
 * (permissions par section + bypass accès admin avancé / fondateur).
 */
export async function hasAccessToStaffModerationArea(
  discordId: string,
  role: AdminRole,
): Promise<boolean> {
  if (await hasAdvancedAdminAccess(discordId)) return true;
  for (const href of listStaffModerationPermissionHrefs()) {
    if (hasSectionAccess(href, role, discordId)) return true;
  }
  return false;
}

/**
 * Tous les Discord IDs qui ont un rôle admin ET au moins un accès à la zone modération staff.
 */
export async function getDiscordIdsWithStaffModerationAccess(): Promise<string[]> {
  await loadAdminAccessCache();
  await loadSectionPermissionsCache();
  const candidates = getAllAdminIdsFromCache();
  const out: string[] = [];
  for (const discordId of candidates) {
    const role = resolveAdminRoleForDiscord(discordId);
    if (!role) continue;
    if (await hasAccessToStaffModerationArea(discordId, role)) {
      out.push(discordId);
    }
  }
  return out;
}
