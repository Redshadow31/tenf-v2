# 🚀 Prochaines Étapes - Migration V3

## ✅ Ce qui est fait

- [x] Dépendances installées (Supabase, Drizzle, etc.)
- [x] Variables d'environnement configurées sur Netlify
- [x] Schéma de base de données créé (`lib/db/schema.ts`)
- [x] Clients Drizzle et Supabase créés

## 📝 À Faire Maintenant

### 1. Ajouter DATABASE_URL sur Netlify (IMPORTANT)

1. Aller dans Netlify Dashboard → **Site settings** → **Environment variables**
2. Cliquer sur **"Add variable"**
3. Remplir :
   - **Key** : `DATABASE_URL`
   - **Value** : `postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - ✅ **Cocher "Contains secret values"**
4. Cliquer sur **"Create variable"**

### 2. Créer le fichier .env.local (pour développement local)

Créer un fichier `.env.local` à la racine du projet avec :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggcpwaexhougomfnnsob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_EXAMPLE_PLACEHOLDER
SUPABASE_SERVICE_ROLE_KEY=sb_secret_EXAMPLE_PLACEHOLDER

# Database Connection String
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

⚠️ **Important** : Le fichier `.env.local` est déjà dans `.gitignore`, donc il ne sera pas commité.

### 3. Générer les Migrations SQL

Une fois `.env.local` créé, exécuter :

```bash
npm run db:generate
```

Cela va créer les fichiers de migration dans `lib/db/migrations/`.

### 4. Appliquer les Migrations à Supabase

```bash
npm run db:migrate
```

Cela va créer toutes les tables dans votre base de données Supabase.

### 5. Vérifier dans Supabase

1. Aller dans Supabase Dashboard → **Table Editor**
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

### 6. Tester la Connexion

```bash
npx tsx migration/test-connection.ts
```

## 📋 Checklist Complète

- [ ] DATABASE_URL ajoutée sur Netlify (avec "Contains secret values")
- [ ] Fichier `.env.local` créé avec toutes les variables
- [ ] Migrations générées (`npm run db:generate`)
- [ ] Migrations appliquées (`npm run db:migrate`)
- [ ] Tables vérifiées dans Supabase Dashboard
- [ ] Test de connexion réussi

## 🎯 Après ces Étapes

Une fois les tables créées, on pourra :
1. Créer les scripts de migration des données
2. Exporter les données depuis Netlify Blobs
3. Importer les données vers Supabase
4. Refactorer le code pour utiliser les repositories
