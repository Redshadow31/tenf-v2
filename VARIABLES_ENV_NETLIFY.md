# 📋 Variables d'environnement Netlify - TENF V2

## ✅ Variables déjà configurées sur Netlify

D'après votre configuration actuelle, vous avez :

1. ✅ **DISCORD_CLIENT_ID** - ID de l'application Discord OAuth2
2. ✅ **DISCORD_CLIENT_SECRET** - Secret de l'application Discord OAuth2
3. ✅ **DISCORD_REDIRECT_URI** - `https://tenf-community.com/api/auth/discord/callback`
4. ✅ **NEXT_PUBLIC_BASE_URL** - URL de base de votre site Netlify
5. ✅ **TWITCH_CLIENT_ID** - ID de l'application Twitch
6. ✅ **TWITCH_CLIENT_SECRET** - Secret de l'application Twitch
7. ✅ **NEXTAUTH_SECRET** - Secret pour signer les tokens NextAuth
8. ✅ **NEXTAUTH_URL** - URL de base pour NextAuth
9. ✅ **DISCORD_BOT_TOKEN** - Token du bot Discord
10. ✅ **STATBOT_API_KEY** - Clé API Statbot
11. ✅ **STATBOT_SERVER_ID** - ID du serveur Discord pour Statbot

## ✅ Toutes les variables sont configurées !

Toutes les variables d'environnement nécessaires sont maintenant configurées sur Netlify.

### 1. **NEXTAUTH_SECRET** (OBLIGATOIRE) ✅ Configuré
- **Description** : Secret utilisé pour signer les tokens NextAuth
- **Valeur** : `VOTRE_NEXTAUTH_SECRET_ICI` (générez un secret sécurisé)
- **Où l'utiliser** : `lib/auth.ts` ligne 17

### 2. **NEXTAUTH_URL** (OBLIGATOIRE) ✅ Configuré
- **Description** : URL de base de votre application pour NextAuth
- **Valeur** : `https://tenf-community.com`
- **Où l'utiliser** : Configuration NextAuth

### 3. **DISCORD_BOT_TOKEN** (Optionnel mais recommandé) ✅ Configuré
- **Description** : Token du bot Discord pour récupérer les membres VIP
- **Valeur** : `[Configuré sur Netlify - non affiché pour sécurité]`
- **Où l'utiliser** : `app/api/vip-members/route.ts`
- **Note** : Nécessaire uniquement si vous voulez récupérer les membres VIP depuis Discord

### 4. **STATBOT_API_KEY** (OBLIGATOIRE pour les statistiques Discord) ✅ Configuré
- **Description** : Clé API Statbot pour récupérer les statistiques Discord (messages, heures vocales)
- **Valeur** : `VOTRE_STATBOT_API_KEY_ICI`
- **Où l'utiliser** : `netlify/functions/statbot-fetch.ts`
- **Note** : Nécessaire pour le bouton "Récupérer les données Statbot" dans le dashboard

### 5. **STATBOT_SERVER_ID** (OBLIGATOIRE pour les statistiques Discord) ✅ Configuré
- **Description** : ID du serveur Discord pour Statbot
- **Valeur** : `535244857891880970`
- **Où l'utiliser** : `netlify/functions/statbot-fetch.ts`
- **Note** : Nécessaire pour le bouton "Récupérer les données Statbot" dans le dashboard

## 🔧 Configuration complète recommandée

Ajoutez ces variables dans Netlify → Site settings → Environment variables :

```
DISCORD_CLIENT_ID=VOTRE_DISCORD_CLIENT_ID_ICI
DISCORD_CLIENT_SECRET=VOTRE_DISCORD_CLIENT_SECRET_ICI
DISCORD_REDIRECT_URI=https://tenf-community.com/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://tenf-community.com
NEXTAUTH_SECRET=VOTRE_NEXTAUTH_SECRET_ICI
NEXTAUTH_URL=https://tenf-community.com
TWITCH_CLIENT_ID=VOTRE_TWITCH_CLIENT_ID_ICI
TWITCH_CLIENT_SECRET=VOTRE_TWITCH_CLIENT_SECRET_ICI
DISCORD_BOT_TOKEN=VOTRE_DISCORD_BOT_TOKEN_ICI
STATBOT_API_KEY=VOTRE_STATBOT_API_KEY_ICI
STATBOT_SERVER_ID=VOTRE_STATBOT_SERVER_ID_ICI
```

## ✅ Vérification Discord Developer Portal

Assurez-vous que dans Discord Developer Portal → OAuth2 → Redirects, vous avez ajouté :

```
https://tenf-community.com/api/auth/discord/callback
```

**Important** : L'URL doit être exactement identique (même protocole https, même domaine, même chemin).

## 🔍 Vérification après ajout

Après avoir ajouté les variables manquantes :

1. Redéployez votre site sur Netlify
2. Testez la connexion Discord
3. Vérifiez les logs Netlify pour voir si les variables sont bien chargées

