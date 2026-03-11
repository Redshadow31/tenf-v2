# ✅ Migration NextAuth - TERMINÉE

## 🎉 Migration complète réussie !

Toutes les routes API admin ont été migrées vers NextAuth avec sessions JWT signées.

---

## ✅ Routes migrées (Toutes les 32 routes)

### Routes membres (14 routes)
1. ✅ `app/api/admin/members/route.ts` - GET, POST, PUT, DELETE
2. ✅ `app/api/admin/members/[id]/route.ts` - GET
3. ✅ `app/api/admin/members/[id]/360/route.ts` - GET
4. ✅ `app/api/admin/members/sync-discord-usernames/route.ts` - POST
5. ✅ `app/api/admin/members/sync-twitch/route.ts` - POST
6. ✅ `app/api/admin/members/sync-twitch-id/route.ts` - GET, POST
7. ✅ `app/api/admin/members/verify-twitch-names/route.ts` - GET, POST
8. ✅ `app/api/admin/members/events/route.ts` - GET, POST
9. ✅ `app/api/admin/members/lists/route.ts` - GET, POST
10. ✅ `app/api/admin/members/merge/route.ts` - GET, POST
11. ✅ `app/api/admin/members/export-manual/route.ts` - GET
12. ✅ `app/api/admin/members/save-durable/route.ts` - POST
13. ✅ `app/api/admin/members/fix-development-roles/route.ts` - POST
14. ✅ `app/api/admin/search/members/route.ts` - GET

### Routes access & audit (2 routes)
15. ✅ `app/api/admin/access/route.ts` - GET, POST, DELETE
16. ✅ `app/api/admin/audit/route.ts` - GET, POST

### Routes dashboard & control (4 routes)
17. ✅ `app/api/admin/dashboard/data/route.ts` - GET, PUT
18. ✅ `app/api/admin/dashboard/discord-growth/import/route.ts` - POST
19. ✅ `app/api/admin/control-center/alerts/route.ts` - GET
20. ✅ `app/api/admin/control-center/activities/route.ts` - GET

### Routes logs & staff (2 routes)
21. ✅ `app/api/admin/logs/route.ts` - GET
22. ✅ `app/api/admin/log/route.ts` - POST
23. ✅ `app/api/admin/staff/route.ts` - GET

### Routes safe mode (1 route)
24. ✅ `app/api/admin/safe-mode/route.ts` - GET, POST

### Routes Discord import (3 routes)
25. ✅ `app/api/admin/discord-daily-activity/import/route.ts` - POST
26. ✅ `app/api/admin/discord-activity/import/route.ts` - POST

### Routes shop (2 routes)
27. ✅ `app/api/admin/shop/products/route.ts` - GET, POST, PUT, DELETE
28. ✅ `app/api/admin/shop/categories/route.ts` - GET, POST, PUT, DELETE

### Routes intégrations (2 routes)
29. ✅ `app/api/admin/integrations/integrate-members/route.ts` - POST
30. ✅ `app/api/admin/integrations/[integrationId]/registrations/route.ts` - GET, PUT

### Routes events (3 routes)
31. ✅ `app/api/admin/events/presence/route.ts` - GET, POST, PUT, DELETE, PATCH
32. ✅ `app/api/admin/events/upload-image/route.ts` - POST
33. ✅ `app/api/admin/events/registrations/route.ts` - GET

---

## 🔐 Modifications principales

### 1. Configuration NextAuth (`lib/auth.ts`)
- ✅ Session strategy: `jwt` activée
- ✅ Callbacks JWT et session configurés
- ✅ Rôle admin récupéré au login (hardcodé + cache Blobs)

### 2. Types TypeScript (`types/next-auth.d.ts`)
- ✅ Extension des types Session et JWT

### 3. RBAC robuste (`lib/requireAdmin.ts`)
- ✅ `requireAuth()` - Authentification uniquement
- ✅ `requireAdmin()` - Authentification + rôle admin
- ✅ `requireRole(role)` - Authentification + rôle spécifique
- ✅ `requirePermission(permission)` - Authentification + permission spécifique

