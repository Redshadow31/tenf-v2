# 🔧 Configuration Upstash Redis pour le Cache

Ce guide explique comment configurer Upstash Redis pour activer le cache dans TENF-V2.

---

## 📋 Prérequis

1. ✅ Compte Upstash (gratuit jusqu'à 10K commandes/jour)
2. ✅ Package `@upstash/redis` déjà installé dans `package.json`

---

## 🚀 Étape 1 : Créer une Base Redis sur Upstash

### 1.1 Créer un compte Upstash

1. Aller sur [https://upstash.com](https://upstash.com)
2. Créer un compte (gratuit)
3. Se connecter au dashboard

### 1.2 Créer une Base Redis

1. Dans le dashboard Upstash, cliquer sur **"Create Database"**
2. Choisir **"Redis"**
3. Configurer :
   - **Name** : `tenf-v2-cache` (ou autre nom)
   - **Type** : `Regional` (recommandé pour la latence)
   - **Region** : Choisir la région la plus proche (ex: `eu-west-1` pour l'Europe)
   - **TLS** : Activé (par défaut)
4. Cliquer sur **"Create"**

### 1.3 Récupérer les Credentials

Une fois la base créée :

1. Cliquer sur la base créée
2. Aller dans l'onglet **"Details"**
3. Copier :
   - **UPSTASH_REDIS_REST_URL** :** `https://xxxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN** :** `xxxxx...`

---

## 🔧 Étape 2 : Configurer les Variables d'Environnement

### 2.1 En Local (.env.local)

Ajouter dans `.env.local` :

```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx...
```

### 2.2 Sur Netlify (Production)

1. Aller dans **Netlify Dashboard** → Votre site → **Site settings** → **Environment variables**
2. Ajouter :
   - **Key** : `UPSTASH_REDIS_REST_URL`
   - **Value** : `https://xxxxx.upstash.io`
3. Ajouter :
   - **Key** : `UPSTASH_REDIS_REST_TOKEN`
   - **Value** : `xxxxx...`
4. Cliquer sur **"Save"**

---

## ✅ Étape 3 : Vérifier la Configuration

### 3.1 Test Local

Créer un script de test `scripts/test-redis.ts` :

```typescript
import { getRedisClient, cacheSet, cacheGet } from '../lib/cache';

async function test() {
  console.log('Test Redis...');
  
  // Test set
  await cacheSet('test:key', { message: 'Hello Redis!' }, 60);
  console.log('✅ Cache set');
  
  // Test get
  const value = await cacheGet<{ message: string }>('test:key');
  console.log('✅ Cache get:', value);
  
  if (value?.message === 'Hello Redis!') {
    console.log('✅ Redis fonctionne correctement !');
  } else {
    console.error('❌ Erreur Redis');
  }
}

test().catch(console.error);
```

Exécuter :

```bash
tsx scripts/test-redis.ts
```

### 3.2 Vérifier dans Upstash Dashboard

1. Aller dans le dashboard Upstash
2. Cliquer sur votre base Redis
3. Aller dans l'onglet **"Data Browser"**
4. Vous devriez voir les clés de cache créées

---

## 📊 Impact Attendu

Une fois Redis configuré :

- ⚡ **70-90%** de réduction des appels à Supabase
- ⚡ **Temps de réponse** réduit de 50-80%
- ⚡ **Coûts Supabase** réduits
- ⚡ **Meilleure scalabilité**

---

## 🔍 Dépannage

### Erreur : "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"

**Solution** : Vérifier que les variables d'environnement sont bien configurées dans `.env.local` et sur Netlify.

### Erreur : "Connection refused" ou "Timeout"

**Solution** : 
- Vérifier que la base Redis est active dans Upstash
- Vérifier que l'URL et le token sont corrects
- Vérifier la région (doit être accessible depuis votre serveur)

### Le cache ne fonctionne pas

**Solution** :
- Vérifier les logs : `[Cache] Erreur...`
- Vérifier que Redis est accessible depuis votre environnement
- En développement, le cache est désactivé si Redis n'est pas configuré (c'est normal)

---

## 💰 Coûts Upstash

### Plan Gratuit
- ✅ **10,000 commandes/jour** (gratuit)
- ✅ **256 MB de stockage**
- ✅ **Suffisant pour la plupart des sites**

### Plan Payant
- Si vous dépassez 10K commandes/jour :
  - **$0.20 par 100K commandes supplémentaires**
  - Très économique même pour un trafic élevé

---

## 📝 Notes

- Le cache est **optionnel** : si Redis n'est pas configuré, l'application fonctionne normalement sans cache
- Les TTL (Time To Live) sont configurés dans `lib/cache.ts` (`CACHE_TTL`)
- Le cache est automatiquement invalidé lors des modifications (create, update, delete)

---

**Date de création** : $(date)
