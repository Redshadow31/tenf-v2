# 🔄 Implémentation du Cache avec Redis (Upstash)

Ce guide explique comment implémenter un système de cache avec Upstash Redis pour optimiser les performances.

---

## 📋 Prérequis

- ✅ Upstash Redis configuré (déjà dans `package.json`)
- ✅ Variables d'environnement configurées

---

## 🔧 Étape 1 : Configuration

### 1.1 Variables d'Environnement

Ajoutez dans `.env.local` :

```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

### 1.2 Créer le Client Redis

Créez `lib/cache.ts` :

```typescript
import { Redis } from '@upstash/redis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set');
    }

    redisClient = new Redis({
      url,
      token,
    });
  }

  return redisClient;
}

// Helper pour le cache avec TTL
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    return data as T | null;
  } catch (error) {
    console.error('[Cache] Erreur get:', error);
    return null;
  }
}

export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    console.error('[Cache] Erreur set:', error);
  }
}

export async function cacheDelete(key: string): Promise<void> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
  } catch (error) {
    console.error('[Cache] Erreur delete:', error);
  }
}

export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[Cache] Erreur invalidate:', error);
  }
}
```

---

## 🔧 Étape 2 : Intégration dans les Repositories

### 2.1 Exemple : MemberRepository

Modifiez `lib/repositories/MemberRepository.ts` :

```typescript
import { cacheGet, cacheSet, cacheInvalidate } from '../cache';

export class MemberRepository {
  async findActive(limit = 50, offset = 0): Promise<MemberData[]> {
    const cacheKey = `members:active:${limit}:${offset}`;
    
    // Essayer de récupérer du cache
    const cached = await cacheGet<MemberData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    // Si pas en cache, récupérer depuis Supabase
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const members = (data || []).map(this.mapToMemberData);

    // Mettre en cache pour 5 minutes
    await cacheSet(cacheKey, members, 300);

    return members;
  }

  async update(login: string, updates: Partial<MemberData>): Promise<MemberData> {
    const updated = await this.updateInternal(login, updates);
    
    // Invalider le cache des membres
    await cacheInvalidate('members:*');
    
    return updated;
  }
}
```

---

## 🔧 Étape 3 : Cache pour les Routes API

### 3.1 Exemple : Route /api/members/public

Modifiez `app/api/members/public/route.ts` :

```typescript
import { cacheGet, cacheSet } from '@/lib/cache';

export const revalidate = 60; // ISR de 60 secondes

export async function GET() {
  const cacheKey = 'api:members:public';
  
  // Vérifier le cache
  const cached = await cacheGet<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // Récupérer les données
  const activeMembers = await memberRepository.findActive(1000, 0);
  // ... traitement des données ...

  const response = { members: publicMembers };

  // Mettre en cache pour 60 secondes
  await cacheSet(cacheKey, response, 60);

  return NextResponse.json(response);
}
```

---

## 📊 Stratégies de Cache par Type de Données

### Données Statiques (TTL long)
- **Membres actifs** : 5 minutes (300s)
- **Événements publiés** : 2 minutes (120s)
- **Statistiques** : 1 minute (60s)

### Données Dynamiques (TTL court)
- **Évaluations** : 30 secondes
- **Spotlights actifs** : 10 secondes
- **Présences** : 15 secondes

### Invalidation du Cache
- **Lors des updates** : Invalider les clés correspondantes
- **Pattern matching** : `cacheInvalidate('members:*')`
- **Manuel** : Pour les données critiques

---

## 🎯 Résultat Attendu

- ⚡ **Réduction de 70-90%** des requêtes à la base de données
- ⚡ **Temps de réponse** réduit de 50-80%
- ⚡ **Coût Supabase** réduit (moins de requêtes)
- ⚡ **Expérience utilisateur** améliorée

---

**Date de création** : $(date)
