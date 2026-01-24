# 🔧 Correction : Liste de Membres Vide sur Page Discord

**Date** : $(date)  
**Page** : `/admin/evaluation/b/discord`  
**Problème** : La liste de membres ne s'affiche plus sur la page Discord

---

## 🔍 Diagnostic

### Problème Identifié

1. **Route `/api/members/public`** :
   - Ne retournait pas le champ `isActive` dans la réponse
   - La page Discord filtre avec `m.isActive !== false && m.discordId`
   - Sans `isActive`, le filtre ne peut pas fonctionner correctement

2. **Filtre côté client** :
   - La page filtre les membres avec `m.isActive !== false && m.discordId`
   - Si aucun membre n'a de `discordId`, aucun membre ne sera affiché
   - Pas de logs pour déboguer le problème

---

## ✅ Corrections Effectuées

### 1. Route `/api/members/public`

**Fichier** : `app/api/members/public/route.ts`

**Changement** : Ajout du champ `isActive` dans la réponse

```typescript
return {
  twitchLogin: member.twitchLogin,
  twitchUrl: member.twitchUrl,
  displayName: member.displayName || member.siteUsername || member.twitchLogin,
  role: member.role,
  isVip: member.isVip,
  isActive: member.isActive, // ✅ AJOUTÉ
  vipBadge: vipBadge,
  badges: member.badges || [],
  discordId: member.discordId,
  discordUsername: member.discordUsername,
  avatar: avatar,
  description: description,
  createdAt: member.createdAt ? member.createdAt.toISOString() : undefined,
};
```

### 2. Page Discord - Logs de Débogage

**Fichier** : `app/admin/evaluation/b/discord/page.tsx`

**Changements** :
- Ajout de logs console pour déboguer le chargement des membres
- Séparation du filtre en étapes pour identifier où les membres sont perdus
- Logs pour chaque étape du filtrage

```typescript
console.log('[Discord Page] Membres reçus de l\'API:', data.members?.length || 0);

// Filtrer les membres actifs avec Discord ID
const allMembers = data.members || [];
const membersWithDiscord = allMembers.filter((m: any) => m.discordId);
const activeMembersWithDiscord = membersWithDiscord.filter((m: any) => m.isActive !== false);

console.log('[Discord Page] Membres avec Discord ID:', membersWithDiscord.length);
console.log('[Discord Page] Membres actifs avec Discord ID:', activeMembersWithDiscord.length);
console.log('[Discord Page] Membres finaux après mapping:', members.length);
```

---

## 🧪 Tests à Effectuer

### 1. Vérifier la Console Navigateur

1. Ouvrir `/admin/evaluation/b/discord`
2. Ouvrir la console du navigateur (F12)
3. Vérifier les logs :
   - `[Discord Page] Membres reçus de l'API: X`
   - `[Discord Page] Membres avec Discord ID: X`
   - `[Discord Page] Membres actifs avec Discord ID: X`
   - `[Discord Page] Membres finaux après mapping: X`

### 2. Vérifier la Route API

```bash
npm run test:routes-evaluation-d
```

Ou directement :

```bash
curl http://localhost:3000/api/members/public
```

Vérifier que :
- La réponse contient `members` (array)
- Chaque membre a `isActive` (boolean)
- Chaque membre a `discordId` (string ou undefined)

### 3. Vérifier la Base de Données

Si aucun membre n'a de `discordId`, c'est normal qu'aucun membre ne s'affiche sur la page Discord.

Vérifier dans Supabase :

```sql
SELECT 
  twitch_login,
  display_name,
  discord_id,
  is_active
FROM members
WHERE is_active = true
LIMIT 10;
```

---

## 🔍 Causes Possibles

### 1. Aucun Membre avec Discord ID

Si aucun membre actif n'a de `discordId` dans la base de données, aucun membre ne sera affiché.

**Solution** : Vérifier que les membres ont bien un `discord_id` dans Supabase.

### 2. Cache Redis Obsolète

Le cache Redis pourrait retourner des données obsolètes ou vides.

**Solution** : Invalider le cache Redis ou attendre l'expiration du TTL (5 minutes pour les membres actifs).

### 3. Problème de Migration

Si les données n'ont pas été correctement migrées depuis Netlify Blobs vers Supabase, certains champs peuvent être manquants.

**Solution** : Vérifier que la migration des membres a été complétée.

---

## 📝 Notes

- La route `/api/members/public` utilise `memberRepository.findActive(1000, 0)` qui filtre déjà les membres actifs
- Le filtre `m.isActive !== false` dans la page est redondant mais nécessaire pour la compatibilité
- Le filtre `m.discordId` est nécessaire car la page Discord ne peut évaluer que les membres avec un Discord ID

---

## ✅ Statut

- ✅ Route `/api/members/public` corrigée (ajout de `isActive`)
- ✅ Logs de débogage ajoutés à la page Discord
- ⏳ Tests à effectuer en production après déploiement

---

**Prochaine étape** : Déployer les corrections et vérifier les logs dans la console du navigateur.
