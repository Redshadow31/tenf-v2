# 🧪 Guide de Test des Routes Spotlight Migrées

## 📋 Prérequis

1. **Serveur de développement démarré** :
   ```bash
   npm run dev
   ```

2. **Variables d'environnement configurées** :
   - `DATABASE_URL` (Supabase PostgreSQL)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Base de données Supabase** :
   - Tables créées : `spotlights`, `spotlight_presences`, `spotlight_evaluations`, `evaluations`
   - Migrations appliquées

## 🚀 Tests Automatiques

### Script de test automatique

```bash
npx tsx migration/test-routes-spotlight.ts
```

**Note** : Ce script teste les routes sans authentification. Les erreurs 401/403 sont normales.

## 🔍 Tests Manuels

### 1. Routes Publiques (sans authentification)

#### GET `/api/spotlight/active`
```bash
curl http://localhost:3000/api/spotlight/active
```

**Résultat attendu** :
- `200 OK` avec `{ spotlight: {...} }` ou `{ spotlight: null }`
- Aucune erreur de connexion à Supabase

### 2. Routes Admin (nécessitent authentification)

#### GET `/api/spotlight/presences`
```bash
# Nécessite un cookie de session admin
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/spotlight/presences
```

**Résultat attendu** :
- `200 OK` avec `{ presences: [...] }`
- `403 Forbidden` sans authentification (normal)

#### GET `/api/spotlight/evaluation`
```bash
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/spotlight/evaluation
```

**Résultat attendu** :
- `200 OK` avec `{ evaluation: {...} }` ou `{ evaluation: null }`

#### GET `/api/spotlight/presence/monthly`
```bash
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/spotlight/presence/monthly
```

**Résultat attendu** :
- `200 OK` avec données mensuelles

#### GET `/api/spotlight/presence/monthly?month=2024-01`
```bash
curl -H "Cookie: next-auth.session-token=..." "http://localhost:3000/api/spotlight/presence/monthly?month=2024-01"
```

**Résultat attendu** :
- `200 OK` avec données du mois spécifié

#### GET `/api/spotlight/evaluations/monthly`
```bash
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/spotlight/evaluations/monthly
```

**Résultat attendu** :
- `200 OK` avec évaluations mensuelles

#### GET `/api/spotlight/progression`
```bash
curl -H "Cookie: next-auth.session-token=..." http://localhost:3000/api/spotlight/progression
```

**Résultat attendu** :
- `200 OK` avec données de progression sur 3 mois

## ✅ Checklist de Vérification

### Routes de Base
- [ ] `/api/spotlight/active` - GET fonctionne
- [ ] `/api/spotlight/presences` - GET fonctionne (avec auth)
- [ ] `/api/spotlight/evaluation` - GET fonctionne (avec auth)

### Routes Mensuelles
- [ ] `/api/spotlight/presence/monthly` - GET fonctionne (avec auth)
- [ ] `/api/spotlight/presence/monthly?month=YYYY-MM` - GET avec paramètre fonctionne
- [ ] `/api/spotlight/evaluations/monthly` - GET fonctionne (avec auth)
- [ ] `/api/spotlight/progression` - GET fonctionne (avec auth)

### Routes CRUD
- [ ] `/api/spotlight/presences` - POST fonctionne (ajout présence)
- [ ] `/api/spotlight/presences` - PUT fonctionne (mise à jour présences)
- [ ] `/api/spotlight/presences` - DELETE fonctionne (suppression présence)
- [ ] `/api/spotlight/evaluation` - POST fonctionne (sauvegarde évaluation)
- [ ] `/api/spotlight/finalize` - POST fonctionne (finalisation)
- [ ] `/api/spotlight/manual` - POST fonctionne (création manuelle, fondateur uniquement)

### Routes Spécifiques
- [ ] `/api/spotlight/recover` - POST fonctionne (récupération)
- [ ] `/api/spotlight/member/[twitchLogin]` - GET fonctionne
- [ ] `/api/spotlight/spotlight/[spotlightId]` - GET fonctionne
- [ ] `/api/spotlight/spotlight/[spotlightId]` - PUT fonctionne (mise à jour)
- [ ] `/api/spotlight/evaluation/[spotlightId]` - GET fonctionne
- [ ] `/api/spotlight/evaluation/[spotlightId]` - PUT fonctionne (mise à jour)

## 🔍 Vérifications de Base de Données

### Vérifier les données dans Supabase

1. **Table `spotlights`** :
   ```sql
   SELECT * FROM spotlights ORDER BY started_at DESC LIMIT 10;
   ```

2. **Table `spotlight_presences`** :
   ```sql
   SELECT * FROM spotlight_presences ORDER BY added_at DESC LIMIT 10;
   ```

3. **Table `spotlight_evaluations`** :
   ```sql
   SELECT * FROM spotlight_evaluations ORDER BY evaluated_at DESC LIMIT 10;
   ```

4. **Table `evaluations` (spotlight_evaluations JSONB)** :
   ```sql
   SELECT month, twitch_login, spotlight_evaluations 
   FROM evaluations 
   WHERE spotlight_evaluations IS NOT NULL 
   ORDER BY month DESC 
   LIMIT 10;
   ```

## 🐛 Dépannage

### Erreur : "Non autorisé" (403)
- **Cause** : Pas d'authentification admin
- **Solution** : Connectez-vous en tant qu'admin dans l'application

### Erreur : "Connection refused" ou timeout
- **Cause** : Serveur de développement non démarré
- **Solution** : Lancez `npm run dev`

### Erreur : "Database connection error"
- **Cause** : Variables d'environnement Supabase non configurées
- **Solution** : Vérifiez `.env.local` et les variables Supabase

### Erreur : "Table does not exist"
- **Cause** : Migrations non appliquées
- **Solution** : Appliquez les migrations SQL dans Supabase

## 📊 Résultats Attendus

### Routes GET
- **Status** : `200 OK`
- **Body** : JSON avec les données demandées
- **Pas d'erreurs** : Aucune erreur de connexion ou de parsing

### Routes POST/PUT
- **Status** : `200 OK` ou `201 Created`
- **Body** : JSON avec `success: true` et les données créées/mises à jour
- **Base de données** : Données correctement sauvegardées dans Supabase

### Routes DELETE
- **Status** : `200 OK`
- **Body** : JSON avec `success: true`
- **Base de données** : Données supprimées de Supabase

## 🎯 Tests de Performance

Pour vérifier les performances après migration :

1. **Temps de réponse** :
   - Routes GET : < 500ms
   - Routes POST/PUT : < 1000ms

2. **Requêtes base de données** :
   - Vérifier dans les logs Supabase que les requêtes sont optimisées
   - Pas de requêtes N+1

3. **Cache** :
   - Vérifier que les headers de cache sont correctement configurés

---

**Note** : Pour des tests complets avec authentification, utilisez un outil comme Postman ou Insomnia avec les cookies de session.
