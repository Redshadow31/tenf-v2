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

/**
 * Entrée brute du blob : même règle que l’accès effectif (pas de prolongation « rolling »
 * des entrées sans expiresAt — voir normalizeEntry côté API affichage).
 */
export function rawAdvancedAccessEntryActive(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") return false;
  const r = raw as Record<string, unknown>;
  const discordId =
    typeof r.discordId === "string" ? r.discordId.trim() : "";
  if (!discordId) return false;
  const expiresAtRaw = r.expiresAt;
  if (expiresAtRaw == null || expiresAtRaw === "") {
    const addedAt = new Date(String(r.addedAt || "")).getTime();
    if (Number.isNaN(addedAt)) return false;
    return addedAt + LEGACY_GRACE_MS > Date.now();
  }
  const expiresAt = new Date(String(expiresAtRaw)).getTime();
  return !Number.isNaN(expiresAt) && expiresAt > Date.now();
}

async function loadAdvancedAccessIds(force = false): Promise<Set<string>> {
  const now = Date.now();
  const cacheExpired = now - cacheLoadedAt > CACHE_TTL_MS;
  if (!force && cacheLoadedAt > 0 && !cacheExpired) {
    return cachedIds;
  }

  try {
    const store = getBlobStore(ACCESS_STORE);
    const stored = await store.get(ADVANCED_ACCESS_KEY);
    const entries: unknown[] = stored ? JSON.parse(stored) : [];
    const now = Date.now();
    cachedIds = new Set(
      Array.isArray(entries)
        ? entries
            .filter((entry) => rawAdvancedAccessEntryActive(entry))
            .map((entry) => {
              const id =
                entry &&
                typeof entry === "object" &&
                typeof (entry as AdvancedAccessEntry).discordId === "string"
                  ? (entry as AdvancedAccessEntry).discordId.trim()
                  : "";
              return id;
            })
            .filter(Boolean)
        : []
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
  const normalized = discordId != null ? String(discordId).trim() : "";
  if (!normalized) return false;
  if (isFounder(normalized)) return true;
  const ids = await loadAdvancedAccessIds();
  return ids.has(normalized);
}

export function resetAdvancedAccessCache(): void {
  cachedIds = new Set<string>();
  cacheLoadedAt = 0;
}

/** Discord IDs avec accès admin avancé actif (blob), pour diffusion cross-canal. */
export async function listAdvancedAdminDiscordIds(): Promise<string[]> {
  const set = await loadAdvancedAccessIds(true);
  return Array.from(set);
}
