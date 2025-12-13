# 🔧 Configuration Statbot - TENF V2

## ⚠️ Erreur actuelle

Si vous voyez l'erreur :
```
Erreur: Erreur lors de l'appel de la fonction: 500
{"error":"STATBOT_API_KEY et STATBOT_SERVER_ID doivent être configurés"}
```

Cela signifie que les variables d'environnement Statbot ne sont pas configurées sur Netlify.

## ✅ Solution : Ajouter les variables d'environnement

### Étape 1 : Accéder aux paramètres Netlify

1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Sélectionnez votre site **teamnewfamily**
3. Allez dans **Site settings** → **Environment variables**

### Étape 2 : Ajouter les variables

Ajoutez ces deux variables d'environnement :

| Variable | Valeur |
|----------|--------|
| `STATBOT_API_KEY` | `NTM1MjQ0ODU3ODkxODgwOTcw.e8Z98EEvaTs3UcWIvx66SgHBvzQ6H71koh9ui396uAA` |
| `STATBOT_SERVER_ID` | `535244857891880970` |

### Étape 3 : Redéployer

Après avoir ajouté les variables :

1. **Option 1 : Redéploiement automatique**
   - Netlify redéploiera automatiquement lors du prochain push sur GitHub
   - Ou déclenchez un redéploiement manuel : **Deploys** → **Trigger deploy** → **Deploy site**

2. **Option 2 : Redéploiement manuel**
   - Allez dans **Deploys**
   - Cliquez sur **Trigger deploy** → **Deploy site**

### Étape 4 : Vérifier

1. Allez sur `https://teamnewfamily.netlify.app/admin/dashboard`
2. Cliquez sur le bouton **"Récupérer les données Statbot"**
3. L'erreur devrait disparaître et les données devraient être récupérées

## 📋 Variables complètes à configurer

Pour référence, voici toutes les variables d'environnement nécessaires :

```
DISCORD_CLIENT_ID=1447980264641794108
DISCORD_CLIENT_SECRET=DslmRsTQKGNXJM-DUa97V-VKqDVBINzl
DISCORD_REDIRECT_URI=https://teamnewfamily.netlify.app/api/auth/discord/callback
NEXT_PUBLIC_BASE_URL=https://teamnewfamily.netlify.app
NEXTAUTH_SECRET=tenfSuperSecretKey2025
NEXTAUTH_URL=https://teamnewfamily.netlify.app
TWITCH_CLIENT_ID=rr75kdousbzbp8qfjy0xtppwpljuke
TWITCH_CLIENT_SECRET=bn48h38zjqid0dsydemqymg13587nq
STATBOT_API_KEY=NTM1MjQ0ODU3ODkxODgwOTcw.e8Z98EEvaTs3UcWIvx66SgHBvzQ6H71koh9ui396uAA
STATBOT_SERVER_ID=535244857891880970
```

## 🔍 Vérification dans les logs

Après le redéploiement, vous pouvez vérifier dans les logs Netlify :

1. Allez dans **Functions** → **statbot-fetch**
2. Vérifiez les logs pour voir si les variables sont bien chargées
3. Les logs devraient afficher : `[Statbot Fetch] Début de la récupération des données...`

## ⚠️ Important

- Les variables d'environnement sont **sensibles** et ne doivent **jamais** être commitées dans Git
- Elles doivent être configurées uniquement dans Netlify
- Après chaque modification, un redéploiement est nécessaire

