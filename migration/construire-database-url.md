# 🔧 Construire DATABASE_URL Manuellement

## ✅ Informations que nous avons déjà

- **Project Reference** : `ggcpwaexhougomfnnsob`
- **Project URL** : `https://ggcpwaexhougomfnnsob.supabase.co`

## 📝 Étapes pour Construire la Connection String

### Étape 1 : Récupérer le Mot de Passe de la Base de Données

1. Dans Supabase Dashboard → **Settings** → **Database**
2. Section **"Database password"**
3. Si vous voyez le mot de passe, copiez-le
4. Si vous ne le voyez pas ou ne l'avez jamais défini :
   - Cliquez sur **"Reset database password"**
   - **SAUVEGARDEZ LE MOT DE PASSE** (vous ne pourrez plus le voir après !)
   - Notez-le quelque part de sûr

### Étape 2 : Construire la Connection String

Une fois que vous avez le mot de passe, utilisez ce format :

#### Option 1 : Connection Pooling (Recommandé pour Drizzle)

```
postgresql://postgres.ggcpwaexhougomfnnsob:[VOTRE_MOT_DE_PASSE]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Remplacez `[VOTRE_MOT_DE_PASSE]` par le mot de passe que vous avez récupéré.**

#### Option 2 : Direct Connection (Alternative)

```
postgresql://postgres:[VOTRE_MOT_DE_PASSE]@db.ggcpwaexhougomfnnsob.supabase.co:5432/postgres
```

### Étape 3 : Déterminer la Région

Le host peut varier selon votre région :
- **Europe** : `aws-0-eu-central-1.pooler.supabase.com` ou `aws-0-eu-west-1.pooler.supabase.com`
- **US** : `aws-0-us-east-1.pooler.supabase.com` ou `aws-0-us-west-1.pooler.supabase.com`
- **Asia** : `aws-0-ap-southeast-1.pooler.supabase.com`

**Pour trouver votre région** :
1. Aller dans **Settings** → **General**
2. Chercher **"Region"** ou **"Infrastructure"**
3. Ou regarder dans l'URL de votre projet (si elle contient une région)

### Étape 4 : Tester la Connection String

Une fois construite, vous pouvez la tester avec :

```bash
# Installer psql (si pas déjà fait)
# Windows : via Chocolatey ou installer PostgreSQL
# Mac : brew install postgresql
# Linux : sudo apt install postgresql-client

# Tester la connexion
psql "postgresql://postgres.ggcpwaexhougomfnnsob:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
```

Si la connexion fonctionne, vous verrez un prompt PostgreSQL.

## 🎯 Solution Rapide : Utiliser le Client Supabase Directement

Si vous avez vraiment du mal à trouver la connection string, on peut commencer par utiliser uniquement le client Supabase pour certaines opérations, et ajouter la connection string plus tard pour les migrations.

## 📋 Exemple de Connection String Complète

Voici un exemple avec des valeurs fictives :

```
postgresql://postgres.ggcpwaexhougomfnnsob:MonMotDePasse123!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

**Important** : 
- Remplacez `MonMotDePasse123!` par votre vrai mot de passe
- Vérifiez que la région correspond (eu-central-1, us-east-1, etc.)

## ✅ Une fois que vous avez la Connection String

1. Ajoutez-la sur Netlify comme variable d'environnement :
   - Key: `DATABASE_URL`
   - Value: `postgresql://postgres.ggcpwaexhougomfnnsob:[PASSWORD]@...`
   - ✅ Cocher "Contains secret values"

2. Testez avec Drizzle :
   ```bash
   npm run db:generate
   ```
