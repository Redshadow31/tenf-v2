# 📊 Guide d'Application des Index SQL

**Date** : $(date)  
**Objectif** : Optimiser les performances de la base de données avec des index

---

## 🎯 Objectif

Créer des index sur les colonnes fréquemment utilisées pour améliorer les performances des requêtes de 50-80%.

---

## 📋 Prérequis

- ✅ Accès au SQL Editor de Supabase
- ✅ Connexion à votre projet Supabase
- ✅ Script SQL prêt : `migration/SCRIPTS_OPTIMISATION_SQL.sql`

---

## 🔧 Étape 1 : Vérifier les Index Existants

Avant d'appliquer les nouveaux index, vérifiez ceux qui existent déjà :

```sql
-- Vérifier les index existants sur les tables principales
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('members', 'events', 'evaluations', 'spotlights', 'event_registrations', 'event_presences', 'spotlight_presences', 'vip_history')
ORDER BY
    tablename, indexname;
```

**Note** : Si certains index existent déjà, le script utilisera `CREATE INDEX IF NOT EXISTS` pour éviter les erreurs.

---

## 🔧 Étape 2 : Appliquer les Index

### Option A : Via SQL Editor (Recommandé)

1. **Ouvrir Supabase Dashboard**
   - Allez sur https://supabase.com/dashboard
   - Sélectionnez votre projet
   - Cliquez sur "SQL Editor" dans le menu de gauche

2. **Copier le Script**
   - Ouvrez `migration/SCRIPTS_OPTIMISATION_SQL.sql`
   - Copiez tout le contenu

3. **Exécuter le Script**
   - Collez le script dans l'éditeur SQL
   - Cliquez sur "Run" ou appuyez sur `Ctrl+Enter`
   - Attendez la confirmation de succès

4. **Vérifier les Résultats**
   - Vous devriez voir des messages de confirmation pour chaque index créé
   - Si un index existe déjà, vous verrez un message "already exists" (normal)

### Option B : Via CLI (Avancé)

Si vous préférez utiliser la CLI Supabase :

```bash
# Installer Supabase CLI (si pas déjà fait)
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref your-project-ref

# Exécuter le script
supabase db execute --file migration/SCRIPTS_OPTIMISATION_SQL.sql
```

---

## 🔍 Étape 3 : Vérifier les Index Créés

Exécutez cette requête pour vérifier que tous les index ont été créés :

```sql
-- Vérifier tous les index créés
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('members', 'events', 'evaluations', 'spotlights', 'event_registrations', 'event_presences', 'spotlight_presences', 'vip_history')
    AND indexname LIKE 'idx_%'
ORDER BY
    tablename, indexname;
```

**Résultat attendu** : Vous devriez voir environ 20+ index avec le préfixe `idx_`.

---

## 📊 Index Créés

### Members (5 index)
- ✅ `idx_members_twitch_login` - Recherche par login Twitch
- ✅ `idx_members_discord_id` - Recherche par ID Discord
- ✅ `idx_members_is_active` - Filtrage des membres actifs
- ✅ `idx_members_is_vip` - Filtrage des VIP
- ✅ `idx_members_role` - Filtrage par rôle
- ✅ `idx_members_active_role` - Composite (active + rôle)

### Events (4 index)
- ✅ `idx_events_date` - Tri par date
- ✅ `idx_events_is_published` - Filtrage des événements publiés
- ✅ `idx_events_category` - Filtrage par catégorie
- ✅ `idx_events_date_published` - Composite (date + published)

### Evaluations (3 index)
- ✅ `idx_evaluations_month` - Recherche par mois
- ✅ `idx_evaluations_twitch_login` - Recherche par membre
- ✅ `idx_evaluations_month_login` - Composite (mois + login)

### Spotlights (3 index)
- ✅ `idx_spotlights_started_at` - Tri par date
- ✅ `idx_spotlights_status` - Filtrage par statut
- ✅ `idx_spotlights_streamer` - Recherche par streamer

### Event Registrations (3 index)
- ✅ `idx_event_registrations_event_id` - Recherche par événement
- ✅ `idx_event_registrations_twitch_login` - Recherche par membre
- ✅ `idx_event_registrations_event_login` - Composite (événement + login)

### Event Presences (3 index)
- ✅ `idx_event_presences_event_id` - Recherche par événement
- ✅ `idx_event_presences_twitch_login` - Recherche par membre
- ✅ `idx_event_presences_event_login` - Composite (événement + login)

### Spotlight Presences (2 index)
- ✅ `idx_spotlight_presences_spotlight_id` - Recherche par spotlight
- ✅ `idx_spotlight_presences_twitch_login` - Recherche par membre

