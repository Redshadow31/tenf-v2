# 🧪 Guide de Test des Routes Événements Migrées

Ce document fournit des instructions pour tester les routes API liées aux événements après leur migration vers Supabase.

## 🚀 Démarrage du Serveur de Développement

Assurez-vous que votre serveur de développement Next.js est en cours d'exécution.
```bash
npm run dev
```
Le serveur devrait être accessible sur `http://localhost:3000`.

## 1. Test Automatique (Recommandé)

Un script a été créé pour exécuter une série de tests sur les routes GET des événements.

```bash
npx tsx migration/test-routes-events.ts
```

**Résultats attendus :**
- Pour les routes nécessitant une authentification admin, vous devriez voir des codes de statut `403 Forbidden` ou `401 Unauthorized`. C'est un comportement normal si vous n'êtes pas connecté en tant qu'admin.
- Pour la route publique `/api/events`, vous devriez voir un code `200 OK`.
- Si vous voyez des erreurs `500 Internal Server Error`, cela indique un problème côté serveur qui doit être investigué.

## 2. Tests Manuels (avec `curl` ou Postman/Insomnia)

Pour des tests plus approfondis, notamment les routes `POST`, `PUT`, `DELETE`, vous pouvez utiliser `curl` ou un outil comme Postman/Insomnia.

**Prérequis pour les tests admin :**
Pour tester les routes admin, vous devez être authentifié. Cela signifie que vous devez avoir une session admin active dans votre navigateur et récupérer les cookies `next-auth.session-token` ou `__Secure-next-auth.session-token`.

**Étapes pour récupérer le token de session (navigateur) :**
1. Connectez-vous à l'interface admin de votre application (ex: `http://localhost:3000/admin`).
2. Ouvrez les outils de développement de votre navigateur (F12).
3. Allez dans l'onglet `Application` -> `Cookies`.
4. Trouvez le cookie `next-auth.session-token` (ou `__Secure-next-auth.session-token` si HTTPS est activé).
5. Copiez sa valeur. Vous l'utiliserez dans l'en-tête `Cookie` de vos requêtes `curl`.

### Exemples de Requêtes `curl`

Remplacez `YOUR_SESSION_TOKEN` par la valeur de votre cookie de session.

#### 2.1. GET /api/events
Récupère tous les événements publiés (route publique).

```bash
curl -X GET "http://localhost:3000/api/events"
```
**Attendu :** `200 OK` avec la liste des événements publiés.

#### 2.2. GET /api/admin/events/registrations
Récupère toutes les inscriptions pour tous les événements (admin uniquement).

```bash
curl -X GET "http://localhost:3000/api/admin/events/registrations" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```
**Attendu :** `200 OK` avec les événements et leurs inscriptions.

#### 2.3. GET /api/admin/events/presence?eventId=EVENT_ID
Récupère les présences pour un événement spécifique (admin uniquement).

```bash
# Remplacez EVENT_ID par un ID d'événement existant
curl -X GET "http://localhost:3000/api/admin/events/presence?eventId=EVENT_ID" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```
**Attendu :** `200 OK` avec les présences et inscriptions de l'événement.

#### 2.4. GET /api/admin/events/presence?month=2024-01
Récupère tous les événements d'un mois et leurs présences (admin uniquement).

```bash
curl -X GET "http://localhost:3000/api/admin/events/presence?month=2024-01" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```
**Attendu :** `200 OK` avec les événements du mois et leurs présences.

#### 2.5. POST /api/events/[eventId]/register
Inscription à un événement (nécessite authentification Discord).

```bash
# Remplacez EVENT_ID par un ID d'événement existant
curl -X POST "http://localhost:3000/api/events/EVENT_ID/register" \
  -H "Content-Type: application/json" \
  -H "Cookie: discord_user_id=YOUR_DISCORD_ID; discord_username=YOUR_USERNAME" \
  -d '{
    "notes": "Note optionnelle"
  }'
```
**Attendu :** `200 OK` avec l'inscription créée, ou `409 Conflict` si déjà inscrit.

#### 2.6. DELETE /api/events/[eventId]/unregister
Désinscription d'un événement (nécessite authentification Discord).