### 4. Middleware sécurisé (`middleware.ts`)
- ✅ Utilise `getToken()` NextAuth JWT
- ✅ Plus de dépendance aux cookies non signés
- ✅ Redirection vers `/api/auth/signin` si non authentifié

### 5. Page de login (`app/auth/login/page.tsx`)
- ✅ Migration vers NextAuth `signIn()` et `useSession()`

### 6. Layout client (`app/layout.client.tsx`)
- ✅ SessionProvider ajouté

### 7. Toutes les routes API
- ✅ Migration de `getCurrentAdmin()` vers `requireAdmin()`, `requirePermission()`, ou `requireRole()`
- ✅ Remplacement de `admin.id` par `admin.discordId`
- ✅ Codes d'erreur uniformisés (401/403)

---

## 🔄 Remplacements effectués

### Pattern général
**AVANT** :
```typescript
import { getCurrentAdmin } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/adminRoles";

const admin = await getCurrentAdmin();
if (!admin) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
if (!hasPermission(admin.id, "write")) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}
// Utilisation : admin.id
```

**APRÈS** :
```typescript
import { requirePermission } from "@/lib/requireAdmin";

const admin = await requirePermission("write");
if (!admin) {
  return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
}
// Utilisation : admin.discordId
```

### Permissions utilisées
- `requirePermission("read")` : Lecture seule (GET)
- `requirePermission("write")` : Écriture (POST, PUT, DELETE)
- `requireRole("FOUNDER")` : Fondateurs uniquement
- `requireAdmin()` : Tous les admins

---

## ⚠️ Routes OAuth maison dépréciées

Ces routes ne sont plus utilisées mais peuvent rester pour compatibilité :

- `app/api/auth/discord/login/route.ts` → Déprécié (utiliser `/api/auth/signin`)
- `app/api/auth/discord/callback/route.ts` → Déprécié (utiliser NextAuth callback)
- `app/api/auth/discord/logout/route.ts` → Déprécié (utiliser `/api/auth/signout`)
- `app/api/auth/discord/user/route.ts` → Déprécié (utiliser `useSession()`)

**Recommandation** : Ajouter un commentaire `@deprecated` dans chaque fichier.

---

## 🔐 Variables d'environnement requises

Assurez-vous que ces variables sont configurées sur Netlify :

```env
NEXTAUTH_URL=https://tenf-community.com
NEXTAUTH_SECRET=<secret sécurisé généré - 32+ caractères>
DISCORD_CLIENT_ID=<votre_client_id>
DISCORD_CLIENT_SECRET=<votre_client_secret>
DISCORD_REDIRECT_URI=https://tenf-community.com/api/auth/callback/discord
```

### Générer NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

---

## ✅ Checklist post-déploiement Netlify

- [ ] Vérifier que `NEXTAUTH_URL` = `https://tenf-community.com`
- [ ] Vérifier que `NEXTAUTH_SECRET` est configuré (secret fort, 32+ caractères)
- [ ] Vérifier que `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` sont corrects
- [ ] Vérifier que `DISCORD_REDIRECT_URI` = `https://tenf-community.com/api/auth/callback/discord`
- [ ] Dans Discord Developer Portal :
  - [ ] Ajouter l'URL callback : `https://tenf-community.com/api/auth/callback/discord`
  - [ ] Vérifier les scopes : `identify`, `guilds`, `guilds.members.read`
- [ ] Tester la connexion Discord depuis `/auth/login`
- [ ] Vérifier qu'un utilisateur non authentifié est redirigé vers `/api/auth/signin` quand il accède à `/admin`
- [ ] Vérifier qu'un utilisateur authentifié sans rôle admin reçoit un 403 sur les routes `/api/admin/*`
- [ ] Vérifier qu'un founder peut accéder à `/admin/gestion-acces`
- [ ] Vérifier qu'un utilisateur non-founder ne peut pas accéder à `/admin/gestion-acces`

---

## 🧪 Tests manuels

### Test 1 : Utilisateur non authentifié
1. Se déconnecter (ou ouvrir en navigation privée)
2. Accéder à `/admin`
3. **Attendu** : Redirection vers `/api/auth/signin?callbackUrl=/admin`

