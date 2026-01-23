# 🔍 Analyse de l'Erreur de Connexion

## ❌ Erreur Exacte

```
Code: XX000
Message: Tenant or user not found
Severity: FATAL
Severity Local: FATAL
```

## 🔍 Cause du Problème

L'erreur "Tenant or user not found" (Code XX000) indique que :

1. **Le format de la connection string n'est pas correct** pour le pooler Supabase
2. Le format `postgres.ggcpwaexhougomfnnsob` comme username n'est pas reconnu par le pooler
3. Le pooler Supabase nécessite un format spécifique

## ✅ Solutions

### Solution 1 : Utiliser la Connection Directe (Recommandé pour les migrations)

Le format direct fonctionne mieux pour les migrations Drizzle :

```
postgresql://postgres:[PASSWORD]@db.ggcpwaexhougomfnnsob.supabase.co:5432/postgres
```

**Comment obtenir cette connection string :**
1. Aller dans Supabase Dashboard → **Settings** → **Database**
2. Scroller jusqu'à **"Connection string"**
3. Sélectionner **"URI"** (pas "Session mode" ou "Transaction mode")
4. Copier la chaîne complète
5. Elle devrait ressembler à : `postgresql://postgres:[PASSWORD]@db.ggcpwaexhougomfnnsob.supabase.co:5432/postgres`

### Solution 2 : Utiliser le SQL Editor (Plus Simple)

Au lieu d'utiliser Drizzle pour appliquer les migrations, utilisez directement le SQL Editor de Supabase :

1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. Cliquer sur **SQL Editor**
3. Cliquer sur **"New query"**
4. Ouvrir le fichier `lib/db/migrations/0000_whole_micromax.sql`
5. Copier tout le contenu
6. Coller dans l'éditeur SQL
7. Cliquer sur **"Run"**

### Solution 3 : Vérifier le Mot de Passe

L'erreur peut aussi venir d'un mot de passe incorrect :

1. Aller dans **Settings** → **Database** → **Database password**
2. Si vous n'êtes pas sûr du mot de passe, cliquer sur **"Reset database password"**
3. **SAUVEGARDER LE NOUVEAU MOT DE PASSE**
4. Mettre à jour `DATABASE_URL` dans `.env.local` avec le nouveau mot de passe

### Solution 4 : Vérifier les Network Restrictions

1. Aller dans **Settings** → **Database** → **Network Restrictions**
2. Vérifier que votre IP n'est pas bloquée
3. Si nécessaire, ajouter votre IP à la liste blanche

## 📝 Format Correct de Connection String

### Pour le Pooler (port 6543)
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Mais attention** : Le format avec `postgres.[PROJECT_REF]` comme username peut ne pas fonctionner avec tous les clients PostgreSQL.

### Pour la Connection Directe (port 5432) - Recommandé
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

## 🎯 Recommandation

**Utilisez le SQL Editor de Supabase** pour appliquer les migrations. C'est :
- ✅ Plus simple
- ✅ Plus fiable
- ✅ Pas de problème de connection string
- ✅ Vous pouvez voir les erreurs directement

Une fois les tables créées, vous pourrez utiliser le client Supabase normalement pour les requêtes.
