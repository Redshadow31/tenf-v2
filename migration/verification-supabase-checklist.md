# ✅ Checklist de Vérification selon Supabase

## 1. ✅ Vérifier les Variables d'Environnement dans Netlify

**Status** : ✅ Configuré

Variables configurées sur Netlify :
- `NEXT_PUBLIC_SUPABASE_URL` = `https://ggcpwaexhougomfnnsob.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_TC-xB59hf4FEewC8kdFaCQ_3NqsJxc7`
- `SUPABASE_SERVICE_ROLE_KEY` = `sb_secret_pt1XELVAoYCbc-WM7Jfdjg_W1adRP20` (SECRET ✅)
- `DATABASE_URL` = `postgresql://...` (SECRET ✅)

⚠️ **Important** : `SUPABASE_SERVICE_ROLE_KEY` ne doit JAMAIS être exposé côté client.

## 2. ✅ Vérifier l'URL / Project Ref

**Status** : ✅ Correct

- URL utilisée : `https://ggcpwaexhougomfnnsob.supabase.co`
- Project ref : `ggcpwaexhougomfnnsob`
- Vérifié dans le dashboard Supabase

## 3. ⚠️ Hooks Auth / Before-user-created / Tenant Logic

**À vérifier** :

1. Aller dans **Supabase Dashboard** → **Authentication** → **Hooks**
2. Vérifier s'il y a un hook "before-user-created" configuré
3. Si oui, vérifier qu'il ne bloque pas la connexion
4. Vérifier les fonctions PL/pgSQL personnalisées qui pourraient résoudre tenant/user

**Note** : Pour les migrations, les hooks auth ne devraient pas être un problème car on utilise `SUPABASE_SERVICE_ROLE_KEY` qui bypass RLS.

## 4. ⚠️ JWT / Claims Personnalisés / Tenant Claim

**Status** : Non applicable pour les migrations

Les JWT/claims ne sont pas nécessaires pour appliquer les migrations via le SQL Editor ou avec `SUPABASE_SERVICE_ROLE_KEY`.

## 5. ✅ Migrations Non Appliquées

**Status** : En cours

- ✅ Migration SQL générée : `lib/db/migrations/0000_whole_micromax.sql`
- ⏳ Migration à appliquer : Via SQL Editor (recommandé)

**Solution** : Utiliser le SQL Editor de Supabase pour appliquer la migration.

## 6. 📋 Logs Supabase / Postgres

**Comment vérifier** :

1. Aller dans **Supabase Dashboard** → **Logs**
2. Filtrer par type : **Postgres** ou **Auth**
3. Chercher les erreurs autour du timestamp de l'erreur
4. Les logs indiqueront quelle fonction ou hook a renvoyé l'erreur

## 7. ✅ CORS / Proxys (Netlify)

**Status** : Non applicable pour les migrations

Les problèmes CORS/proxy ne concernent que les appels depuis le frontend. Pour les migrations, on utilise directement le SQL Editor ou le client Supabase avec `SERVICE_ROLE_KEY`.

## 🎯 Recommandation Finale

**Pour appliquer les migrations** :

1. ✅ Utiliser le **SQL Editor** de Supabase (le plus simple et fiable)
2. ✅ Ou utiliser le client Supabase avec `SERVICE_ROLE_KEY` (si nécessaire)
3. ❌ Éviter la connection string PostgreSQL directe pour les migrations (problème avec le pooler)

**Après avoir appliqué les migrations** :

1. Vérifier dans **Table Editor** que toutes les tables sont créées
2. Tester la connexion avec le client Supabase
3. Commencer à migrer les données
