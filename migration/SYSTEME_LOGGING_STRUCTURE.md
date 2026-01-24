# 📊 Système de Logging Structuré

**Date** : $(date)  
**Objectif** : Suivi détaillé des actions, routes et systèmes du site par catégories

---

## 🎯 Vue d'Ensemble

Le système de logging structuré permet de :
- ✅ Catégoriser les logs (Auth, Actions, Routes, Systèmes, etc.)
- ✅ Suivre les performances (durée des requêtes)
- ✅ Visualiser les logs en temps réel
- ✅ Tester tous les systèmes du site
- ✅ Filtrer et rechercher dans les logs

---

## 📁 Structure

### Fichiers Créés

1. **`lib/logging/logger.ts`** - Système de logging principal
   - Catégories : Auth, Actions, Routes, Systèmes, Performance, Sécurité
   - Niveaux : DEBUG, INFO, WARN, ERROR
   - Helpers par catégorie : `logAuth`, `logMember`, `logEvent`, `logApi`, etc.

2. **`lib/logging/middleware.ts`** - Middleware pour routes API
   - Wrapper `withLogging()` pour logger automatiquement les routes

3. **`app/api/admin/logs/route.ts`** - API pour récupérer les logs
   - GET : Récupère les logs avec filtres
   - DELETE : Vide les logs

4. **`app/api/admin/system-test/route.ts`** - API pour tester les systèmes
   - POST : Teste tous les systèmes (Supabase, Redis, Repositories, APIs)

5. **`app/admin/logs-structured/page.tsx`** - Page de visualisation des logs
   - Filtres par catégorie et niveau
   - Recherche en temps réel
   - Auto-refresh optionnel

6. **`app/admin/system-test/page.tsx`** - Page de test des systèmes
   - Teste tous les systèmes du site
   - Affiche les résultats avec statut (success/error/warning)
   - Test par système individuel ou tous ensemble

---

## 🏷️ Catégories de Logs

### Actions Utilisateur
- `AUTH` - Authentification (login, logout)
- `MEMBER_ACTION` - Actions sur les membres (create, update, delete)
- `EVENT_ACTION` - Actions sur les événements
- `SPOTLIGHT_ACTION` - Actions sur les spotlights
- `EVALUATION_ACTION` - Actions sur les évaluations

### Routes API
- `API_ROUTE` - Routes API (toutes)
- `API_ERROR` - Erreurs API
- `API_SUCCESS` - Succès API

### Systèmes
- `DATABASE` - Base de données (Supabase)
- `CACHE` - Cache Redis
- `TWITCH` - API Twitch
- `DISCORD` - API Discord
- `STORAGE` - Stockage (Supabase Storage)

### Performance
- `PERFORMANCE` - Métriques de performance
- `QUERY` - Requêtes base de données

### Sécurité
- `SECURITY` - Événements de sécurité
- `RATE_LIMIT` - Limitation de débit

### Tests
- `SYSTEM_TEST` - Tests système

---

## 📊 Niveaux de Logs

- **DEBUG** : Informations de débogage (développement uniquement)
- **INFO** : Informations générales
- **WARN** : Avertissements (non bloquants)
- **ERROR** : Erreurs (bloquantes)

---

## 🚀 Utilisation

### Dans les Routes API

```typescript
import { logApi } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    // Votre code...
    const duration = Date.now() - startTime;
    logApi.success('/api/ma-route', duration);
    return NextResponse.json({ data });
  } catch (error) {
    logApi.error('/api/ma-route', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
```

### Dans les Repositories

```typescript
import { logDatabase } from '@/lib/logging/logger';

async findActive() {
  const startTime = Date.now();
  try {
    const { data, error } = await supabaseAdmin.from('members')...;
    const duration = Date.now() - startTime;
    logDatabase.query('SELECT', 'members', duration);
    return data;
  } catch (error) {
    logDatabase.error('SELECT', 'members', error);
    throw error;
  }
}
```

### Pour les Actions Utilisateur

