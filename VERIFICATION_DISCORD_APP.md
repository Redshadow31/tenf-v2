# 🔍 Vérification Application Discord TENFSITE

## ⚠️ Point important

Dans Discord Developer Portal, **une seule application** (TENFSITE) contient **deux éléments différents** :

### 1. 🤖 Le Bot Discord (TENFSITE)
- **Utilisé pour** : Récupérer les membres VIP depuis le serveur
- **Variable d'environnement** : `DISCORD_BOT_TOKEN`
- **Où le trouver** : Discord Developer Portal → TENFSITE → Bot → Token
- **Utilisé dans** : `app/api/vip-members/route.ts`

### 2. 🔐 L'OAuth2 (Authentification)
- **Utilisé pour** : Connecter les utilisateurs avec leur compte Discord
- **Variables d'environnement** : `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET`
- **Où les trouver** : Discord Developer Portal → TENFSITE → OAuth2 → General
- **Utilisé dans** : `app/api/auth/discord/login/route.ts` et `app/api/auth/discord/callback/route.ts`

## ✅ Vérification à faire MAINTENANT

### Étape 1 : Vérifier que vous êtes sur la bonne application

1. Allez sur https://discord.com/developers/applications
2. **Sélectionnez l'application "TENFSITE"** (pas une autre application)
3. Vérifiez que vous voyez bien le nom "TENFSITE" en haut

### Étape 2 : Vérifier le Client ID OAuth2

1. Dans l'application **TENFSITE**, allez dans **OAuth2** → **General**
2. **Copiez le Client ID** affiché
3. **Comparez-le** avec celui dans Netlify (`DISCORD_CLIENT_ID`)
4. Ils doivent être **IDENTIQUES**

### Étape 3 : Vérifier le Client Secret OAuth2

1. Toujours dans **OAuth2** → **General**
2. Si vous ne voyez pas le secret, cliquez sur **"Reset Secret"**
3. **Copiez le nouveau secret**
4. **Mettez à jour** la variable `DISCORD_CLIENT_SECRET` dans Netlify avec ce nouveau secret

### Étape 4 : Vérifier les Redirects OAuth2

1. Toujours dans **OAuth2** → **General**
2. Dans la section **"Redirects"**, vérifiez que vous avez EXACTEMENT :
   ```
   https://tenf-community.com/api/auth/discord/callback
   ```
3. Si ce n'est pas là, **ajoutez-le** et **sauvegardez**

## 🔧 Si le Client ID ne correspond pas

Si le Client ID dans Netlify (`1447980264641794108`) ne correspond PAS à l'application TENFSITE :

1. **Option A** : Utiliser les identifiants de TENFSITE
   - Copiez le Client ID de TENFSITE
   - Copiez le Client Secret de TENFSITE
   - Mettez à jour les variables dans Netlify

2. **Option B** : Vérifier si vous avez plusieurs applications
   - Peut-être avez-vous créé plusieurs applications Discord ?
   - Vérifiez toutes vos applications dans le Developer Portal
   - Utilisez celle qui correspond au Client ID `1447980264641794108`

## 📝 Checklist de vérification

- [ ] Je suis sur l'application "TENFSITE" dans Discord Developer Portal
- [ ] Le Client ID dans Netlify correspond au Client ID de TENFSITE
- [ ] Le Client Secret dans Netlify correspond au Client Secret de TENFSITE
- [ ] Le redirect_uri est bien configuré dans Discord : `https://tenf-community.com/api/auth/discord/callback`
- [ ] J'ai redéployé le site sur Netlify après avoir mis à jour les variables

## 🎯 Action immédiate

**Vérifiez maintenant** dans Discord Developer Portal → TENFSITE → OAuth2 → General :
- Quel est le **Client ID** affiché ?
- Est-ce que c'est `1447980264641794108` ou un autre numéro ?

Si c'est un autre numéro, c'est probablement la cause du problème !