```bash
# Remplacez EVENT_ID par un ID d'événement existant
curl -X DELETE "http://localhost:3000/api/events/EVENT_ID/unregister" \
  -H "Cookie: discord_user_id=YOUR_DISCORD_ID"
```
**Attendu :** `200 OK` avec un message de succès.

#### 2.7. POST /api/admin/events/presence
Ajoute ou met à jour une présence pour un membre à un événement (admin uniquement).

```bash
curl -X POST "http://localhost:3000/api/admin/events/presence" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "eventId": "EVENT_ID",
    "member": {
      "twitchLogin": "testuser",
      "displayName": "Test User",
      "discordId": "123456789",
      "discordUsername": "testuser"
    },
    "present": true,
    "note": "Note optionnelle"
  }'
```
**Attendu :** `200 OK` avec la présence enregistrée.

#### 2.8. PUT /api/admin/events/presence
Met à jour la note d'une présence (admin uniquement).

```bash
curl -X PUT "http://localhost:3000/api/admin/events/presence" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "eventId": "EVENT_ID",
    "twitchLogin": "testuser",
    "note": "Nouvelle note"
  }'
```
**Attendu :** `200 OK` avec un message de succès.

#### 2.9. DELETE /api/admin/events/presence
Supprime une présence (admin uniquement).

```bash
curl -X DELETE "http://localhost:3000/api/admin/events/presence?eventId=EVENT_ID&twitchLogin=testuser" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```
**Attendu :** `200 OK` avec un message de succès.

#### 2.10. PATCH /api/admin/events/presence
Crée un événement précédent non enregistré (admin uniquement).

```bash
curl -X PATCH "http://localhost:3000/api/admin/events/presence" \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "title": "Événement passé",
    "date": "2024-01-15T18:00:00Z",
    "category": "Soirées communautaires",
    "description": "Description de l\'événement",
    "location": "En ligne"
  }'
```
**Attendu :** `200 OK` avec l'événement créé.

## 3. Vérification des Données dans Supabase

Après avoir exécuté les tests (surtout les `POST`/`PUT`/`DELETE`), vous pouvez vérifier directement dans votre base de données Supabase que les données ont été correctement insérées ou modifiées.

Connectez-vous à votre tableau de bord Supabase et naviguez vers l'onglet `Table Editor`.

### Tables à vérifier :
- `events`
- `event_registrations`
- `event_presences`

### Requêtes SQL utiles :

```sql
-- Voir tous les événements
SELECT * FROM public.events ORDER BY created_at DESC;

-- Voir toutes les inscriptions
SELECT * FROM public.event_registrations ORDER BY registered_at DESC;

-- Voir toutes les présences
SELECT * FROM public.event_presences ORDER BY created_at DESC;

-- Voir les présences pour un événement spécifique
SELECT * FROM public.event_presences WHERE event_id = 'EVENT_ID';

-- Voir les inscriptions et présences pour un événement
SELECT 
  er.*,
  ep.present,
  ep.note as presence_note
FROM public.event_registrations er
LEFT JOIN public.event_presences ep ON er.event_id = ep.event_id AND er.twitch_login = ep.twitch_login
WHERE er.event_id = 'EVENT_ID';
```

## 4. Dépannage

- **Erreurs 401/403** : Assurez-vous d'être connecté en tant qu'admin et d'utiliser le bon cookie de session.
- **Erreurs 500** : Vérifiez les logs de votre serveur Next.js (le terminal où `npm run dev` est exécuté) pour des messages d'erreur détaillés.
- **Données non trouvées** : Assurez-vous que les IDs d'événements utilisés dans vos requêtes existent dans la base de données.
- **Problèmes de connexion Supabase** : Vérifiez vos variables d'environnement (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- **Erreur "relation event_presences does not exist"** : Assurez-vous d'avoir appliqué la migration SQL `0004_low_silver_surfer.sql` dans Supabase.

## 5. Application de la Migration SQL

Avant de tester, assurez-vous d'avoir appliqué la migration SQL pour créer la table `event_presences` :

1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans l'onglet `SQL Editor`
3. Ouvrez le fichier `lib/db/migrations/0004_low_silver_surfer.sql`
4. Copiez le contenu et exécutez-le dans l'éditeur SQL

---

**Fin du guide de test.**
