# 📋 Plan de Migration des Routes API

Ce document décrit le plan de migration des routes API de Netlify Blobs vers Supabase via les repositories.

## 🎯 Objectif

Refactoriser toutes les routes API pour utiliser les repositories au lieu de Netlify Blobs, permettant une migration progressive et testable.

## 📊 Routes à Migrer

### ✅ Phase 1 : Routes Publiques (Priorité Haute)

1. **✅ `/api/members/public`** - Route publique des membres
   - **Avant** : `getAllActiveMemberDataFromAllLists()` depuis `lib/memberData`
   - **Après** : `memberRepository.findActive()`
   - **Status** : ✅ Migré et testé

2. **✅ `/api/vip-members`** - Route publique des VIPs
   - **Avant** : `getAllVipMemberData()` + Netlify Blobs pour VIP du mois
   - **Après** : `vipRepository.findCurrentMonth()` + `memberRepository.findVip()`
   - **Status** : ✅ Migré et testé

3. **✅ `/api/events`** - Route publique des événements
   - **Avant** : `loadEvents()` depuis `lib/eventStorage`
   - **Après** : `eventRepository.findPublished()` ou `eventRepository.findUpcoming()`
   - **Status** : ✅ Migré et testé

### ✅ Phase 2 : Routes Admin Membres (Priorité Haute)

4. **⏳ `/api/admin/members`** - CRUD complet des membres
   - **GET** : `memberRepository.findAll()` ou `memberRepository.findByTwitchLogin()`
   - **POST** : `memberRepository.create()`
   - **PUT** : `memberRepository.update()`
   - **DELETE** : `memberRepository.delete()`
   - **Status** : ⏳ À migrer

### ✅ Phase 3 : Routes Admin Événements (Priorité Moyenne)

5. **⏳ `/api/admin/events`** - CRUD des événements
   - **GET** : `eventRepository.findAll()`
   - **POST** : `eventRepository.create()`
   - **PUT** : `eventRepository.update()`
   - **DELETE** : `eventRepository.delete()`
   - **Status** : ⏳ À migrer

6. **⏳ `/api/events/[eventId]/register`** - Inscription aux événements
   - **Avant** : `addEventRegistration()` depuis `lib/eventStorage`
   - **Après** : `eventRepository.addRegistration()`
   - **Status** : ⏳ À migrer

### ✅ Phase 4 : Routes Spotlight (Priorité Moyenne)

7. **⏳ `/api/spotlight/active`** - Spotlight actif
   - **GET** : `spotlightRepository.findActive()`
   - **POST** : `spotlightRepository.create()`
   - **PATCH** : `spotlightRepository.update()`
   - **Status** : ⏳ À migrer

8. **⏳ `/api/spotlight/presences`** - Présences spotlight
   - **Avant** : `getSpotlightPresences()` depuis `lib/spotlightStorage`
   - **Après** : `spotlightRepository.getPresences()`
   - **Status** : ⏳ À migrer

9. **⏳ `/api/spotlight/evaluation`** - Évaluations spotlight
   - **Avant** : `getSpotlightEvaluation()` depuis `lib/spotlightStorage`
   - **Après** : `spotlightRepository.getEvaluation()` et `spotlightRepository.saveEvaluation()`
   - **Status** : ⏳ À migrer

### ✅ Phase 5 : Routes Évaluations (Priorité Basse)

10. **⏳ `/api/evaluations/*`** - Routes d'évaluations mensuelles
    - **Avant** : Stockage dans Netlify Blobs
    - **Après** : `evaluationRepository.findByMonth()`, `evaluationRepository.upsert()`
    - **Status** : ⏳ À migrer

## 🔄 Stratégie de Migration

### Approche Progressive

1. **Migration route par route** : Migrer une route à la fois pour faciliter les tests
2. **Tests après chaque migration** : Vérifier que la route fonctionne correctement
3. **Conservation de l'ancien code** : Garder l'ancien code en commentaire temporairement
4. **Rollback possible** : Pouvoir revenir en arrière si nécessaire

### Points d'Attention

1. **Compatibilité des formats** : S'assurer que les formats de données sont compatibles
2. **Gestion des erreurs** : Adapter la gestion d'erreurs aux repositories
3. **Performance** : Vérifier que les performances sont équivalentes ou meilleures
4. **Cache** : Adapter les stratégies de cache si nécessaire

## 📝 Checklist de Migration

Pour chaque route :

- [ ] Lire et comprendre la route actuelle
- [ ] Identifier les appels à Netlify Blobs / fichiers locaux
- [ ] Remplacer par les appels aux repositories
- [ ] Adapter les formats de données si nécessaire
- [ ] Tester la route manuellement
- [ ] Vérifier les performances
- [ ] Mettre à jour la documentation si nécessaire
- [ ] Marquer comme complété dans ce document

## 🚀 Prochaines Étapes

1. ✅ Migrer `/api/members/public`
2. ⏭️ Migrer `/api/vip-members`
3. ⏭️ Migrer `/api/admin/members`
4. ⏭️ Migrer les autres routes par ordre de priorité
