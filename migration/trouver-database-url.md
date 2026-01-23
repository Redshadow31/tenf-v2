# 🔍 Comment Trouver DATABASE_URL dans Supabase

## Méthode 1 : Dans Settings → Database (Scroller)

1. Aller dans **Settings** → **Database**
2. **Scroller vers le bas** de la page
3. Chercher la section **"Connection string"** ou **"Connection pooling"**
4. Vous devriez voir plusieurs onglets :
   - **URI** ← C'est celui-ci qu'il faut !
   - Session mode
   - Transaction mode
5. Cliquer sur l'onglet **URI**
6. Copier la chaîne complète

## Méthode 2 : Construire la Connection String Manuellement

Si vous ne trouvez pas la section, vous pouvez construire la connection string manuellement :

### Étape 1 : Récupérer le Host

1. Aller dans **Settings** → **API**
2. Chercher **"Project URL"** ou **"Config"**
3. Le host ressemble à : `db.ggcpwaexhougomfnnsob.supabase.co` ou `aws-0-eu-central-1.pooler.supabase.com`

### Étape 2 : Récupérer le Mot de Passe

1. Aller dans **Settings** → **Database**
2. Section **"Database password"**
3. Si vous n'avez pas le mot de passe :
   - Cliquer sur **"Reset database password"**
   - **SAUVEGARDER LE MOT DE PASSE** (vous ne pourrez plus le voir après !)

### Étape 3 : Construire la Connection String

Format :
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres
```

Exemple :
```
postgresql://postgres.ggcpwaexhougomfnnsob:VotreMotDePasse@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**OU** (si vous utilisez le pooler direct) :
```
postgresql://postgres:[PASSWORD]@db.ggcpwaexhougomfnnsob.supabase.co:5432/postgres
```

## Méthode 3 : Utiliser le SQL Editor

1. Aller dans **SQL Editor** dans Supabase
2. Exécuter cette requête :
```sql
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
```
3. Cela vous donnera des informations sur la connexion

## Méthode 4 : Vérifier dans Project Settings

1. Aller dans **Settings** (icône engrenage en bas à gauche)
2. Cliquer sur **"General"** ou **"Project Settings"**
3. Chercher **"Database"** ou **"Connection Info"**

## ⚠️ Important : Pooler vs Direct Connection

Supabase offre deux types de connexions :

### Connection Pooling (Recommandé pour Drizzle)
- Port : **6543**
- Host : `aws-0-eu-central-1.pooler.supabase.com` (ou similaire)
- Format : `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[HOST]:6543/postgres`

### Direct Connection
- Port : **5432**
- Host : `db.ggcpwaexhougomfnnsob.supabase.co`
- Format : `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Pour Drizzle ORM, utilisez le pooler (port 6543)** car c'est plus performant.

## 🔧 Alternative : Utiliser Supabase Client Directement

Si vous avez vraiment du mal à trouver la connection string, on peut utiliser le client Supabase directement pour certaines opérations, mais pour les migrations Drizzle, on a besoin de la connection string.

## ✅ Vérification

Une fois que vous avez la connection string, testez-la :

```bash
# Installer psql (si pas déjà fait)
# Puis tester la connexion
psql "postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:6543/postgres"
```

Si la connexion fonctionne, vous verrez un prompt PostgreSQL.