```typescript
import { logMember } from '@/lib/logging/logger';

// Création d'un membre
await memberRepository.create(member);
logMember.create(member.twitchLogin, admin.id);

// Mise à jour
await memberRepository.update(login, updates);
logMember.update(login, admin.id);
```

### Pour les Tests Système

```typescript
import { logSystemTest } from '@/lib/logging/logger';

// Test réussi
logSystemTest.success('Supabase', 'Connexion réussie', { duration: 50 });

// Test échoué
logSystemTest.error('Redis', 'Connexion échouée', { error: 'Timeout' });
```

---

## 🖥️ Pages Admin

### `/admin/logs-structured`

**Fonctionnalités** :
- ✅ Visualisation des logs en temps réel
- ✅ Filtres par catégorie et niveau
- ✅ Recherche dans les logs
- ✅ Statistiques (total, erreurs, avertissements)
- ✅ Auto-refresh optionnel (toutes les 5 secondes)
- ✅ Bouton pour vider les logs

**Utilisation** :
1. Aller sur `/admin/logs-structured`
2. Filtrer par catégorie ou niveau si nécessaire
3. Utiliser la recherche pour trouver des logs spécifiques
4. Activer l'auto-refresh pour suivre les logs en temps réel

### `/admin/system-test`

**Fonctionnalités** :
- ✅ Test de tous les systèmes (Supabase, Redis, Repositories, APIs)
- ✅ Test par système individuel
- ✅ Affichage des résultats avec statut et durée
- ✅ Logs automatiques des tests

**Systèmes testés** :
- **Supabase** : Connexion à la base de données
- **Redis** : Connexion au cache (si configuré)
- **Repositories** : MemberRepository, EventRepository, SpotlightRepository, EvaluationRepository
- **Twitch API** : Accessibilité de l'API
- **Discord API** : Accessibilité de l'API

**Utilisation** :
1. Aller sur `/admin/system-test`
2. Sélectionner un système spécifique (optionnel) ou laisser "Tous les systèmes"
3. Cliquer sur "Lancer les tests"
4. Vérifier les résultats (success/error/warning)

---

## 🔧 API Endpoints

### GET `/api/admin/logs`

Récupère les logs avec filtres.

**Query Parameters** :
- `category` : Catégorie de log (optionnel)
- `level` : Niveau de log (optionnel)
- `since` : Date ISO depuis laquelle récupérer les logs (optionnel)
- `limit` : Nombre maximum de logs (optionnel, défaut: 100)

**Réponse** :
```json
{
  "logs": [
    {
      "timestamp": "2025-01-08T10:30:00.000Z",
      "category": "api_route",
      "level": "info",
      "message": "GET /api/members/public - 200",
      "route": "GET /api/members/public",
      "duration": 45,
      "details": { "status": 200 }
    }
  ],
  "stats": {
    "total": 150,
    "byCategory": { "api_route": 50, "database": 30, ... },
    "byLevel": { "info": 100, "error": 10, ... },
    "errors": 10,
    "warnings": 5
  },
  "total": 100
}
```

### DELETE `/api/admin/logs`

Vide tous les logs en mémoire.

**Réponse** :
```json
{
  "success": true,
  "message": "Logs vidés"
}
```

### POST `/api/admin/system-test`

Teste tous les systèmes ou un système spécifique.

**Query Parameters** :
- `system` : Système à tester (optionnel: "supabase", "redis", "repositories", "twitch", "discord")

**Réponse** :
```json
{
  "success": true,
  "results": {
    "supabase": {
      "status": "success",
      "message": "Connexion réussie",
      "duration": 50
    },
    "redis": {
      "status": "success",
      "message": "Cache fonctionnel",
      "duration": 10
    },
    "repositories": {
      "memberRepository": {
        "status": "success",
        "message": "Comptage actif: 50 membres",
        "duration": 30
      },
      ...
    }
  },
  "timestamp": "2025-01-08T10:30:00.000Z"
}
```

---

## 📝 Exemples d'Intégration

