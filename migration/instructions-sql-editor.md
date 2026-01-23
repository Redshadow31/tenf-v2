# 📝 Instructions pour le SQL Editor Supabase

## ⚠️ Erreur Commune

Si vous voyez cette erreur :
```
ERROR: 42601: syntax error at or near "lib"
LINE 1: lib/db/migrations/0000_whole_micromax.sql
```

**Cela signifie que vous avez copié le CHEMIN du fichier au lieu de son CONTENU !**

## ✅ Solution Correcte

### Étape 1 : Ouvrir le Fichier SQL

1. Dans votre éditeur de code (VS Code, etc.)
2. Ouvrir le fichier : `migration/MIGRATION_SQL_COMPLETE.sql`
   - **OU** : `lib/db/migrations/0000_whole_micromax.sql`

### Étape 2 : Sélectionner TOUT le Contenu

1. Appuyer sur `Ctrl+A` (Windows) ou `Cmd+A` (Mac) pour tout sélectionner
2. Appuyer sur `Ctrl+C` (Windows) ou `Cmd+C` (Mac) pour copier

### Étape 3 : Coller dans le SQL Editor de Supabase

1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. Cliquer sur **SQL Editor** dans le menu de gauche
3. Cliquer sur **"New query"**
4. **Coller** le contenu copié (`Ctrl+V` ou `Cmd+V`)
5. Cliquer sur **"Run"** (ou `Ctrl+Enter` / `Cmd+Enter`)

## 📋 Ce que Vous Devriez Voir

Le SQL devrait commencer par :
```sql
CREATE TYPE "public"."bonus_type" AS ENUM('decalage-horaire', ...
```

**ET NON PAS** :
```
lib/db/migrations/0000_whole_micromax.sql
```

## ✅ Vérification

Après avoir exécuté le SQL, vous devriez voir :
- ✅ Message de succès
- ✅ Les 9 tables créées dans **Table Editor**

## 🎯 Fichier Prêt à Copier

J'ai créé un fichier `migration/MIGRATION_SQL_COMPLETE.sql` qui contient exactement le SQL à copier. C'est plus simple que d'ouvrir le fichier dans `lib/db/migrations/`.
