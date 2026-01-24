# 📋 TODO Restant - Migration & Optimisation

**Date** : $(date)  
**Statut** : Migration V3 complète (100%), Optimisations en cours

---

## 🎯 MIGRATION - Ce qui reste

### ✅ Déjà Fait
- ✅ Migration de toutes les routes API (31/31)
- ✅ Migration des images d'événements vers Supabase Storage
- ✅ Création de tous les repositories
- ✅ Création de toutes les tables Supabase
- ✅ Scripts SQL créés (`TOUS_LES_SCRIPTS_SQL.sql`)

### ⏳ À Faire

#### 1. Appliquer les Scripts SQL dans Supabase ✅
**Fichier** : `migration/TOUS_LES_SCRIPTS_SQL.sql`

**Actions** :
- [x] Ouvrir le SQL Editor de Supabase
- [x] Copier-coller le contenu de `TOUS_LES_SCRIPTS_SQL.sql`
- [x] Exécuter le script (créera les index, fonctions SQL, vues matérialisées)
- [x] Vérifier que tout s'est bien exécuté

**Impact** : ⚡ Amélioration des performances de 50-80% ✅ **APPLIQUÉ**

---

#### 2. Migrer les Raids vers Supabase (Optionnel)
**Fichier** : `migration/SCRIPTS_SQL_RAIDS.sql`

**Actions** :
- [ ] Créer la table `raids` dans Supabase (script SQL fourni)
- [ ] Créer un script de migration des données depuis Netlify Blobs
- [ ] Migrer les données historiques
- [ ] Tester les fonctions SQL `compute_raid_stats()`

**Impact** : 📊 Calculs de stats de raids plus rapides

**Note** : Si les raids sont encore dans Netlify Blobs, cette migration est nécessaire pour utiliser les fonctions SQL.

---

#### 3. Migrer les Images Existantes (Optionnel)
**Actions** :
- [ ] Lister les images existantes dans Netlify Blobs
- [ ] Créer un script de migration vers Supabase Storage
- [ ] Migrer les images
- [ ] Vérifier que les URLs fonctionnent

**Impact** : 🖼️ Images stockées de manière centralisée

---

## ⚡ OPTIMISATION - Ce qui reste

### ✅ Déjà Fait
- ✅ Pagination implémentée dans tous les repositories
- ✅ N+1 queries optimisées (6 routes)
- ✅ Scripts SQL d'optimisation créés

### ⏳ À Faire

#### 1. Appliquer les Index SQL (PRIORITÉ HAUTE)
**Fichier** : `migration/TOUS_LES_SCRIPTS_SQL.sql` (Partie 1)

**Actions** :
- [ ] Exécuter la partie "INDEX SQL" dans Supabase
- [ ] Vérifier que les index sont créés
- [ ] Tester les performances avec `EXPLAIN ANALYZE`

**Impact** : ⚡ Réduction de 50-70% du temps de requête

**Temps estimé** : 10 minutes

---

#### 2. Implémenter le Cache Redis (PRIORITÉ MOYENNE)
**Guide** : `migration/IMPLEMENTATION_CACHE_REDIS.md`

**Actions** :
- [ ] Configurer Upstash Redis
- [ ] Créer `lib/cache.ts` avec fonctions de cache
- [ ] Intégrer le cache dans les repositories
- [ ] Configurer les TTL selon le type de données

**Impact** : ⚡ Réduction de 70-90% des appels DB pour données fréquentes

**Temps estimé** : 2-3 heures

**Fichiers à créer/modifier** :
- `lib/cache.ts` (nouveau)
- `lib/repositories/*.ts` (ajouter cache)

---

#### 3. Activer ISR sur les Routes Publiques (PRIORITÉ MOYENNE)
**Actions** :
- [ ] Ajouter `export const revalidate = 60` dans les routes publiques
- [ ] Routes concernées :
  - `app/api/members/public/route.ts`
  - `app/api/events/route.ts`
  - `app/api/vip-members/route.ts`
  - `app/api/stats/route.ts`
  - `app/api/home/route.ts`

**Impact** : ⚡ Réduction de la charge serveur de 60-80%

**Temps estimé** : 30 minutes

---

#### 4. Migrer les Fonctions de Calcul vers SQL (PRIORITÉ BASSE)
**Guide** : `migration/PLAN_MIGRATION_LIB_SUPABASE.md`

**Actions** :
- [ ] Migrer `computeRaidStats` → SQL Function (si raids migrés)
- [ ] Migrer `evaluationBonusHelpers` → SQL Function
- [ ] Migrer `evaluationSynthesisHelpers` → SQL Function

**Impact** : ⚡ Calculs 50-70% plus rapides

**Temps estimé** : 3-4 heures

**Note** : Les fonctions SQL sont déjà créées dans `TOUS_LES_SCRIPTS_SQL.sql`, il faut juste les utiliser.

---

#### 5. Optimiser les Images (PRIORITÉ BASSE)
**Actions** :
- [ ] Configurer Next.js Image Optimization
- [ ] Utiliser `next/image` partout
- [ ] Configurer les formats modernes (WebP, AVIF)

**Impact** : 🖼️ Réduction de 30-50% de la taille des images

**Temps estimé** : 1-2 heures

---

#### 6. Monitoring et Analytics (PRIORITÉ BASSE)
**Actions** :
- [ ] Configurer Supabase Analytics
- [ ] Ajouter des logs structurés
- [ ] Monitorer les performances des requêtes

**Impact** : 📊 Visibilité sur les performances

**Temps estimé** : 2-3 heures

---

## 📊 Priorisation Recommandée

### Phase 1 : Quick Wins (1-2 heures)
1. ✅ Appliquer les index SQL (10 min)
2. ✅ Activer ISR sur routes publiques (30 min)
3. ✅ Tester les performances

**Impact total** : ⚡ 50-70% d'amélioration des performances

---

### Phase 2 : Optimisations Moyennes (3-5 heures)
1. ✅ Implémenter le cache Redis
2. ✅ Migrer les fonctions de calcul vers SQL (si nécessaire)

**Impact total** : ⚡ 70-90% d'amélioration supplémentaire

---

### Phase 3 : Optimisations Avancées (Optionnel)
1. ✅ Optimiser les images
2. ✅ Monitoring et analytics
3. ✅ Migrer les raids (si nécessaire)

**Impact total** : 🎨 Amélioration UX et monitoring

---

## 🎯 Checklist Rapide

### Migration
- [ ] Appliquer `TOUS_LES_SCRIPTS_SQL.sql` dans Supabase
- [ ] Vérifier que les index sont créés
- [ ] Tester les fonctions SQL
- [ ] (Optionnel) Migrer les raids
- [ ] (Optionnel) Migrer les images existantes

### Optimisation
- [ ] Appliquer les index SQL ✅ (dans TOUS_LES_SCRIPTS_SQL.sql)
- [ ] Activer ISR sur routes publiques
- [ ] Implémenter le cache Redis
- [ ] Utiliser les fonctions SQL créées
- [ ] Optimiser les images
- [ ] Configurer le monitoring

---

## 📝 Notes

- **Les scripts SQL sont prêts** : Il suffit de les exécuter dans Supabase
- **Le cache Redis est optionnel** : Mais très recommandé pour les performances
- **ISR est simple** : Juste ajouter `export const revalidate = 60`
- **Les fonctions SQL existent déjà** : Il faut juste les utiliser dans le code

---

**Dernière mise à jour** : $(date)
