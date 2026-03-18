import { getBlobStore } from "@/lib/memberData";
import { isFounder } from "@/lib/adminRoles";

const ACCESS_STORE = "tenf-admin-access";
const ADVANCED_ACCESS_KEY = "admin-advanced-access-list";
const CACHE_TTL_MS = 60_000;
const LEGACY_GRACE_MS = 30 * 24 * 60 * 60 * 1000;

interface AdvancedAccessEntry {
  discordId: string;
  addedAt: string;
  addedBy: string;
  justification?: string;
  expiresAt?: string;
}

let cachedIds = new Set<string>();
let cacheLoadedAt = 0;

async function loadAdvancedAccessIds(force = false): Promise<Set<string>> {
  const now = Date.now();
  const cacheExpired = now - cacheLoadedAt > CACHE_TTL_MS;
  if (!force && cacheLoadedAt > 0 && !cacheExpired) {
    return cachedIds;
  }

  try {
    const store = getBlobStore(ACCESS_STORE);
    const stored = await store.get(ADVANCED_ACCESS_KEY);
    const entries: AdvancedAccessEntry[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    cachedIds = new Set(
      entries
        .filter((entry) => {
          if (!entry?.discordId) return false;
          // Entrées legacy sans expiresAt: grâce de 30 jours depuis addedAt.
          if (!entry.expiresAt) {
            const addedAt = new Date(entry.addedAt || "").getTime();
            if (Number.isNaN(addedAt)) return false;
            return addedAt + LEGACY_GRACE_MS > now;
          }
          const expiresAt = new Date(entry.expiresAt).getTime();
          return !Number.isNaN(expiresAt) && expiresAt > now;
        })
        .map((entry) => entry.discordId)
        .filter(Boolean)
    );
    cacheLoadedAt = now;
    return cachedIds;
  } catch (error) {
    console.warn("[advancedAccess] Cannot load advanced access list:", error);
    cachedIds = new Set<string>();
    cacheLoadedAt = now;
    return cachedIds;
  }
}

export async function hasAdvancedAdminAccess(discordId?: string | null): Promise<boolean> {
  if (!discordId) return false;
  // Verrouillage sécurité: mode admin avancé réservé strictement aux fondateurs.
  // La liste temporaire reste stockée pour audit/historique, mais n'octroie plus l'accès.
  return isFounder(discordId);
}

export function resetAdvancedAccessCache(): void {
  cachedIds = new Set<string>();
  cacheLoadedAt = 0;
}
