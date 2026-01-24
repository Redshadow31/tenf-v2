# 🧪 Test du Système de Logging

**Date** : 2025-01-08  
**Objectif** : Vérifier que les logs sont bien enregistrés dans Supabase

---

## ✅ Migration SQL Appliquée

La table `structured_logs` a été créée dans Supabase avec succès.

---

## 🧪 Tests à Effectuer

### 1. Générer des logs

Effectuer quelques actions sur le site pour générer des logs :

1. **Créer ou modifier un membre** :
   - Aller sur `/admin/membres/gestion`
   - Créer ou modifier un membre
   - Cela devrait générer des logs `MEMBER_ACTION`

2. **Créer ou modifier un événement** :
   - Aller sur `/admin/events/planification`
   - Créer ou modifier un événement
   - Cela devrait générer des logs `EVENT_ACTION`

3. **Accéder à des routes API** :
   - Les routes API loggent automatiquement chaque requête
   - Cela devrait générer des logs `API_ROUTE`

### 2. Vérifier dans Supabase

Dans Supabase SQL Editor, exécuter :

```sql
-- Vérifier le nombre de logs
SELECT COUNT(*) FROM structured_logs;

-- Voir les logs récents
SELECT 
  timestamp,
  category,
  level,
  message,
  route,
  actor_discord_id
FROM structured_logs 
ORDER BY timestamp DESC 
LIMIT 20;

-- Voir les logs par catégorie
SELECT 
  category,
  COUNT(*) as count
FROM structured_logs
GROUP BY category
ORDER BY count DESC;
```

### 3. Vérifier dans l'interface

1. Aller sur `/admin/log-center`
2. Cliquer sur l'onglet "Audit (Founders)" ou "Journal (Legacy)"
3. Les logs devraient apparaître

---

## 🔍 Vérification des Logs

### Logs attendus

Après quelques actions, vous devriez voir :

- **API_ROUTE** : Chaque requête API
- **MEMBER_ACTION** : Création/modification/suppression de membres
- **EVENT_ACTION** : Création/modification d'événements
- **DATABASE** : Requêtes de base de données
- **CACHE** : Hits/misses du cache Redis

### Structure d'un log

```json
{
  "id": "uuid",
  "timestamp": "2025-01-08T20:00:00.000Z",
  "category": "api_route",
  "level": "info",
  "message": "GET /api/admin/members - 200",
  "route": "GET /api/admin/members",
  "durationMs": 45,
  "actorDiscordId": "discord-id",
  "details": {
    "status": 200,
    "count": 50
  }
}
```

---

## ✅ Résultat Attendu

- ✅ Les logs sont enregistrés dans Supabase
- ✅ Les logs apparaissent dans `/admin/log-center`
- ✅ Les logs sont persistants (ne sont pas perdus au redémarrage)
- ✅ Les filtres fonctionnent (category, level, search, month)

---

## 🐛 Dépannage

### Aucun log n'apparaît

1. **Vérifier que la table existe** :
   ```sql
   SELECT * FROM structured_logs LIMIT 1;
   ```

2. **Vérifier les erreurs dans la console** :
   - Ouvrir les DevTools (F12)
   - Aller dans l'onglet Console
   - Chercher les erreurs `[Logger]`

3. **Vérifier les variables d'environnement** :
   - `SUPABASE_SERVICE_ROLE_KEY` doit être configuré
   - `NEXT_PUBLIC_SUPABASE_URL` doit être configuré

### Les logs ne sont pas enregistrés

1. **Vérifier la connexion Supabase** :
   ```sql
   SELECT NOW();
   ```

2. **Vérifier les permissions** :
   - La clé service_role doit avoir les permissions d'insertion

---

**Le système est maintenant opérationnel !** 🚀
