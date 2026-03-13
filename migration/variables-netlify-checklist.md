# ✅ Checklist Variables d'Environnement Netlify

## Variables Configurées ✅

- [x] `NEXT_PUBLIC_SUPABASE_URL` = `https://ggcpwaexhougomfnnsob.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_EXAMPLE_PLACEHOLDER`

## Variables Manquantes ⚠️

### 1. SUPABASE_SERVICE_ROLE_KEY (CRITIQUE)

**Pourquoi** : Clé secrète pour les opérations admin côté serveur (migrations, imports de données)

**Comment l'obtenir** :
1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. **Settings** → **API**
3. Copier la clé **service_role** (⚠️ C'est une clé SECRÈTE, cocher "Contains secret values" dans Netlify)

**À ajouter sur Netlify** :
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `votre_service_role_key`
- ✅ Cocher "Contains secret values"

### 2. DATABASE_URL (CRITIQUE)

**Pourquoi** : Connection string PostgreSQL pour Drizzle ORM et les migrations

**Comment l'obtenir** :
1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. **Settings** → **Database**
3. Scroller jusqu'à **Connection string**
4. Sélectionner **URI** (pas Session mode)
5. Copier la chaîne complète

**Format attendu** :
```
postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **Important** : Si vous n'avez pas le mot de passe de la base de données :
- Aller dans **Settings** → **Database** → **Database password**
- Cliquer sur **Reset database password**
- **SAUVEGARDER LE MOT DE PASSE** (vous ne pourrez plus le voir après)

**À ajouter sur Netlify** :
- Key: `DATABASE_URL`
- Value: `postgresql://postgres.[PROJECT]:[PASSWORD]@...`
- ✅ Cocher "Contains secret values"

### 3. Variables Netlify (pour migration des données)

Si vous voulez migrer les données depuis Netlify Blobs, vous aurez besoin de :

- `NETLIFY_SITE_ID` - Votre Site ID Netlify
- `NETLIFY_AUTH_TOKEN` - Token d'authentification Netlify

**Comment les obtenir** :
1. Aller dans **Site settings** → **General**
2. **Site ID** est visible en haut
3. Pour le token : **User settings** → **Applications** → Créer un Personal Access Token

### 4. Variables Optionnelles (pour plus tard)

- `UPSTASH_REDIS_URL` - Pour le cache Redis (optionnel)
- `UPSTASH_REDIS_TOKEN` - Token Upstash (optionnel)

## 📝 Résumé des Variables à Ajouter

```env
# Déjà fait ✅
NEXT_PUBLIC_SUPABASE_URL=https://ggcpwaexhougomfnnsob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EXAMPLE_PLACEHOLDER

# À ajouter ⚠️
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key (SECRET)
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@... (SECRET)

# Pour migration (optionnel)
NETLIFY_SITE_ID=votre_site_id
NETLIFY_AUTH_TOKEN=votre_auth_token (SECRET)
```

## 🔒 Bonnes Pratiques

1. **Toujours cocher "Contains secret values"** pour :
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `NETLIFY_AUTH_TOKEN`
   - Toute clé API ou mot de passe

2. **Ne JAMAIS exposer** :
   - `SUPABASE_SERVICE_ROLE_KEY` côté client
   - `DATABASE_URL` côté client
   - Les mots de passe

3. **Variables publiques** (préfixe `NEXT_PUBLIC_`) :
   - `NEXT_PUBLIC_SUPABASE_URL` ✅
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅

## ✅ Prochaines Étapes

Une fois toutes les variables ajoutées :

1. ✅ Créer le schéma de base de données
2. ✅ Générer les migrations
3. ✅ Appliquer les migrations
4. ✅ Migrer les données
