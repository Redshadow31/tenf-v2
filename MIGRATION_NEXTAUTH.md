# 🔐 Migration vers NextAuth - Documentation

## ✅ Modifications effectuées

### 1. Configuration NextAuth (`lib/auth.ts`)
- ✅ Session strategy: `jwt` activée
- ✅ Callbacks JWT et session configurés pour inclure `discordId`, `username`, `avatar`, et `role`
- ✅ Récupération du rôle admin (hardcodé + cache Blobs) lors du login
- ✅ Pages personnalisées: `/auth/login` pour signin

### 2. Types TypeScript (`types/next-auth.d.ts`)
- ✅ Extension des types `Session` et `JWT` pour inclure les champs Discord personnalisés

### 3. Système RBAC robuste (`lib/requireAdmin.ts`)
- ✅ `getAuthenticatedAdmin()`: Récupère l'admin authentifié via NextAuth
- ✅ `requireAuth()`: Exige une authentification valide (retourne 401 si non)
- ✅ `requireAdmin()`: Exige un rôle admin (retourne 403 si non)
- ✅ `requireRole(role)`: Exige un rôle spécifique (FOUNDER, ADMIN_ADJOINT, etc.)
- ✅ `requirePermission(permission)`: Exige une permission spécifique (read, write, validate, etc.)
- ✅ `checkPermission()`: Vérifie une permission (retourne bool, utile pour UI)

### 4. Middleware sécurisé (`middleware.ts`)
- ✅ Migration vers `getToken()` de NextAuth JWT
- ✅ Vérification du token JWT au lieu des cookies non signés
- ✅ Redirection vers `/api/auth/signin` si non authentifié
- ✅ Protection spéciale pour `/admin/gestion-acces` (réservé aux FOUNDER)

### 5. Route API exemple migrée (`app/api/admin/members/route.ts`)
- ✅ GET, POST, PUT, DELETE utilisent maintenant `requireAdmin()` ou `requirePermission()`
- ✅ Remplacement de `getCurrentAdmin()` par `requireAdmin()`

### 6. Page de login (`app/auth/login/page.tsx`)
- ✅ Migration vers NextAuth `signIn()` et `useSession()`
- ✅ Remplacement de l'OAuth maison par NextAuth
- ✅ Gestion du callbackUrl pour redirection après login

### 7. Layout client (`app/layout.client.tsx`)
- ✅ Ajout du `SessionProvider` de NextAuth pour permettre l'utilisation de `useSession()` dans tout l'app

---

## ⚠️ À FAIRE : Migration complète des routes API

### Routes API restantes à migrer (32 fichiers)

Les routes suivantes utilisent encore `getCurrentAdmin()` de `lib/adminAuth.ts` et doivent être migrées vers `requireAdmin()` ou `requirePermission()` :

```
app/api/admin/search/members/route.ts
app/api/admin/members/[id]/360/route.ts
app/api/admin/members/[id]/route.ts
app/api/admin/access/route.ts
app/api/admin/audit/route.ts
app/api/admin/control-center/alerts/route.ts
app/api/admin/control-center/activities/route.ts
app/api/admin/safe-mode/route.ts
app/api/admin/discord-daily-activity/import/route.ts
app/api/admin/discord-daily-activity/data/route.ts
app/api/admin/members/sync-discord-usernames/route.ts
app/api/admin/discord-activity/data/route.ts
app/api/admin/logs/route.ts
app/api/admin/discord-activity/import/route.ts
app/api/admin/dashboard/discord-growth/import/route.ts
app/api/admin/dashboard/data/route.ts
app/api/admin/events/presence/route.ts
app/api/admin/members/verify-twitch-names/route.ts
app/api/admin/shop/products/route.ts
app/api/admin/shop/categories/route.ts
app/api/admin/integrations/integrate-members/route.ts
app/api/admin/integrations/[integrationId]/registrations/route.ts
app/api/admin/events/upload-image/route.ts
app/api/admin/events/registrations/route.ts
app/api/admin/members/events/route.ts
app/api/admin/staff/route.ts
app/api/admin/members/sync-twitch-id/route.ts
app/api/admin/members/merge/route.ts
app/api/admin/members/save-durable/route.ts
app/api/admin/members/sync-twitch/route.ts
app/api/admin/members/export-manual/route.ts
app/api/admin/members/fix-development-roles/route.ts
app/api/admin/members/lists/route.ts
```

### Pattern de migration

**Avant (cookies non signés)** :
```typescript
import { getCurrentAdmin } from "@/lib/adminAuth";

export async function GET() {
  const admin = await getCurrentAdmin();
  
  if (!admin) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  
  // Vérification permission manuelle
  if (!hasPermission(admin.id, "read")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  
  // ...
}
```

**Après (NextAuth JWT)** :
```typescript
import { requirePermission } from "@/lib/requireAdmin";

export async function GET() {
  // Authentification + permission en une seule ligne
  const admin = await requirePermission("read");
  
  if (!admin) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  
  // admin est garanti d'avoir la permission "read"
  // ...
}
```

