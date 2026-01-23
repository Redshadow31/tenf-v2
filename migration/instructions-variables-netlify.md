# 📝 Instructions pour Récupérer les Variables Netlify

## Variables Requises

Pour exporter les données depuis Netlify Blobs, vous avez besoin de :

1. `NETLIFY_SITE_ID` - ID de votre site Netlify
2. `NETLIFY_AUTH_TOKEN` - Token d'authentification Netlify

## 🔍 Comment Récupérer NETLIFY_SITE_ID

1. Aller sur https://app.netlify.com
2. Sélectionner votre site (teamnewfamily)
3. Aller dans **Site settings** → **General**
4. Scroller jusqu'à la section **"Site information"**
5. Copier le **"Site ID"** (format : `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## 🔑 Comment Créer NETLIFY_AUTH_TOKEN

1. Aller sur https://app.netlify.com
2. Cliquer sur votre **profil** (icône en haut à droite)
3. Cliquer sur **"User settings"**
4. Aller dans **"Applications"** dans le menu de gauche
5. Cliquer sur **"Personal access tokens"**
6. Cliquer sur **"New access token"**
7. Donner un nom (ex: "TENF Migration V3")
8. Cliquer sur **"Generate token"**
9. **⚠️ IMPORTANT** : Copier le token immédiatement (il ne sera plus affiché après !)
10. Cliquer sur **"Done"**

## 📝 Ajouter dans .env.local

Une fois que vous avez les deux valeurs, ajoutez-les dans `.env.local` :

```env
NETLIFY_SITE_ID=votre_site_id_ici
NETLIFY_AUTH_TOKEN=votre_token_ici
```

## ✅ Alternative : Script Automatique

Vous pouvez aussi exécuter :

```bash
npx tsx migration/ajouter-variables-netlify.ts
```

Cela ajoutera les lignes dans `.env.local` avec des placeholders que vous devrez remplir.

## 🚀 Après Configuration

Une fois les variables ajoutées, vous pourrez exécuter :

```bash
npx tsx migration/export-from-blobs.ts
```

Cela exportera toutes les données depuis Netlify Blobs vers `migration/exported-data/`.
