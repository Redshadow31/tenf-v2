import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

/**
 * Obtient le client Redis (singleton)
 * @throws {Error} Si les variables d'environnement ne sont pas configurées
 */
export function getRedisClient(): Redis | null {
  // Si Redis n'est pas configuré, retourner null (cache désactivé)
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // En développement, on peut continuer sans cache
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Cache] Redis non configuré, cache désactivé');
    }
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis({
        url,
        token,
      });
    } catch (error) {
      console.error('[Cache] Erreur initialisation Redis:', error);
      return null;
    }
  }

  return redisClient;
}

/**
 * Récupère une valeur du cache
 * @param key Clé du cache
 * @returns La valeur en cache ou null si non trouvée ou erreur
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const data = await redis.get(key);
    if (data === null) return null;
    
    // Si la donnée est une string JSON, la parser
    if (typeof data === 'string') {
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as T;
      }
    }
    
    return data as T;
  } catch (error) {
    console.error(`[Cache] Erreur get pour la clé "${key}":`, error);
    return null;
  }
}

/**
 * Met une valeur en cache avec TTL
 * @param key Clé du cache
 * @param value Valeur à mettre en cache
 * @param ttlSeconds Durée de vie en secondes (défaut: 300 = 5 minutes)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Sérialiser en JSON si ce n'est pas déjà une string
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.setex(key, ttlSeconds, serialized);
  } catch (error) {
    console.error(`[Cache] Erreur set pour la clé "${key}":`, error);
  }
}

/**
 * Supprime une clé du cache
 * @param key Clé à supprimer
 */
export async function cacheDelete(key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    console.error(`[Cache] Erreur delete pour la clé "${key}":`, error);
  }
}

/**
 * Invalide toutes les clés correspondant à un pattern
 * @param pattern Pattern Redis (ex: "members:*")
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Upstash Redis REST API ne supporte pas directement KEYS
    // On utilise SCAN pour itérer sur les clés
    // Note: Pour Upstash, on peut utiliser une approche différente
    // En production, on peut utiliser des tags ou des clés préfixées
    
    // Pour l'instant, on utilise une approche simple avec des clés préfixées
    // Si vous avez besoin de pattern matching, utilisez des tags ou des clés structurées
    console.warn(`[Cache] cacheInvalidate avec pattern "${pattern}" - implémentation limitée avec Upstash REST API`);
    
    // Alternative: stocker les clés dans un set pour chaque pattern
    // Pour l'instant, on log juste un avertissement
  } catch (error) {
    console.error(`[Cache] Erreur invalidate pour le pattern "${pattern}":`, error);
  }
}

/**
 * Invalide toutes les clés d'un namespace
 * Utilise un set pour tracker les clés par namespace
 * @param namespace Namespace à invalider (ex: "members")
 */
export async function cacheInvalidateNamespace(namespace: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    // Récupérer toutes les clés du namespace depuis un set
    const setKey = `cache:namespace:${namespace}`;
    const keys = await redis.smembers(setKey);
    
    if (keys && keys.length > 0) {
      // Supprimer toutes les clés
      await redis.del(...keys);
      // Supprimer le set
      await redis.del(setKey);
    }
  } catch (error) {
    console.error(`[Cache] Erreur invalidateNamespace pour "${namespace}":`, error);
  }
}

/**
 * Ajoute une clé à un namespace pour tracking
 * @param namespace Namespace
 * @param key Clé à tracker
 */
async function trackKeyInNamespace(namespace: string, key: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const setKey = `cache:namespace:${namespace}`;
    await redis.sadd(setKey, key);
    // Expirer le set après 24h (pour éviter l'accumulation)
    await redis.expire(setKey, 86400);
  } catch (error) {
    // Ignorer les erreurs de tracking
  }
}

/**
 * Helper pour mettre en cache avec tracking de namespace
 * @param namespace Namespace (ex: "members")
 * @param key Clé complète
 * @param value Valeur
 * @param ttlSeconds TTL
 */
export async function cacheSetWithNamespace<T>(
  namespace: string,
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  await cacheSet(key, value, ttlSeconds);
  await trackKeyInNamespace(namespace, key);
}

/**
 * Constantes pour les TTL par type de données
 */
export const CACHE_TTL = {
  // Données statiques (TTL long)
  MEMBERS_ACTIVE: 300, // 5 minutes
  MEMBERS_VIP: 300, // 5 minutes
  MEMBERS_ALL: 600, // 10 minutes
  EVENTS_PUBLISHED: 120, // 2 minutes
  EVENTS_ALL: 300, // 5 minutes
  
  // Données dynamiques (TTL court)
  STATS: 60, // 1 minute
  HOME_DATA: 60, // 1 minute
  EVALUATIONS: 30, // 30 secondes
  SPOTLIGHTS_ACTIVE: 10, // 10 secondes
  PRESENCES: 15, // 15 secondes
  VIP_MEMBERS: 30, // 30 secondes
} as const;

/**
 * Génère une clé de cache standardisée
 */
export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}