### VIP History (3 index)
- ✅ `idx_vip_history_month` - Recherche par mois
- ✅ `idx_vip_history_twitch_login` - Recherche par membre
- ✅ `idx_vip_history_month_login` - Composite (mois + login)

**Total** : ~26 index créés

---

## ⚡ Impact Attendu

### Avant les Index
- Recherche par `twitch_login` : ~100-500ms (scan complet de table)
- Filtrage `is_active = true` : ~200-800ms
- Jointures complexes : ~500-2000ms

### Après les Index
- Recherche par `twitch_login` : ~1-10ms (index lookup)
- Filtrage `is_active = true` : ~5-20ms
- Jointures complexes : ~50-200ms

### Amélioration Estimée
- ⚡ **50-80%** de réduction du temps de réponse
- ⚡ **70-90%** de réduction des scans de table complets
- ⚡ **Meilleure scalabilité** avec plus de données

---

## 🔍 Étape 4 : Analyser les Performances

Après avoir créé les index, analysez les tables pour mettre à jour les statistiques :

```sql
-- Analyser les tables pour optimiser les statistiques
ANALYZE members;
ANALYZE events;
ANALYZE evaluations;
ANALYZE spotlights;
ANALYZE event_registrations;
ANALYZE event_presences;
ANALYZE spotlight_presences;
ANALYZE vip_history;
```

**Note** : Cette commande met à jour les statistiques du planificateur de requêtes PostgreSQL, permettant d'utiliser les index de manière optimale.

---

## 🧪 Étape 5 : Tester les Performances

Testez une requête avant et après pour voir l'amélioration :

```sql
-- Test 1 : Recherche par twitch_login (devrait utiliser idx_members_twitch_login)
EXPLAIN ANALYZE
SELECT * FROM members
WHERE twitch_login = 'nexou31';

-- Test 2 : Filtrage des membres actifs (devrait utiliser idx_members_is_active)
EXPLAIN ANALYZE
SELECT * FROM members
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 50;

-- Test 3 : Recherche d'évaluations par mois (devrait utiliser idx_evaluations_month_login)
EXPLAIN ANALYZE
SELECT * FROM evaluations
WHERE month = '2024-01-01'
  AND twitch_login = 'nexou31';
```

**Résultat attendu** : Vous devriez voir `Index Scan using idx_...` dans le plan d'exécution au lieu de `Seq Scan`.

---

## ⚠️ Notes Importantes

### Espace Disque
- Les index prennent de l'espace disque (généralement 10-20% de la taille de la table)
- Pour une base de données de 100MB, les index prendront environ 10-20MB supplémentaires
- C'est un investissement rentable pour les performances

### Maintenance
- Les index sont automatiquement maintenus par PostgreSQL
- Pas de maintenance manuelle nécessaire
- Les index sont mis à jour automatiquement lors des INSERT/UPDATE/DELETE

### Performance d'Écriture
- Les index légèrement ralentissent les écritures (INSERT/UPDATE/DELETE)
- L'amélioration des lectures (SELECT) compense largement ce ralentissement
- Pour une application principalement en lecture, c'est un excellent compromis

---

## 🐛 Dépannage

### Erreur : "relation already exists"
- **Cause** : L'index existe déjà
- **Solution** : Normal, le script utilise `IF NOT EXISTS` pour éviter cette erreur

### Erreur : "permission denied"
- **Cause** : Pas les permissions nécessaires
- **Solution** : Vérifiez que vous utilisez le compte admin/service_role

### Erreur : "out of memory"
- **Cause** : Trop de données à indexer d'un coup
- **Solution** : Créez les index un par un ou par petits groupes

### Les index ne sont pas utilisés
- **Cause** : Statistiques obsolètes ou requête mal optimisée
- **Solution** : Exécutez `ANALYZE` sur les tables concernées

---

## ✅ Checklist

- [ ] Vérifier les index existants
- [ ] Appliquer le script SQL dans Supabase SQL Editor
- [ ] Vérifier que tous les index ont été créés
- [ ] Analyser les tables (ANALYZE)
- [ ] Tester les performances avec EXPLAIN ANALYZE
- [ ] Vérifier l'utilisation des index dans les requêtes

---

## 📚 Ressources

- [Documentation PostgreSQL - Index](https://www.postgresql.org/docs/current/indexes.html)
- [Supabase SQL Editor](https://supabase.com/docs/guides/database/overview)
- [PostgreSQL EXPLAIN](https://www.postgresql.org/docs/current/sql-explain.html)

---

**Date de création** : $(date)  
**Statut** : ⏳ Prêt à être appliqué
