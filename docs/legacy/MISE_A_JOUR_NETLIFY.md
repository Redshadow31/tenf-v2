# 🔄 Mise à jour Netlify - Client Secret Discord

## ✅ Informations confirmées

- **Client ID** : `VOTRE_DISCORD_CLIENT_ID_ICI` ✅ (correct)
- **Client Secret** : `VOTRE_DISCORD_CLIENT_SECRET_ICI` ✅ (nouveau)

## 🔧 Action requise sur Netlify

### Mettre à jour la variable DISCORD_CLIENT_SECRET

1. Allez sur votre dashboard Netlify
2. Sélectionnez votre site
3. Allez dans **Site settings** → **Environment variables**
4. Trouvez la variable **DISCORD_CLIENT_SECRET**
5. Cliquez dessus pour l'éditer
6. Remplacez l'ancienne valeur par votre nouveau secret Discord (récupéré depuis Discord Developer Portal)
7. Cliquez sur **"Save variable"**

## ✅ Vérification complète des variables Netlify

Assurez-vous que toutes ces variables sont configurées :

```
DISCORD_CLIENT_ID=VOTRE_DISCORD_CLIENT_ID_ICI
DISCORD_CLIENT_SECRET=VOTRE_DISCORD_CLIENT_SECRET_ICI
DISCORD_REDIRECT_URI=https://tenf-community.com/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://tenf-community.com
NEXTAUTH_SECRET=VOTRE_NEXTAUTH_SECRET_ICI
NEXTAUTH_URL=https://tenf-community.com
TWITCH_CLIENT_ID=VOTRE_TWITCH_CLIENT_ID_ICI
TWITCH_CLIENT_SECRET=VOTRE_TWITCH_CLIENT_SECRET_ICI
```

## ✅ Vérification Discord Developer Portal

Dans Discord Developer Portal → TENFSITE → OAuth2 → General :

1. **Client ID** : Doit correspondre à votre Discord Client ID ✅
2. **Client Secret** : Vient d'être réinitialisé ✅
3. **Redirects** : Doit contenir exactement :
   ```
   https://tenf-community.com/api/auth/discord/callback
   ```

## 🚀 Après la mise à jour

1. **Redéployez le site** sur Netlify (ou attendez le prochain déploiement automatique)
2. **Testez la connexion Discord** sur votre site
3. **Vérifiez les logs Netlify** si l'erreur persiste

## 📝 Note importante

Le fichier `.env.local` a été mis à jour localement avec le nouveau Client Secret. 
N'oubliez pas de mettre à jour aussi dans Netlify pour que ça fonctionne en production !

