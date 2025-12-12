# 🤖 Bot Discord Apparaît Hors Ligne - Explication

## ⚠️ Pourquoi le bot apparaît "hors ligne" sur Discord ?

**C'est NORMAL et ce n'est PAS un problème !**

Votre application utilise le bot Discord uniquement via l'**API REST de Discord** (requêtes HTTP). Cela signifie que :

- ✅ Le bot **fonctionne parfaitement** pour récupérer les données
- ❌ Le bot **n'apparaît pas "en ligne"** dans Discord car il n'y a pas de connexion WebSocket active

### Comment ça fonctionne actuellement ?

Le code fait des **appels API REST** à Discord quand nécessaire :

```typescript
// Exemple : Récupération des membres VIP
const response = await fetch(
  `https://discord.com/api/v10/guilds/${GUILD_ID}/members`,
  {
    headers: {
      Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
    },
  }
);
```

Ces appels fonctionnent **même si le bot apparaît hors ligne** dans Discord.

---

## ✅ Vérification : Le bot fonctionne-t-il vraiment ?

Pour vérifier que le bot fonctionne correctement, testez ces points :

### 1. Vérifier que le bot est sur le serveur Discord

1. Ouvrez votre serveur Discord (ID: `535244857891880970`)
2. Allez dans **Paramètres du serveur** → **Membres**
3. Cherchez votre bot (nom: TENFSITE ou le nom que vous lui avez donné)
4. Le bot doit apparaître dans la liste des membres (même s'il est hors ligne)

### 2. Vérifier les permissions du bot

Le bot doit avoir ces permissions :
- ✅ **View Channels** (Voir les salons)
- ✅ **Read Message History** (Lire l'historique des messages)
- ✅ **View Server Members** (OBLIGATOIRE - Voir les membres du serveur)

### 3. Tester l'API du bot

1. Allez sur votre site : `/vip`
2. Si la page affiche les membres VIP → **Le bot fonctionne ! ✅**
3. Si la page est vide ou affiche une erreur → Voir la section "Dépannage" ci-dessous

---

## 🔧 Si vous voulez que le bot apparaisse "en ligne"

Si vous voulez vraiment que le bot apparaisse "en ligne" dans Discord, vous devez créer un **processus qui maintient une connexion WebSocket active** avec Discord.

### Option 1 : Créer un service séparé (recommandé)

Créez un fichier `bot/discord-bot.js` qui se connecte à Discord :

```javascript
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log('Bot Discord connecté et en ligne !');
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

Puis exécutez ce script en continu (sur un serveur, VPS, ou service comme Railway, Render, etc.).

### Option 2 : Utiliser un service serverless (plus complexe)

Vous pouvez utiliser des fonctions serverless qui maintiennent une connexion, mais c'est plus complexe et coûteux.

---

## 🆘 Dépannage : Le bot ne fonctionne pas

### Problème : La page `/vip` est vide ou affiche une erreur

**Vérifications à faire :**

1. **Le bot est-il sur le serveur ?**
   - Allez dans Discord → Serveur → Paramètres → Membres
   - Cherchez votre bot dans la liste

2. **Le token du bot est-il correct ?**
   - Vérifiez la variable `DISCORD_BOT_TOKEN` dans Netlify
   - Allez sur Discord Developer Portal → TENFSITE → Bot → Token
   - Copiez le token et mettez-le dans Netlify

3. **Le bot a-t-il les permissions ?**
   - Le bot doit avoir "View Server Members" (OBLIGATOIRE)
   - Vérifiez dans Discord → Serveur → Paramètres → Rôles → [Nom du bot]

4. **Le rôle "VIP Elite" existe-t-il ?**
   - Le code cherche un rôle contenant "VIP" et "Elite"
   - Vérifiez que ce rôle existe sur votre serveur

### Problème : Erreur "Discord bot token not configured"

→ Ajoutez `DISCORD_BOT_TOKEN` dans les variables d'environnement Netlify

### Problème : Erreur "Failed to fetch Discord members"

→ Vérifiez que :
- Le bot est bien sur le serveur Discord
- Le token est correct
- Le bot a les permissions nécessaires

---

## 📝 Résumé

- ✅ **Le bot fonctionne même s'il apparaît hors ligne** (utilisation API REST)
- ✅ **Pas besoin de connexion WebSocket** pour les fonctionnalités actuelles
- ✅ **Le statut "hors ligne" n'est pas un problème** pour votre usage
- ⚠️ **Si vous voulez qu'il soit "en ligne"**, vous devez créer un processus séparé qui maintient une connexion WebSocket

---

## ✅ Checklist de vérification

- [ ] Le bot est ajouté au serveur Discord (ID: 535244857891880970)
- [ ] Le bot a les permissions : View Channels, Read Message History, **View Server Members**
- [ ] La variable `DISCORD_BOT_TOKEN` est configurée dans Netlify
- [ ] Le token du bot est correct (vérifié dans Discord Developer Portal)
- [ ] Le rôle "VIP Elite" existe sur le serveur Discord
- [ ] La page `/vip` fonctionne et affiche les membres VIP

Si tous ces points sont vérifiés, **votre bot fonctionne correctement**, même s'il apparaît hors ligne ! 🎉