### Route API avec Logging

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { logApi } from '@/lib/logging/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    logApi.info('/api/ma-route', 'Début traitement');
    
    // Votre code...
    const data = await fetchData();
    
    const duration = Date.now() - startTime;
    logApi.success('/api/ma-route', duration);
    
    return NextResponse.json({ data });
  } catch (error) {
    logApi.error('/api/ma-route', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
```

### Repository avec Logging

```typescript
import { logDatabase } from '@/lib/logging/logger';

async findById(id: string) {
  const startTime = Date.now();
  try {
    const { data, error } = await supabaseAdmin
      .from('members')
      .select('*')
      .eq('id', id)
      .single();
    
    const duration = Date.now() - startTime;
    
    if (error) {
      logDatabase.error('SELECT', 'members', error);
      throw error;
    }
    
    logDatabase.query('SELECT', 'members', duration, { id });
    return data;
  } catch (error) {
    logDatabase.error('SELECT', 'members', error);
    throw error;
  }
}
```

---

## 🎨 Interface Utilisateur

### Page Logs Structurés

- **Statistiques en haut** : Total, Erreurs, Avertissements, Logs affichés
- **Filtres** : Catégorie, Niveau, Recherche
- **Liste des logs** : Affichage avec couleur selon le niveau
- **Détails** : Expandable pour voir les détails complets

### Page Test Système

- **Sélecteur de système** : Tous ou un système spécifique
- **Résultats** : Cartes avec statut coloré (vert/rouge/jaune)
- **Durée** : Affichée pour chaque test
- **Messages** : Description détaillée de chaque résultat

---

## ⚙️ Configuration

### Limite de Logs

Par défaut, le système garde **1000 logs en mémoire**. Pour modifier :

```typescript
// lib/logging/logger.ts
class Logger {
  private maxLogs = 1000; // Modifier ici
}
```

### Auto-refresh

Sur la page `/admin/logs-structured`, l'auto-refresh rafraîchit toutes les **5 secondes** par défaut.

---

## 🔍 Recherche et Filtres

### Filtres Disponibles

- **Catégorie** : Filtrer par type de log (Auth, Actions, Routes, etc.)
- **Niveau** : Filtrer par niveau (DEBUG, INFO, WARN, ERROR)
- **Recherche** : Recherche textuelle dans les messages, routes et détails

### Exemples de Recherche

- `"Failed to fetch"` - Trouve tous les logs contenant cette phrase
- `"/api/members"` - Trouve tous les logs liés à cette route
- `"Supabase"` - Trouve tous les logs liés à Supabase

---

## 📊 Statistiques

Les statistiques affichées incluent :
- **Total** : Nombre total de logs
- **Par catégorie** : Répartition par type de log
- **Par niveau** : Répartition par niveau (DEBUG, INFO, WARN, ERROR)
- **Erreurs** : Nombre total d'erreurs
- **Avertissements** : Nombre total d'avertissements

---

## ✅ Statut

- ✅ Système de logging structuré créé
- ✅ Catégories et niveaux définis
- ✅ API pour récupérer les logs
- ✅ API pour tester les systèmes
- ✅ Page de visualisation des logs
- ✅ Page de test des systèmes
- ✅ Intégration dans route members/public
- ⏳ Intégration dans autres routes (à faire progressivement)

---

## 🚀 Prochaines Étapes

1. **Intégrer le logging dans toutes les routes API** :
   - Utiliser `logApi.route()` pour chaque route
   - Utiliser `logApi.error()` pour les erreurs
   - Utiliser `logApi.success()` pour les succès

2. **Intégrer le logging dans les repositories** :
   - Utiliser `logDatabase.query()` pour les requêtes
   - Utiliser `logDatabase.error()` pour les erreurs

3. **Intégrer le logging dans les actions** :
   - Utiliser `logMember`, `logEvent`, `logSpotlight`, etc.

4. **Persistance des logs** (optionnel) :
   - Sauvegarder les logs dans Supabase
   - Historique des logs sur plusieurs jours

---

**Le système est prêt à être utilisé !** 🎉
