// Système de cache pour les IDs Twitch résolus depuis les logins
// Stocke les mappings login -> twitchId dans le stockage mensuel des raids

import { getStore } from "@netlify/blobs";
import { getCurrentMonthKey } from "./raidStorage";

const CACHE_STORE_NAME = "tenf-raids";
const CACHE_KEY_PREFIX = "twitch-id-cache";

interface TwitchIdCache {
  [login: string]: {
    twitchId: string;
    resolvedAt: string; // ISO timestamp
  };
}

/**
 * Charge le cache des IDs Twitch pour le mois actuel
 */
export async function loadTwitchIdCache(monthKey?: string): Promise<TwitchIdCache> {
  const store = getStore(CACHE_STORE_NAME);

  const key = monthKey || getCurrentMonthKey();
  const cacheKey = `${CACHE_KEY_PREFIX}-${key}`;

  try {
    const data = await store.get(cacheKey, { type: "json" });
    return (data as TwitchIdCache) || {};
  } catch (error) {
    console.error(`[TwitchIdCache] Erreur chargement cache ${cacheKey}:`, error);
    return {};
  }
}

/**
 * Sauvegarde le cache des IDs Twitch pour le mois actuel
 */
export async function saveTwitchIdCache(
  cache: TwitchIdCache,
  monthKey?: string
): Promise<void> {
  const store = getStore(CACHE_STORE_NAME);

  const key = monthKey || getCurrentMonthKey();
  const cacheKey = `${CACHE_KEY_PREFIX}-${key}`;

  try {
    await store.setJSON(cacheKey, cache);
  } catch (error) {
    console.error(`[TwitchIdCache] Erreur sauvegarde cache ${cacheKey}:`, error);
    throw error;
  }
}

/**
 * Récupère un ID Twitch depuis le cache
 */
export async function getCachedTwitchId(
  login: string,
  monthKey?: string
): Promise<string | null> {
  const cache = await loadTwitchIdCache(monthKey);
  const entry = cache[login.toLowerCase()];
  
  if (entry && entry.twitchId) {
    return entry.twitchId;
  }
  
  return null;
}

/**
 * Met en cache un ID Twitch résolu
 */
export async function cacheTwitchId(
  login: string,
  twitchId: string,
  monthKey?: string
): Promise<void> {
  const cache = await loadTwitchIdCache(monthKey);
  cache[login.toLowerCase()] = {
    twitchId,
    resolvedAt: new Date().toISOString(),
  };
  await saveTwitchIdCache(cache, monthKey);
}

/**
 * Met en cache plusieurs IDs Twitch en une fois
 */
export async function cacheTwitchIds(
  mappings: Array<{ login: string; twitchId: string }>,
  monthKey?: string
): Promise<void> {
  const cache = await loadTwitchIdCache(monthKey);
  
  for (const { login, twitchId } of mappings) {
    cache[login.toLowerCase()] = {
      twitchId,
      resolvedAt: new Date().toISOString(),
    };
  }
  
  await saveTwitchIdCache(cache, monthKey);
}