---

## 🔄 Dépréciation de l'OAuth maison

### Routes à désactiver/déprécier

Les routes suivantes ne sont plus utilisées mais peuvent rester pour compatibilité :

```
app/api/auth/discord/login/route.ts    → Déprécié (utiliser /api/auth/signin)
app/api/auth/discord/callback/route.ts → Déprécié (utiliser NextAuth callback)
app/api/auth/discord/logout/route.ts   → Déprécié (utiliser /api/auth/signout)
app/api/auth/discord/user/route.ts     → Déprécié (utiliser useSession())
```

**Option recommandée** : Ajouter un commentaire de dépréciation dans chaque fichier :
```typescript
/**
 * @deprecated Utiliser NextAuth à la place
 * Cette route est maintenue pour compatibilité mais ne doit plus être utilisée
 */
```

---

## 🔐 Variables d'environnement requises

Assurez-vous que ces variables sont configurées sur Netlify :

```
NEXTAUTH_URL=https://teamnewfamily.netlify.app
NEXTAUTH_SECRET=<secret sécurisé généré>
DISCORD_CLIENT_ID=<votre_client_id>
DISCORD_CLIENT_SECRET=<votre_client_secret>
DISCORD_REDIRECT_URI=https://teamnewfamily.netlify.app/api/auth/discord/callback
```

---

## ✅ Checklist post-déploiement Netlify

Après le déploiement sur Netlify :

- [ ] Vérifier que `NEXTAUTH_URL` est configuré et correspond à l'URL du site
- [ ] Vérifier que `NEXTAUTH_SECRET` est configuré (secret fort, 32+ caractères)
- [ ] Vérifier que `DISCORD_CLIENT_ID` et `DISCORD_CLIENT_SECRET` sont corrects
- [ ] Vérifier que `DISCORD_REDIRECT_URI` correspond exactement à l'URL du callback NextAuth
- [ ] Dans Discord Developer Portal, vérifier que l'URL de callback est bien configurée :
  ```
  https://teamnewfamily.netlify.app/api/auth/callback/discord
  ```
- [ ] Tester la connexion Discord depuis `/auth/login`
- [ ] Vérifier qu'un utilisateur non authentifié est redirigé vers `/api/auth/signin` quand il accède à `/admin`
- [ ] Vérifier qu'un utilisateur authentifié sans rôle admin reçoit un 403 sur les routes `/api/admin/*`
- [ ] Vérifier qu'un founder peut accéder à `/admin/gestion-acces`
- [ ] Vérifier qu'un utilisateur non-founder ne peut pas accéder à `/admin/gestion-acces`

---

## 🧪 Tests manuels à effectuer

### Test 1 : Utilisateur non authentifié
1. Se déconnecter (ou ouvrir en navigation privée)
2. Accéder à `/admin`
3. **Attendu** : Redirection vers `/api/auth/signin?callbackUrl=/admin`

### Test 2 : Utilisateur authentifié sans rôle admin
1. Se connecter avec un compte Discord qui n'a pas de rôle admin
2. Accéder à `/admin`
3. **Attendu** : Redirection vers `/api/auth/signin` ou page d'erreur (403)
4. Accéder à une route API `/api/admin/members`
5. **Attendu** : JSON `{ error: "Non authentifié" }` avec status 401

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

## 📝 Notes importantes

1. **Sessions JWT** : Les sessions sont stockées dans des cookies JWT signés, beaucoup plus sécurisés que les cookies non signés précédents.

2. **Performance** : Le rôle admin est récupéré lors du login et stocké dans le JWT, évitant de refaire la vérification à chaque requête. Si le rôle change (via la page de gestion des accès), l'utilisateur devra se reconnecter pour que le changement prenne effet.

3. **Compatibilité** : L'ancien système OAuth maison peut être conservé pour une période de transition, mais il est déprécié et ne doit plus être utilisé.

4. **Migration progressive** : Les routes API peuvent être migrées progressivement. Le middleware protégera déjà toutes les routes `/admin`, mais les routes API individuelles doivent être migrées pour utiliser `requireAdmin()`.

---

## 🚨 Problèmes potentiels

### Problème : "Invalid callback URL"
**Solution** : Vérifier que `DISCORD_REDIRECT_URI` dans Netlify correspond exactement à l'URL dans Discord Developer Portal (même protocole, même domaine, même chemin).

### Problème : "NEXTAUTH_SECRET is missing"
**Solution** : Générer un secret sécurisé et l'ajouter dans Netlify :
```bash
openssl rand -base64 32
```

### Problème : Session non persistante
**Solution** : Vérifier que les cookies NextAuth sont bien créés dans le navigateur (inspecter les cookies après login).

---

**Dernière mise à jour** : Migration NextAuth - Étape 1 complétée (infrastructure + exemple)
