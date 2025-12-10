# 🔧 Résolution de l'erreur "État invalide"

## ❌ Problème

L'erreur "État invalide - veuillez réessayer" apparaît lors de la connexion Discord.

## 🔍 Causes possibles

1. **Variables d'environnement non mises à jour dans Netlify**
2. **Cookies de l'ancien domaine qui interfèrent**
3. **Redirect URI qui ne correspond pas entre Discord et Netlify**

## ✅ Solutions

### 1. Vérifier et mettre à jour les variables Netlify

Allez dans **Netlify Dashboard** → **Votre site** → **Site settings** → **Environment variables** et vérifiez que ces 3 variables sont **EXACTEMENT** :

```
DISCORD_REDIRECT_URI=https://teamnewfamily.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://teamnewfamily.netlify.app
NEXTAUTH_URL=https://teamnewfamily.netlify.app
```

**⚠️ IMPORTANT** :
- Pas d'espace avant/après le `=`
- Pas de guillemets autour de la valeur
- URL complète avec `https://`
- Pas de slash `/` à la fin

### 2. Vérifier Discord Developer Portal

1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application **TENFSITE**
3. Allez dans **OAuth2** → **General**
4. Dans **Redirects**, vous devez avoir **EXACTEMENT** :
   ```
   https://teamnewfamily.netlify.app/api/auth/discord/callback
   ```
5. Si l'ancien redirect est encore là, **supprimez-le**
6. Cliquez sur **Save Changes**

### 3. Nettoyer les cookies du navigateur

L'erreur peut venir de cookies de l'ancien domaine :

1. Ouvrez les outils de développement (F12)
2. Allez dans **Application** (Chrome) ou **Stockage** (Firefox)
3. Dans **Cookies**, supprimez tous les cookies pour :
   - `teamnewfamily.netlify.app`
   - `papaya-lebkuchen-9e7d00.netlify.app` (ancien domaine)
4. Fermez et rouvrez le navigateur
5. Réessayez la connexion

### 4. Redéployer le site sur Netlify

Après avoir mis à jour les variables :

1. Allez dans **Deploys**
2. Cliquez sur **Trigger deploy** → **Deploy site**
3. Attendez que le déploiement soit terminé
4. Testez à nouveau la connexion

### 5. Vérifier les logs Netlify

Si l'erreur persiste, vérifiez les logs :

1. Allez dans **Functions** → **Logs**
2. Cherchez les lignes qui commencent par :
   - `Login - Redirect URI:`
   - `Login - State stored:`
   - `Callback - State from URL:`
   - `Callback - State from cookie:`
   - `Callback - State match:`

Ces logs vous diront exactement ce qui se passe.

## 🔍 Vérification finale

Avant de tester, assurez-vous que :

- [ ] Les 3 variables sont mises à jour dans Netlify
- [ ] Le redirect est mis à jour dans Discord Developer Portal
- [ ] L'ancien redirect est supprimé de Discord
- [ ] Les cookies du navigateur sont nettoyés
- [ ] Le site a été redéployé sur Netlify
- [ ] Les URLs sont identiques dans Netlify et Discord (caractère par caractère)

## 📝 Note importante

Le `redirect_uri` doit être **EXACTEMENT** le même dans :
- Discord Developer Portal (OAuth2 → Redirects)
- Variable d'environnement Netlify (`DISCORD_REDIRECT_URI`)
- Le code (qui utilise cette variable)

Même une petite différence causera l'erreur "État invalide".

## 🆘 Si l'erreur persiste

1. Vérifiez les logs Netlify pour voir les valeurs exactes utilisées
2. Comparez caractère par caractère les URLs dans Discord et Netlify
3. Assurez-vous que le site est bien déployé avec les nouvelles variables
4. Essayez en navigation privée pour éviter les problèmes de cache

