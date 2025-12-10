# 🔄 Mise à jour du domaine Netlify - teamnewfamily.netlify.app

## ✅ Modifications effectuées dans le code

Toutes les références à l'ancien domaine `papaya-lebkuchen-9e7d00.netlify.app` ont été remplacées par `teamnewfamily.netlify.app` dans :
- ✅ `app/auth/login/page.tsx`
- ✅ `MISE_A_JOUR_NETLIFY.md`
- ✅ `VARIABLES_ENV_NETLIFY.md`
- ✅ `DEBUG_DISCORD_OAUTH.md`
- ✅ `VERIFICATION_DISCORD_APP.md`

## 🔧 Actions requises sur Netlify

### 1. Mettre à jour les variables d'environnement

Allez dans **Netlify Dashboard** → **Votre site** → **Site settings** → **Environment variables** et mettez à jour :

```
DISCORD_REDIRECT_URI=https://teamnewfamily.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://teamnewfamily.netlify.app
NEXTAUTH_URL=https://teamnewfamily.netlify.app
```

**⚠️ IMPORTANT** : 
- Vérifiez que ces 3 variables sont bien mises à jour
- Pas d'espace avant/après le `=`
- Pas de guillemets autour de la valeur
- URL complète avec `https://`

### 2. Redéployer le site

Après avoir mis à jour les variables :
1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** → **Deploy site**
3. Attendez que le déploiement soit terminé

## 🔧 Actions requises sur Discord Developer Portal

### 1. Mettre à jour les Redirects OAuth2

1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application **TENFSITE**
3. Allez dans **OAuth2** → **General**
4. Dans la section **Redirects** :
   - **Supprimez** l'ancien redirect : `https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback`
   - **Ajoutez** le nouveau redirect : `https://teamnewfamily.netlify.app/api/auth/discord/callback`
   - Cliquez sur **Save Changes**

**⚠️ Points critiques** :
- ✅ Commence par `https://` (pas `http://`)
- ✅ Pas de slash `/` à la fin
- ✅ Chemin exact : `/api/auth/discord/callback`
- ✅ Domaine exact : `teamnewfamily.netlify.app`

### 2. Vérifier le Client ID et Secret

Assurez-vous que les valeurs dans Discord Developer Portal correspondent à celles dans Netlify :
- **Client ID** : `1447980264641794108`
- **Client Secret** : Vérifiez qu'il correspond à `DISCORD_CLIENT_SECRET` dans Netlify

## ✅ Checklist de vérification

Avant de tester, vérifiez que :

- [ ] Les 3 variables d'environnement sont mises à jour dans Netlify
- [ ] Le redirect_uri est mis à jour dans Discord Developer Portal
- [ ] Le site a été redéployé sur Netlify
- [ ] Les URLs sont identiques dans Netlify et Discord (caractère par caractère)

## 🧪 Test après mise à jour

1. Allez sur https://teamnewfamily.netlify.app
2. Essayez de vous connecter avec Discord
3. Si ça ne fonctionne pas, vérifiez les logs Netlify dans **Functions** → **Logs**

## 📝 Note importante

Le `redirect_uri` doit être **EXACTEMENT** le même dans :
- Discord Developer Portal (OAuth2 → Redirects)
- Variable d'environnement Netlify (`DISCORD_REDIRECT_URI`)
- Le code (qui utilise cette variable)

Même une petite différence (http vs https, slash final, etc.) causera une erreur d'authentification.

