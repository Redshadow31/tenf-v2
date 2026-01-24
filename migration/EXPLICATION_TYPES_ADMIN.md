# 🔍 Explication : Types AdminUser vs AuthenticatedAdmin

**Date** : $(date)  
**Problème** : Erreur TypeScript `Property 'discordId' does not exist on type 'AdminUser'`

---

## 📋 Le Problème

Il existe **deux systèmes d'authentification admin** dans le codebase, qui retournent des types différents :

### 1. `getCurrentAdmin()` - Ancien système (cookies)

**Fichier** : `lib/admin.ts` et `lib/adminAuth.ts`

**Type retourné** :
```typescript
export interface AdminUser {
  id: string;        // ← Utilise "id" (Discord ID)
  username: string;
  role: AdminRole;
}
```

**Utilisation** :
```typescript
const admin = await getCurrentAdmin();
// admin.id ✅ (correct)
// admin.discordId ❌ (n'existe pas)
```

**Fonctionnement** :
- Lit les cookies `discord_user_id` et `discord_username`
- Retourne un objet avec `id` (qui contient le Discord ID)
- Utilisé dans les anciennes routes API

---

### 2. `requireAdmin()` - Nouveau système (NextAuth)

**Fichier** : `lib/requireAdmin.ts`

**Type retourné** :
```typescript
export interface AuthenticatedAdmin {
  discordId: string;  // ← Utilise "discordId" explicitement
  username: string;
  avatar: string | null;
  role: AdminRole;
}
```

**Utilisation** :
```typescript
const admin = await requireAdmin();
// admin.discordId ✅ (correct)
// admin.id ❌ (n'existe pas)
```

**Fonctionnement** :
- Utilise NextAuth pour l'authentification
- Retourne un objet avec `discordId` explicitement
- Utilisé dans les nouvelles routes API migrées

---

## 🔄 Pourquoi Deux Systèmes ?

### Historique
1. **Ancien système** (`getCurrentAdmin`) : Basé sur des cookies non signés
2. **Nouveau système** (`requireAdmin`) : Basé sur NextAuth (plus sécurisé)

### Migration en cours
- Les nouvelles routes utilisent `requireAdmin()` avec `AuthenticatedAdmin`
- Les anciennes routes utilisent encore `getCurrentAdmin()` avec `AdminUser`

---

## ✅ Solution Appliquée

J'ai corrigé toutes les occurrences pour utiliser la bonne propriété selon la fonction utilisée :

### Fichiers utilisant `getCurrentAdmin()` → `admin.id`
- ✅ `app/api/discord-engagement/[month]/route.ts`
- ✅ `app/api/discord/members/sync/route.ts`
- ✅ `app/api/discord/raids/ignored/route.ts`
- ✅ `app/api/discord/raids/unmatched/delete-all/route.ts`
- ✅ `app/api/vip-month/save/route.ts`
- ✅ `app/api/vip-history/route.ts`
- ✅ `app/api/spotlight/*` (toutes les routes spotlight)
- ✅ `app/api/integrations/*` (toutes les routes integrations)
- ✅ Et 19 autres fichiers...

### Fichiers utilisant `requireAdmin()` → `admin.discordId`
- ✅ `app/api/admin/events/presence/route.ts`
- ✅ `app/api/admin/members/route.ts`
- ✅ `app/api/evaluations/*` (toutes les routes evaluations)
- ✅ Et autres routes migrées...

---

## 📊 Tableau Récapitulatif

| Fonction | Type Retourné | Propriété ID | Utilisation |
|----------|---------------|--------------|-------------|
| `getCurrentAdmin()` | `AdminUser` | `admin.id` | Anciennes routes (cookies) |
| `requireAdmin()` | `AuthenticatedAdmin` | `admin.discordId` | Nouvelles routes (NextAuth) |
| `requireSectionAccess()` | `AuthenticatedAdmin` | `admin.discordId` | Routes avec permissions section |

---

## 🎯 Recommandation Future

Pour éviter cette confusion à l'avenir, il serait idéal de :

1. **Migrer progressivement** toutes les routes vers `requireAdmin()`
2. **Déprécier** `getCurrentAdmin()` une fois la migration complète
3. **Unifier** les types pour avoir un seul système d'authentification

Mais pour l'instant, les deux systèmes coexistent et fonctionnent correctement avec les bonnes propriétés.

---

## 🔍 Comment Identifier Quelle Fonction Utiliser ?

### Si vous voyez :
```typescript
import { getCurrentAdmin } from '@/lib/admin';
```
→ Utiliser `admin.id`

### Si vous voyez :
```typescript
import { requireAdmin } from '@/lib/requireAdmin';
```
→ Utiliser `admin.discordId`

---

**Date de création** : $(date)  
**Statut** : ✅ Toutes les erreurs corrigées
