# 🔑 Variables d'Environnement Netlify - Production

## ✅ Variables à Ajouter sur Netlify

Allez dans **Netlify Dashboard → Site settings → Environment variables** et ajoutez :

### Variables Supabase (NOUVELLES - OBLIGATOIRES)

| Variable | Valeur | Secret |
|----------|--------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ggcpwaexhougomfnnsob.supabase.co` | ❌ Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `sb_publishable_EXAMPLE_PLACEHOLDER` | ❌ Non |
| `SUPABASE_SERVICE_ROLE_KEY` | `sb_secret_EXAMPLE_PLACEHOLDER` | ✅ **OUI** |
| `DATABASE_URL` | `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` | ✅ **OUI** |

### Variables Existantes (Vérifier qu'elles sont toujours là)

Ces variables devraient déjà être configurées, mais vérifiez qu'elles sont toujours présentes :

- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `NEXT_PUBLIC_BASE_URL`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`
- `DISCORD_BOT_TOKEN` (si utilisé)
- Autres variables existantes...

## 📝 Instructions Détaillées

### 1. Ajouter NEXT_PUBLIC_SUPABASE_URL

1. Cliquer sur **"Add variable"**
2. **Key** : `NEXT_PUBLIC_SUPABASE_URL`
3. **Value** : `https://ggcpwaexhougomfnnsob.supabase.co`
4. **Contains secret values** : ❌ Non coché
5. Cliquer sur **"Create variable"**

### 2. Ajouter NEXT_PUBLIC_SUPABASE_ANON_KEY

1. Cliquer sur **"Add variable"**
2. **Key** : `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Value** : `sb_publishable_EXAMPLE_PLACEHOLDER`
4. **Contains secret values** : ❌ Non coché
5. Cliquer sur **"Create variable"**

### 3. Ajouter SUPABASE_SERVICE_ROLE_KEY

1. Cliquer sur **"Add variable"**
2. **Key** : `SUPABASE_SERVICE_ROLE_KEY`
3. **Value** : `sb_secret_EXAMPLE_PLACEHOLDER`
4. **Contains secret values** : ✅ **COCHER** (très important !)
5. Cliquer sur **"Create variable"**

### 4. Ajouter DATABASE_URL

1. Cliquer sur **"Add variable"**
2. **Key** : `DATABASE_URL`
3. **Value** : `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
4. **Contains secret values** : ✅ **COCHER** (très important !)
5. Cliquer sur **"Create variable"**

## ⚠️ Points Importants

1. **Pas d'espaces** avant/après le `=` dans les valeurs
2. **Pas de guillemets** autour des valeurs
3. **Cocher "Contains secret values"** pour les clés secrètes
4. **Redéployer** après avoir ajouté les variables

## ✅ Vérification

Après avoir ajouté toutes les variables :

1. Vérifier qu'elles apparaissent dans la liste
2. Vérifier que les secrets sont marqués comme "secret"
3. Redéployer le site
4. Vérifier les logs pour confirmer qu'il n'y a pas d'erreur

## 🚀 Après Configuration

Une fois toutes les variables ajoutées :

1. **Redéployer** le site (déploiement automatique ou manuel)
2. **Tester** les routes migrées
3. **Vérifier** les logs pour confirmer que tout fonctionne

Voir `migration/CHECKLIST_DEPLOIEMENT.md` pour la checklist complète.