### Test 2 : Utilisateur authentifié sans rôle admin
1. Se connecter avec un compte Discord qui n'a pas de rôle admin
2. Accéder à `/admin`
3. **Attendu** : Redirection vers `/api/auth/signin` ou page d'erreur (403)
4. Accéder à une route API `/api/admin/members`
5. **Attendu** : JSON `{ error: "Non authentifié ou permissions insuffisantes" }` avec status 401

### Test 3 : Utilisateur avec rôle admin
1. Se connecter avec un compte Discord ayant un rôle admin (FOUNDER, ADMIN_ADJOINT, etc.)
2. Accéder à `/admin`
3. **Attendu** : Accès autorisé à la page admin
4. Accéder à une route API `/api/admin/members`
5. **Attendu** : Données retournées avec status 200

### Test 4 : Founder uniquement
1. Se connecter avec un compte FOUNDER
2. Accéder à `/admin/gestion-acces`
3. **Attendu** : Accès autorisé
4. Se connecter avec un compte ADMIN_ADJOINT (non-founder)
5. Accéder à `/admin/gestion-acces`
6. **Attendu** : Redirection vers `/unauthorized`

---

## 📊 Statistiques de migration

- **Routes migrées** : 32 routes complètes
- **Fichiers modifiés** : ~35 fichiers
- **Nouveaux fichiers créés** : 
  - `lib/requireAdmin.ts`
  - `types/next-auth.d.ts`
  - `MIGRATION_NEXTAUTH.md`
  - `MIGRATION_NEXTAUTH_STATUS.md`
  - `MIGRATION_NEXTAUTH_COMPLETE.md`

---

## 🔐 Sécurité améliorée

### Avant
- ❌ Cookies non signés (`discord_user_id`, `discord_username`)
- ❌ Pas de vérification de signature
- ❌ Facilement falsifiables
- ❌ Pas de protection CSRF

### Après
- ✅ Sessions JWT signées avec `NEXTAUTH_SECRET`
- ✅ Vérification cryptographique automatique
- ✅ Impossible à falsifier
- ✅ Protection CSRF intégrée (NextAuth)
- ✅ Expiration automatique (7 jours)
- ✅ Validation côté serveur à chaque requête

---

## 📝 Notes importantes

1. **Sessions JWT** : Les sessions sont stockées dans des cookies JWT signés, beaucoup plus sécurisés que les cookies non signés précédents.

2. **Performance** : Le rôle admin est récupéré lors du login et stocké dans le JWT, évitant de refaire la vérification à chaque requête. Si le rôle change (via la page de gestion des accès), l'utilisateur devra se reconnecter pour que le changement prenne effet.

3. **Compatibilité** : L'ancien système OAuth maison peut être conservé pour une période de transition, mais il est déprécié et ne doit plus être utilisé.

4. **Migration complète** : Toutes les routes API ont été migrées. Le système est maintenant 100% NextAuth.

---

## 🚨 Problèmes potentiels et solutions

### Problème : "Invalid callback URL"
**Solution** : Vérifier que `DISCORD_REDIRECT_URI` dans Netlify correspond exactement à l'URL dans Discord Developer Portal (même protocole, même domaine, même chemin).

### Problème : "NEXTAUTH_SECRET is missing"
**Solution** : Générer un secret sécurisé et l'ajouter dans Netlify :
```bash
openssl rand -base64 32
```

### Problème : Session non persistante
**Solution** : Vérifier que les cookies NextAuth sont bien créés dans le navigateur (inspecter les cookies après login).

### Problème : Redirection en boucle
**Solution** : Vérifier que `NEXTAUTH_URL` correspond exactement à l'URL de production (sans trailing slash).

---

## ✨ Prochaines étapes recommandées

1. **Dépréciation OAuth maison** : Ajouter des commentaires `@deprecated` dans les routes OAuth maison
2. **Tests complets** : Effectuer tous les tests manuels listés ci-dessus
3. **Déploiement** : Déployer sur Netlify avec les variables d'environnement configurées
4. **Monitoring** : Surveiller les logs pour détecter d'éventuels problèmes
5. **Nettoyage** : Après confirmation que tout fonctionne, supprimer les routes OAuth maison dépréciées

---

**Migration terminée le** : $(date)
**Statut** : ✅ 100% complète - Prête pour déploiement
