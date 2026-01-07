# Guide d'Activation - TENF V2

Ce guide explique comment activer toutes les fonctionnalités de l'application.

## 📋 Vue d'ensemble des configurations nécessaires

### 1. **Authentification Discord OAuth2** (Connexion utilisateurs)
- Nécessite : Application Discord OAuth2
- Utilisé pour : Connexion des utilisateurs sur le site

### 2. **Bot Discord** (Récupération des données serveur)
- Nécessite : Bot Discord avec permissions
- Utilisé pour : Récupérer les membres VIP Elite depuis le serveur Discord

### 3. **API Twitch** (Déjà configuré ✅)
- Déjà configuré avec vos clés API

---

## 🔐 ÉTAPE 1 : Créer une Application Discord OAuth2

### Pour l'authentification des utilisateurs

1. **Aller sur le Discord Developer Portal**
   - https://discord.com/developers/applicaations
   - Cliquez sur "New Application"
   - Nommez-la (ex: "TENF V2")

2. **Récupérer le Client ID et Secret**
   - Dans "OAuth2" → "General"
   - Copiez le **Client ID**
   - Cliquez sur "Reset Secret" pour obtenir le **Client Secret**

3. **Configurer les Redirects**
   - Dans "OAuth2" → "General"
   - Ajoutez ces URLs dans "Redirects" :
     ```
     http://localhost:3000/api/auth/discord/callback
     https://votre-domaine.com/api/auth/discord/callback
     ```

4. **Sélectionner les Scopes**
   - Dans "OAuth2" → "URL Generator"
   - Cochez : `identify`, `email`, `guilds`

---

## 🤖 ÉTAPE 2 : Créer un Bot Discord

### Pour récupérer les membres VIP depuis le serveur

