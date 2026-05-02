import { loadAdminAccessCache, getAllAdminIdsFromCache } from "@/lib/adminAccessCache";
import { listAdvancedAdminDiscordIds } from "@/lib/advancedAccess";

/**
 * Tous les Discord IDs concernés par une diffusion « équipe dashboard »
 * (rôles admin dans le cache + fondateurs + accès admin avancé).
 */
export async function listDashboardStaffDiscordIds(): Promise<string[]> {
  await loadAdminAccessCache();
  const ids = new Set(getAllAdminIdsFromCache());
  for (const id of await listAdvancedAdminDiscordIds()) {
    ids.add(id);
  }
  return Array.from(ids);
}
