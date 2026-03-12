import { getBlobStore } from "@/lib/memberData";
import { isFounder } from "@/lib/adminRoles";

const ACCESS_STORE = "tenf-admin-access";
const ADVANCED_ACCESS_KEY = "admin-advanced-access-list";
const CACHE_TTL_MS = 60_000;

interface AdvancedAccessEntry {
  discordId: string;
  addedAt: string;
  addedBy: string;
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
    cachedIds = new Set(entries.map((entry) => entry.discordId).filter(Boolean));
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
  if (isFounder(discordId)) return true;
  const ids = await loadAdvancedAccessIds();
  return ids.has(discordId);
}

export function resetAdvancedAccessCache(): void {
  cachedIds = new Set<string>();
  cacheLoadedAt = 0;
}
