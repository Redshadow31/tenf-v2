# 🔄 Mise à jour Netlify - Client Secret Discord

## ✅ Informations confirmées

- **Client ID** : `1447980264641794108` ✅ (correct)
- **Client Secret** : `ZzcRup7Ayz-HLu04XZE46P8n76YvNYTe` ✅ (nouveau)

## 🔧 Action requise sur Netlify

### Mettre à jour la variable DISCORD_CLIENT_SECRET

1. Allez sur votre dashboard Netlify
2. Sélectionnez votre site
3. Allez dans **Site settings** → **Environment variables**
4. Trouvez la variable **DISCORD_CLIENT_SECRET**
5. Cliquez dessus pour l'éditer
6. Remplacez l'ancienne valeur par : `ZzcRup7Ayz-HLu04XZE46P8n76YvNYTe`
7. Cliquez sur **"Save variable"**

## ✅ Vérification complète des variables Netlify

Assurez-vous que toutes ces variables sont configurées :

```
DISCORD_CLIENT_ID=1447980264641794108
DISCORD_CLIENT_SECRET=ZzcRup7Ayz-HLu04XZE46P8n76YvNYTe
DISCORD_REDIRECT_URI=https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://papaya-lebkuchen-9e7d00.netlify.app
NEXTAUTH_SECRET=tenfSuperSecretKey2025
NEXTAUTH_URL=https://papaya-lebkuchen-9e7d00.netlify.app
TWITCH_CLIENT_ID=rr75kdousbzbp8qfjy0xtppwpljuke
TWITCH_CLIENT_SECRET=bn48h38zjqid0dsydemqymg13587nq
```

## ✅ Vérification Discord Developer Portal

Dans Discord Developer Portal → TENFSITE → OAuth2 → General :

1. **Client ID** : Doit être `1447980264641794108` ✅
2. **Client Secret** : Vient d'être réinitialisé ✅
3. **Redirects** : Doit contenir exactement :
   ```
   https://papaya-lebkuchen-9e7d00.netlify.app/api/auth/discord/callback
   ```

## 🚀 Après la mise à jour

1. **Redéployez le site** sur Netlify (ou attendez le prochain déploiement automatique)
2. **Testez la connexion Discord** sur votre site
3. **Vérifiez les logs Netlify** si l'erreur persiste

## 📝 Note importante

Le fichier `.env.local` a été mis à jour localement avec le nouveau Client Secret. 
N'oubliez pas de mettre à jour aussi dans Netlify pour que ça fonctionne en production !