1. **Créer le Bot**
   - Dans votre application Discord (créée à l'étape 1)
   - Allez dans "Bot"
   - Cliquez sur "Add Bot" → "Yes, do it!"
   - Activez ces options :
     - ✅ **Public Bot** (si vous voulez que d'autres serveurs puissent l'ajouter)
     - ✅ **Message Content Intent** (si nécessaire)

2. **Récupérer le Token du Bot**
   - Toujours dans "Bot"
   - Cliquez sur "Reset Token" → Copiez le token
   - ⚠️ **IMPORTANT** : Gardez ce token secret !

3. **Ajouter le Bot à votre serveur Discord**
   - Dans "OAuth2" → "URL Generator"
   - Sélectionnez les scopes : `bot`
   - Sélectionnez les permissions :
     - ✅ View Channels
     - ✅ Read Message History
     - ✅ View Server Members (OBLIGATOIRE)
   - Copiez l'URL générée
   - Ouvrez cette URL dans votre navigateur
   - Sélectionnez votre serveur Discord (ID: 535244857891880970)
   - Autorisez le bot

---

## ⚙️ ÉTAPE 3 : Configurer les variables d'environnement

Ajoutez toutes ces variables dans votre fichier `.env.local` :

```env
# ============================================
# TWITCH API (Déjà configuré ✅)
# ============================================
TWITCH_CLIENT_ID=rr75kdousbzbp8qfjy0xtppwpljuke
TWITCH_CLIENT_SECRET=bn48h38zjqid0dsydemqymg13587nq

# ============================================
# DISCORD OAUTH2 (Pour l'authentification)
# ============================================
DISCORD_CLIENT_ID=votre_client_id_oauth2_ici
DISCORD_CLIENT_SECRET=votre_client_secret_oauth2_ici
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# ============================================
# DISCORD BOT (Pour récupérer les membres VIP)
# ============================================
DISCORD_BOT_TOKEN=votre_bot_token_ici
```

---

## 📄 Pages et leurs dépendances

### ✅ Pages qui fonctionnent SANS configuration Discord

- ✅ **Page d'accueil** (`/`)
- ✅ **Page Membres** (`/membres`)
- ✅ **Page Lives** (`/lives`)
- ✅ **Page Événements** (`/events`)
- ✅ **Page Boutique** (`/boutique`)
- ✅ **Page VIP** (`/vip`) - Affichera une liste vide sans bot
- ✅ **Toutes les pages Admin** - Fonctionnent avec données mock

### 🔐 Pages nécessitant Discord OAuth2

- **Connexion Discord** (`/auth/login`)
  - Nécessite : `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET`
  - Permet aux utilisateurs de se connecter avec leur compte Discord

- **Header** (affichage utilisateur connecté)
  - Nécessite : Discord OAuth2 configuré
  - Affiche l'avatar et le nom de l'utilisateur connecté

### 🤖 Pages nécessitant Discord Bot

- **Page VIP** (`/vip`)
  - Nécessite : `DISCORD_BOT_TOKEN`
  - Récupère les membres avec le rôle "VIP Elite" depuis le serveur Discord

- **Page Clips VIP** (`/vip/clips`)
  - Nécessite : `DISCORD_BOT_TOKEN` (pour récupérer la liste des VIP)

---

## 🚀 Étapes de déploiement sur Netlify

### 1. Ajouter les variables d'environnement sur Netlify

1. Allez sur votre dashboard Netlify
2. Sélectionnez votre site
3. Allez dans **Site settings** → **Environment variables**
4. Ajoutez toutes les variables :

```
TWITCH_CLIENT_ID=rr75kdousbzbp8qfjy0xtppwpljuke
TWITCH_CLIENT_SECRET=bn48h38zjqid0dsydemqymg13587nq
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_BOT_TOKEN=votre_bot_token
DISCORD_REDIRECT_URI=https://votre-site.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://votre-site.netlify.app
```

### 2. Mettre à jour les Redirects Discord

Dans le Discord Developer Portal, ajoutez aussi :
```
https://votre-site.netlify.app/api/auth/discord/callback
```

---

## ✅ Checklist de vérification

- [ ] Application Discord OAuth2 créée
- [ ] Client ID et Secret OAuth2 récupérés
- [ ] Bot Discord créé
- [ ] Token du bot récupéré
- [ ] Bot ajouté au serveur Discord avec permissions
- [ ] Toutes les variables d'environnement ajoutées dans `.env.local`
- [ ] Variables d'environnement ajoutées sur Netlify
- [ ] Redirects Discord configurés pour production

---

## 🧪 Test de fonctionnement

### Tester l'authentification Discord OAuth2
1. Allez sur `/auth/login`
2. Cliquez sur "Se connecter avec Discord"
3. Vous devriez être redirigé vers Discord pour autoriser
4. Après autorisation, vous revenez sur le site connecté

### Tester la récupération des VIP
1. Allez sur `/vip`
2. La page devrait afficher les membres avec le rôle "VIP Elite"
3. Si vide, vérifiez :
   - Le bot est bien sur le serveur
   - Le rôle "VIP Elite" existe sur le serveur
   - Le `DISCORD_BOT_TOKEN` est correct

---

## 📝 Notes importantes

1. **Sécurité** : Ne partagez JAMAIS vos tokens ou secrets publiquement
2. **Permissions Bot** : Le bot doit avoir "View Server Members" pour fonctionner
3. **Rôle VIP Elite** : Le nom exact du rôle doit contenir "VIP" et "Elite" (insensible à la casse)
4. **Production** : N'oubliez pas de mettre à jour `DISCORD_REDIRECT_URI` pour votre domaine de production

---

## 🆘 Dépannage

### Erreur "Discord bot token not configured"
→ Ajoutez `DISCORD_BOT_TOKEN` dans `.env.local`

### Erreur "Discord Client ID not configured"
→ Ajoutez `DISCORD_CLIENT_ID` dans `.env.local`

### La page VIP est vide
→ Vérifiez que :
- Le bot est sur le serveur Discord
- Le rôle "VIP Elite" existe
- Le bot a les permissions nécessaires

### Erreur OAuth "invalid redirect_uri"
→ Vérifiez que l'URL de callback est bien dans les Redirects Discord








