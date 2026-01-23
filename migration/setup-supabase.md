# 🔧 Configuration Supabase - Guide Rapide

## 📍 Votre Projet Supabase

**URL du projet** : https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob

## 🔑 Récupérer les Clés API

### Étape 1 : Aller dans Settings → API

1. Dans votre dashboard Supabase, cliquez sur **Settings** (icône engrenage en bas à gauche)
2. Cliquez sur **API** dans le menu

### Étape 2 : Noter les Informations

Vous verrez plusieurs sections importantes :

#### Project URL
```
NEXT_PUBLIC_SUPABASE_URL=https://ggcpwaexhougomfnnsob.supabase.co
```

#### API Keys
- **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **SECRET - Ne jamais exposer côté client**

### Étape 3 : Récupérer la Connection String

1. Aller dans **Settings** → **Database**
2. Scroller jusqu'à **Connection string**
3. Sélectionner **URI** (pas Session mode)
4. Copier la chaîne qui ressemble à :
   ```
   postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```

⚠️ **Important** : Si vous n'avez pas le mot de passe, vous devrez le réinitialiser :
- Aller dans **Settings** → **Database** → **Database password**
- Cliquer sur **Reset database password**
- **SAUVEGARDER LE MOT DE PASSE** (vous ne pourrez plus le voir après)

## 📝 Configuration du Fichier .env.local

Créer ou mettre à jour `.env.local` à la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggcpwaexhougomfnnsob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key_ici
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici

# Database Connection String
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

# Netlify (pour migration des données)
NETLIFY_SITE_ID=votre_netlify_site_id
NETLIFY_AUTH_TOKEN=votre_netlify_auth_token

# Upstash Redis (optionnel)
UPSTASH_REDIS_URL=https://votre-redis.upstash.io
UPSTASH_REDIS_TOKEN=votre_token
```

## ✅ Vérification

Pour vérifier que tout est bien configuré, vous pouvez créer un fichier de test :

```typescript
// test-supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('members').select('count');
  console.log('Connection test:', error ? '❌ Failed' : '✅ Success');
  if (error) console.error(error);
}

test();
```

Exécuter : `npx tsx test-supabase.ts`

## 🚀 Prochaines Étapes

Une fois les variables configurées :

1. ✅ Créer le schéma de base de données (Phase 3 du guide)
2. ✅ Générer les migrations
3. ✅ Appliquer les migrations
4. ✅ Migrer les données

Voir `GUIDE_MIGRATION_V3.md` pour les détails complets.
