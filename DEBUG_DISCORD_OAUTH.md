# 🔍 Guide de débogage - Connexion Discord OAuth

## ❌ Erreur : "Échec de l'échange de token"

Cette erreur se produit lorsque le `redirect_uri` utilisé ne correspond pas exactement à celui configuré dans Discord Developer Portal.

## ✅ Checklist de vérification

### 1. Vérifier les variables d'environnement Netlify

Assurez-vous que ces variables sont bien configurées :

```
DISCORD_CLIENT_ID=1447980264641794108
DISCORD_CLIENT_SECRET=DslmRsTQKGNXJM-DUa97V-VKqDVBINzl
DISCORD_REDIRECT_URI=https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://papaya-lebkuchen-9e7d00.netlify.app
```

**⚠️ IMPORTANT** : 
- Pas d'espace avant/après le `=`
- Pas de guillemets autour de la valeur
- URL complète avec `https://`

### 2. Vérifier Discord Developer Portal

1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application (Client ID: 1447980264641794108)
3. Allez dans **OAuth2** → **General**
4. Dans la section **Redirects**, vérifiez que vous avez EXACTEMENT :

```
https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback
```

**⚠️ Points critiques** :
- ✅ Commence par `https://` (pas `http://`)
- ✅ Pas de slash `/` à la fin
- ✅ Chemin exact : `/api/auth/discord/callback`
- ✅ Domaine exact : `papaya-lebkuchen-9e7d00.netlify.app`

### 3. Vérifier les logs Netlify

1. Allez sur votre dashboard Netlify
2. Ouvrez votre site
3. Allez dans **Functions** → **Logs**
4. Cherchez les logs qui commencent par :
   - `Login - Redirect URI:`
   - `Callback - Redirect URI:`
   - `Discord token error:`

Ces logs vous diront exactement quel `redirect_uri` est utilisé.

### 4. Erreurs Discord courantes

#### Erreur : "invalid_grant" ou "Invalid redirect_uri"
**Cause** : Le `redirect_uri` ne correspond pas exactement
**Solution** : Vérifiez que l'URL dans Discord Developer Portal est identique à celle dans Netlify

#### Erreur : "invalid_client"
**Cause** : Client ID ou Client Secret incorrect
**Solution** : Vérifiez les variables `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` dans Netlify

#### Erreur : "redirect_uri_mismatch"
**Cause** : Le redirect_uri utilisé ne correspond pas à celui enregistré
**Solution** : 
1. Vérifiez l'URL exacte dans Discord Developer Portal
2. Vérifiez la variable `DISCORD_REDIRECT_URI` dans Netlify
3. Assurez-vous qu'elles sont identiques caractère par caractère

## 🔧 Solution rapide

1. **Dans Discord Developer Portal** :
   - Supprimez tous les redirects existants
   - Ajoutez uniquement : `https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback`
   - Cliquez sur **Save Changes**

2. **Dans Netlify** :
   - Vérifiez que `DISCORD_REDIRECT_URI` = `https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback`
   - Redéployez le site

3. **Testez à nouveau** :
   - Essayez de vous connecter
   - Vérifiez les logs Netlify pour voir l'erreur exacte

## 📝 Note importante

Le `redirect_uri` doit être **EXACTEMENT** le même dans :
- Discord Developer Portal (OAuth2 → Redirects)
- Variable d'environnement Netlify (`DISCORD_REDIRECT_URI`)
- Le code (qui utilise cette variable)

Même une petite différence (http vs https, slash final, etc.) causera cette erreur.

