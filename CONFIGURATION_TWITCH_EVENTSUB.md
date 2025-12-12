# Configuration Twitch EventSub pour le suivi des raids

Ce document explique comment configurer Twitch EventSub pour recevoir les événements de raids en direct.

## Variables d'environnement requises

Ajoutez ces variables dans Netlify :

- `TWITCH_EVENTSUB_SECRET` : Secret pour vérifier les signatures des webhooks (généré lors de la création de la subscription)
- `TWITCH_CLIENT_ID` : Client ID de votre application Twitch
- `TWITCH_CLIENT_SECRET` : Client Secret de votre application Twitch
- `TWITCH_TARGET_BROADCASTER_ID` : (Optionnel) ID du broadcaster principal TENF si vous voulez filtrer

## Création de la subscription EventSub

### 1. Créer une application Twitch

1. Allez sur https://dev.twitch.tv/console/apps
2. Créez une nouvelle application
3. Notez le `Client ID` et `Client Secret`

### 2. Créer la subscription EventSub

Utilisez l'API Twitch pour créer une subscription :

```bash
curl -X POST 'https://api.twitch.tv/helix/eventsub/subscriptions' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Client-Id: YOUR_CLIENT_ID' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "channel.raid",
    "version": "1",
    "condition": {
      "to_broadcaster_user_id": "YOUR_BROADCASTER_ID"
    },
    "transport": {
      "method": "webhook",
      "callback": "https://your-site.netlify.app/api/twitch/eventsub",
      "secret": "YOUR_EVENTSUB_SECRET"
    }
  }'
```

**Important** : 
- Remplacez `YOUR_ACCESS_TOKEN` par un token OAuth avec le scope `channel:read:subscriptions`
- Remplacez `YOUR_BROADCASTER_ID` par l'ID du broadcaster qui recevra les raids
- Remplacez `YOUR_EVENTSUB_SECRET` par un secret aléatoire (minimum 10 caractères)
- Remplacez `https://your-site.netlify.app` par l'URL de votre site Netlify

### 3. Vérification du webhook

Lors de la création de la subscription, Twitch enverra un challenge au webhook. Le handler doit répondre avec le challenge pour valider la subscription.

## Format des événements

Lorsqu'un raid se produit, Twitch enverra un événement au format :

```json
{
  "subscription": {
    "id": "...",
    "type": "channel.raid",
    "version": "1",
    "status": "enabled",
    ...
  },
  "event": {
    "from_broadcaster_user_id": "123456",
    "from_broadcaster_user_login": "raider_login",
    "from_broadcaster_user_name": "Raider Name",
    "to_broadcaster_user_id": "789012",
    "to_broadcaster_user_login": "target_login",
    "to_broadcaster_user_name": "Target Name",
    "viewers": 150
  }
}
```

## Stockage des données

Les raids Twitch sont stockés dans les mêmes fichiers mensuels que les raids Discord :

- `tenf-raids/{YYYY-MM}/raids-faits.json`
- `tenf-raids/{YYYY-MM}/raids-recus.json`
- `tenf-raids/{YYYY-MM}/alerts.json`

Chaque raid Twitch est marqué avec :
- `source: "twitch-live"`
- `manual: false`
- `viewers: number` (nombre de viewers du raid)

## Priorité MANUAL > BOT

Les raids Twitch respectent la même règle de priorité :
- Si un admin a modifié manuellement un raid (`manual: true`), le bot ne l'écrasera jamais
- Les raids Twitch ne seront ajoutés que s'ils n'existent pas déjà (détection de doublons)

## Endpoint d'inspection

Pour inspecter les raids Twitch d'un mois :

```
GET /api/raids/twitch?month=YYYY-MM
```

## Dashboard

Dans `/admin/raids`, vous pouvez :
- Filtrer par source (Discord / Twitch / Manuel)
- Voir la répartition des sources pour chaque membre
- Les statistiques prennent en compte toutes les sources par défaut

## Dépannage

### Le webhook ne reçoit pas d'événements

1. Vérifiez que la subscription est active : `GET https://api.twitch.tv/helix/eventsub/subscriptions`
2. Vérifiez les logs Netlify Functions
3. Vérifiez que l'URL du webhook est accessible publiquement
4. Vérifiez que `TWITCH_EVENTSUB_SECRET` correspond au secret utilisé lors de la création

### Les raids ne sont pas enregistrés

1. Vérifiez les logs dans la console Netlify
2. Vérifiez que les membres existent dans la base avec leur `twitchLogin`
3. Vérifiez que le mois est correct (format YYYY-MM)

### Erreur de signature

1. Vérifiez que `TWITCH_EVENTSUB_SECRET` est correct
2. Vérifiez que les headers EventSub sont bien présents
3. Vérifiez les logs pour voir la signature reçue vs attendue

