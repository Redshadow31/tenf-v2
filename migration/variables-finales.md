# ✅ Variables d'Environnement - Configuration Finale

## Variables Configurées sur Netlify ✅

- [x] `NEXT_PUBLIC_SUPABASE_URL` = `https://ggcpwaexhougomfnnsob.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_EXAMPLE_PLACEHOLDER`
- [x] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_EXAMPLE_PLACEHOLDER` (SECRET ✅)
- [x] `DATABASE_URL` = `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres` (SECRET ✅)

## ⚠️ Important : Ajouter DATABASE_URL sur Netlify

1. Aller dans Netlify Dashboard → **Site settings** → **Environment variables**
2. Cliquer sur **"Add variable"**
3. Remplir :
   - **Key** : `DATABASE_URL`
   - **Value** : `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - ✅ **Cocher "Contains secret values"** (très important !)
4. Cliquer sur **"Create variable"**

## ✅ Toutes les Variables sont Prêtes !

Maintenant on peut :
1. ✅ Créer le schéma de base de données
2. ✅ Générer les migrations
3. ✅ Appliquer les migrations
4. ✅ Migrer les données
