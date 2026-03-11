# 🤖 Configuration du Bot Discord pour le Suivi des Raids TENF

## 📋 Vue d'ensemble

Le système de suivi des raids TENF fonctionne avec deux méthodes :

1. **Scan périodique** : L'API `/api/discord/raids/scan` scanne les messages et leurs réactions périodiquement
2. **Bot Discord en temps réel** : Un bot Discord externe surveille les réactions et appelle l'API `/api/discord/raids/reaction`

## 🔧 Configuration du Bot Discord (Option 2 - Temps réel)

### Étape 1 : Créer un bot Discord avec les permissions nécessaires

1. Allez sur https://discord.com/developers/applications
2. Sélectionnez votre application **TENFSITE**
3. Allez dans **Bot** → **Add Bot** (si pas déjà fait)
4. Activez les **Privileged Gateway Intents** :
   - ✅ **MESSAGE CONTENT INTENT** (OBLIGATOIRE pour lire les messages)
   - ✅ **SERVER MEMBERS INTENT** (pour identifier les membres)

### Étape 2 : Créer le script du bot

Créez un fichier `bot/discord-raids-bot.js` :

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const COORDINATION_RAID_CHANNEL_ID = "1278840270753894535";
const API_BASE_URL = process.env.API_BASE_URL || "https://tenf-community.com";

client.once('ready', () => {
  console.log(`Bot connecté en tant que ${client.user.tag}!`);
  console.log(`Surveillance du salon ${COORDINATION_RAID_CHANNEL_ID}`);
});

// Écouter les nouveaux messages dans le salon coordination-raid
client.on('messageCreate', async (message) => {
  if (message.channel.id !== COORDINATION_RAID_CHANNEL_ID) return;
  if (message.author.bot) return;

  // Pattern pour détecter "@user1 a raid @user2"
  const raidPattern = /<@(\d+)>\s+a\s+raid\s+<@(\d+)>/i;
  const match = message.content.match(raidPattern);

  if (match) {
    console.log(`[Raid détecté] Message ${message.id}: ${message.content}`);
    
    // Ajouter les réactions automatiquement pour validation
    try {
      await message.react('✅');
      await message.react('❌');
    } catch (error) {
      console.error("Erreur lors de l'ajout des réactions:", error);
    }
  }
});

// Écouter les réactions sur les messages
client.on('messageReactionAdd', async (reaction, user) => {
  // Ignorer les réactions du bot lui-même
  if (user.bot) return;
  
  // Récupérer le message complet avec les réactions
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Erreur lors de la récupération de la réaction:", error);
      return;
    }
  }

  const message = reaction.message;
  
  // Vérifier que c'est le bon salon
  if (message.channel.id !== COORDINATION_RAID_CHANNEL_ID) return;

  // Vérifier que c'est une réaction ✅ ou ❌
  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  console.log(`[Réaction détectée] ${emoji} sur message ${message.id} par ${user.tag}`);

  // Appeler l'API pour traiter la réaction
  try {
    const response = await fetch(`${API_BASE_URL}/api/discord/raids/reaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messageId: message.id,
        userId: user.id,
        emoji: emoji,
        channelId: message.channel.id,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[Raid traité] ${data.action}:`, data);
    } else {
      const error = await response.json();
      console.error(`[Erreur API] ${error.error}`);
    }
  } catch (error) {
    console.error("Erreur lors de l'appel API:", error);
  }
});

// Gérer les réactions retirées (pour annuler une validation)
client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      return;
    }
  }

  const message = reaction.message;
  if (message.channel.id !== COORDINATION_RAID_CHANNEL_ID) return;

  const emoji = reaction.emoji.name;
  if (emoji !== '✅' && emoji !== '❌') return;

  // Si ✅ est retiré, annuler la validation
  if (emoji === '✅') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/discord/raids/reaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId: message.id,
          userId: user.id,
          emoji: '❌', // Traiter comme un rejet
          channelId: message.channel.id,
        }),
      });
      console.log(`[Réaction retirée] Validation annulée pour message ${message.id}`);
    } catch (error) {
      console.error("Erreur lors de l'annulation:", error);
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
```

### Étape 3 : Installer les dépendances

```bash
npm install discord.js dotenv
```

### Étape 4 : Configurer les variables d'environnement

Créez un fichier `.env` :

```
DISCORD_BOT_TOKEN=votre_token_bot_discord
API_BASE_URL=https://tenf-community.com
```

### Étape 5 : Lancer le bot

```bash
node bot/discord-raids-bot.js
```

## 🔄 Option 1 : Scan Périodique (Sans Bot Externe)

Si vous ne voulez pas créer un bot Discord externe, vous pouvez utiliser le scan périodique :

### Configuration Netlify Scheduled Functions

Créez un fichier `netlify/functions/scan-raids.js` :

```javascript
exports.handler = async (event, context) => {
  const response = await fetch('https://tenf-community.com/api/discord/raids/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  
  return {
    statusCode: 200,
    body: JSON.stringify(data),
  };
};
```

Puis configurez dans `netlify.toml` :

```toml
[build]
  functions = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-scheduled-functions"

[[schedules]]
  cron = "*/5 * * * *"  # Toutes les 5 minutes
  function = "scan-raids"
```

## 📊 Format de Stockage

Les raids sont stockés dans Netlify Blobs :

- **Store** : `tenf-raids`
- **Clé mensuelle** : `raids-YYYY-MM` (ex: `raids-2024-12`)

Format JSON :

```json
{
  "discordUserId1": {
    "done": 5,
    "received": 3,
    "targets": {
      "discordUserId2": 2,
      "discordUserId3": 3
    }
  },
  "discordUserId2": {
    "done": 2,
    "received": 5,
    "targets": {
      "discordUserId1": 2
    }
  }
}
```

## ✅ Validation des Raids

1. Un message `@user1 a raid @user2` est détecté
2. Le raid est ajouté en **attente** (`pending-raids`)
3. Quand quelqu'un réagit avec **✅** : le raid est **validé** et comptabilisé
4. Quand quelqu'un réagit avec **❌** : le raid est **rejeté** et retiré

## 🚨 Alertes Automatiques

Le système détecte automatiquement si un membre raid plus de 3 fois la même personne dans le mois et affiche une alerte ⚠️ dans le dashboard.

## 📝 Notes Importantes

- Les raids sont stockés par **Discord ID** pour éviter les problèmes de changement de pseudo
- La conversion Discord ID → Twitch Login se fait automatiquement lors de l'affichage
- Le changement de mois crée automatiquement un nouveau fichier `raids-YYYY-MM`
- Les raids en attente sont stockés dans `pending-raids` jusqu'à validation

