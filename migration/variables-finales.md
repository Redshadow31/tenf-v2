# ✅ Variables d'Environnement - Configuration Finale

## Variables Configurées sur Netlify ✅

- [x] `NEXT_PUBLIC_SUPABASE_URL` = `https://ggcpwaexhougomfnnsob.supabase.co`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_TC-xB59hf4FEewC8kdFaCQ_3NqsJxc7`
- [x] `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_pt1XELVAoYCbc-WM7Jfdjg_W1adRP20` (SECRET ✅)
- [x] `DATABASE_URL` = `postgresql://postgres.ggcpwaexhougomfnnsob:DpDAkhQCrsJrsWXl@aws-0-eu-central-1.pooler.supabase.com:6543/postgres` (SECRET ✅)

## ⚠️ Important : Ajouter DATABASE_URL sur Netlify

1. Aller dans Netlify Dashboard → **Site settings** → **Environment variables**
2. Cliquer sur **"Add variable"**
3. Remplir :
   - **Key** : `DATABASE_URL`
   - **Value** : `postgresql://postgres.ggcpwaexhougomfnnsob:DpDAkhQCrsJrsWXl@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`
   - ✅ **Cocher "Contains secret values"** (très important !)
4. Cliquer sur **"Create variable"**

## ✅ Toutes les Variables sont Prêtes !

Maintenant on peut :
1. ✅ Créer le schéma de base de données
2. ✅ Générer les migrations
3. ✅ Appliquer les migrations
4. ✅ Migrer les données
