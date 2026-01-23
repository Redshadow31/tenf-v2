# 🔧 Appliquer les Migrations Manuellement

L'erreur "Tenant or user not found" indique un problème avec la connection string du pooler.

## Solution : Utiliser le SQL Editor de Supabase

### Étape 1 : Ouvrir le SQL Editor

1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **"New query"**

### Étape 2 : Copier le Contenu de la Migration

Ouvrir le fichier `lib/db/migrations/0000_whole_micromax.sql` et copier tout son contenu.

### Étape 3 : Exécuter la Migration

1. Coller le contenu SQL dans l'éditeur
2. Cliquer sur **"Run"** (ou appuyer sur `Ctrl+Enter` / `Cmd+Enter`)

### Étape 4 : Vérifier

1. Aller dans **Table Editor**
2. Vérifier que toutes les tables sont créées :
   - `members`
   - `events`
   - `event_registrations`
   - `spotlights`
   - `spotlight_presences`
   - `spotlight_evaluations`
   - `evaluations`
   - `vip_history`
   - `logs`

## Alternative : Corriger la Connection String

Le problème peut venir du format de la connection string. Essayez ces formats alternatifs :

### Format 1 : Direct Connection (port 5432)
```
postgresql://postgres:[PASSWORD]@db.ggcpwaexhougomfnnsob.supabase.co:5432/postgres
```

### Format 2 : Pooler avec format différent
```
postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Format 3 : Avec paramètres supplémentaires
```
postgresql://postgres:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require
```

## Vérifier la Connection String dans Supabase

1. Aller dans **Settings** → **Database**
2. Scroller jusqu'à trouver **"Connection string"** ou **"Connection info"**
3. Essayer différents formats (URI, Session mode, Transaction mode)
4. Copier le format qui fonctionne

## Après avoir appliqué les migrations

Une fois les tables créées, vous pourrez :
1. Tester la connexion avec le client Supabase
2. Commencer à migrer les données
3. Refactorer le code pour utiliser les repositories
