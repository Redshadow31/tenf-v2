# 📋 Variables d'environnement Netlify - TENF V2

## ✅ Variables déjà configurées sur Netlify

D'après votre configuration actuelle, vous avez :

1. ✅ **DISCORD_CLIENT_ID** - ID de l'application Discord OAuth2
2. ✅ **DISCORD_CLIENT_SECRET** - Secret de l'application Discord OAuth2
3. ✅ **DISCORD_REDIRECT_URI** - `https://teamnewfamily.netlify.app/api/auth/discord/callback`
4. ✅ **NEXT_PUBLIC_BASE_URL** - URL de base de votre site Netlify
5. ✅ **TWITCH_CLIENT_ID** - ID de l'application Twitch
6. ✅ **TWITCH_CLIENT_SECRET** - Secret de l'application Twitch

## ⚠️ Variables manquantes à ajouter

### 1. **NEXTAUTH_SECRET** (OBLIGATOIRE)
- **Description** : Secret utilisé pour signer les tokens NextAuth
- **Valeur recommandée** : Une chaîne aléatoire sécurisée (minimum 32 caractères)
- **Exemple** : `tenfSuperSecretKey2025` (à changer pour une valeur plus sécurisée)
- **Où l'utiliser** : `lib/auth.ts` ligne 17

### 2. **NEXTAUTH_URL** (OBLIGATOIRE)
- **Description** : URL de base de votre application pour NextAuth
- **Valeur** : `https://teamnewfamily.netlify.app`
- **Où l'utiliser** : Configuration NextAuth

### 3. **DISCORD_BOT_TOKEN** (Optionnel mais recommandé)
- **Description** : Token du bot Discord pour récupérer les membres VIP
- **Où l'utiliser** : `app/api/vip-members/route.ts`
- **Note** : Nécessaire uniquement si vous voulez récupérer les membres VIP depuis Discord

## 🔧 Configuration complète recommandée

Ajoutez ces variables dans Netlify → Site settings → Environment variables :

```
DISCORD_CLIENT_ID=1447980264641794108
DISCORD_CLIENT_SECRET=DslmRsTQKGNXJM-DUa97V-VKqDVBINzl
DISCORD_REDIRECT_URI=https://teamnewfamily.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://teamnewfamily.netlify.app
NEXTAUTH_SECRET=tenfSuperSecretKey2025
NEXTAUTH_URL=https://teamnewfamily.netlify.app
TWITCH_CLIENT_ID=rr75kdousbzbp8qfjy0xtppwpljuke
TWITCH_CLIENT_SECRET=bn48h38zjqid0dsydemqymg13587nq
DISCORD_BOT_TOKEN=votre_bot_token_ici (optionnel)
```

## ✅ Vérification Discord Developer Portal

Assurez-vous que dans Discord Developer Portal → OAuth2 → Redirects, vous avez ajouté :

```
https://teamnewfamily.netlify.app/api/auth/discord/callback
```

**Important** : L'URL doit être exactement identique (même protocole https, même domaine, même chemin).

## 🔍 Vérification après ajout

Après avoir ajouté les variables manquantes :

1. Redéployez votre site sur Netlify
2. Testez la connexion Discord
3. Vérifiez les logs Netlify pour voir si les variables sont bien chargées

