# 🔐 Migration NextAuth - État d'avancement

## ✅ Routes complètement migrées (13 routes)

1. ✅ `app/api/admin/members/route.ts` - GET, POST, PUT, DELETE
2. ✅ `app/api/admin/access/route.ts` - GET, POST, DELETE
3. ✅ `app/api/admin/audit/route.ts` - GET, POST
4. ✅ `app/api/admin/dashboard/data/route.ts` - GET, PUT
5. ✅ `app/api/admin/search/members/route.ts` - GET
6. ✅ `app/api/admin/control-center/alerts/route.ts` - GET
7. ✅ `app/api/admin/control-center/activities/route.ts` - GET
8. ✅ `app/api/admin/logs/route.ts` - GET
9. ✅ `app/api/admin/staff/route.ts` - GET
10. ✅ `app/api/admin/safe-mode/route.ts` - GET, POST
11. ✅ `app/api/admin/members/[id]/route.ts` - GET
12. ✅ `app/api/admin/members/sync-discord-usernames/route.ts` - POST
13. ✅ `app/api/admin/events/presence/route.ts` - GET, POST, PUT, DELETE, PATCH
14. ✅ `app/api/admin/members/merge/route.ts` - GET, POST

## ⚠️ Routes restantes à migrer (19 routes)

### Routes membres (13 routes)
1. ⏳ `app/api/admin/members/[id]/360/route.ts` - GET
2. ⏳ `app/api/admin/members/verify-twitch-names/route.ts` - GET, POST
3. ⏳ `app/api/admin/members/sync-twitch/route.ts` - POST
4. ⏳ `app/api/admin/members/sync-twitch-id/route.ts` - GET, POST
5. ⏳ `app/api/admin/members/events/route.ts` - GET, POST
6. ⏳ `app/api/admin/members/lists/route.ts` - GET, POST
7. ⏳ `app/api/admin/members/export-manual/route.ts` - GET
8. ⏳ `app/api/admin/members/save-durable/route.ts` - POST
9. ⏳ `app/api/admin/members/fix-development-roles/route.ts` - POST

### Routes Discord/import (3 routes)
10. ⏳ `app/api/admin/discord-daily-activity/import/route.ts`
11. ⏳ `app/api/admin/discord-activity/import/route.ts`
12. ⏳ `app/api/admin/dashboard/discord-growth/import/route.ts`

### Routes shop (2 routes)
13. ⏳ `app/api/admin/shop/products/route.ts`
14. ⏳ `app/api/admin/shop/categories/route.ts`

### Routes intégrations (2 routes)
15. ⏳ `app/api/admin/integrations/integrate-members/route.ts`
16. ⏳ `app/api/admin/integrations/[integrationId]/registrations/route.ts`

### Routes events (2 routes)
17. ⏳ `app/api/admin/events/upload-image/route.ts`
18. ⏳ `app/api/admin/events/registrations/route.ts`

## 📝 Patterns de migration

### Pattern 1 : Permission "read"
```typescript
// AVANT
import { getCurrentAdmin } from "@/lib/adminAuth";
import { hasPermission } from "@/lib/adminRoles";

const admin = await getCurrentAdmin();
if (!admin) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
if (!hasPermission(admin.id, "read")) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

// APRÈS
import { requirePermission } from "@/lib/requireAdmin";

const admin = await requirePermission("read");
if (!admin) {
  return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
}
// admin.id devient admin.discordId
```

### Pattern 2 : Permission "write"
```typescript
// AVANT
const admin = await getCurrentAdmin();
if (!admin) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
if (!hasPermission(admin.id, "write")) {
  return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
}

// APRÈS
const admin = await requirePermission("write");
if (!admin) {
  return NextResponse.json({ error: "Non authentifié ou permissions insuffisantes" }, { status: 401 });
}
// admin.id devient admin.discordId
```

### Pattern 3 : Rôle FOUNDER
```typescript
// AVANT
import { getCurrentAdmin } from "@/lib/adminAuth";
import { isFounder } from "@/lib/adminRoles";

const admin = await getCurrentAdmin();
if (!admin) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
if (!isFounder(admin.id)) {
  return NextResponse.json({ error: "Accès refusé. Réservé aux fondateurs." }, { status: 403 });
}

// APRÈS
import { requireRole } from "@/lib/requireAdmin";

const admin = await requireRole("FOUNDER");
if (!admin) {
  return NextResponse.json({ error: "Non authentifié ou accès refusé. Réservé aux fondateurs." }, { status: 403 });
}
// admin.id devient admin.discordId
```

### Pattern 4 : Accès admin général
```typescript
// AVANT
import { getCurrentAdmin } from "@/lib/adminAuth";

const admin = await getCurrentAdmin();
if (!admin) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
// Vérification accès admin...

// APRÈS
import { requireAdmin } from "@/lib/requireAdmin";

const admin = await requireAdmin();
if (!admin) {
  return NextResponse.json({ error: "Non authentifié ou accès refusé" }, { status: 401 });
}
// admin.id devient admin.discordId
```

## 🔄 Remplacements à effectuer

Dans toutes les routes migrées :
- `admin.id` → `admin.discordId` (partout où utilisé)
- `getCurrentAdmin()` → `requireAdmin()`, `requirePermission()`, ou `requireRole()` selon le besoin

## ⚡ Commandes utiles

```bash
# Trouver toutes les routes utilisant encore getCurrentAdmin
grep -r "getCurrentAdmin" app/api/admin --files-with-matches

# Trouver toutes les références admin.id
grep -r "admin\.id" app/api/admin --files-with-matches

# Compter les fichiers restants
grep -r "getCurrentAdmin" app/api/admin --files-with-matches | wc -l
```

---

**Dernière mise à jour** : Migration en cours - 13 routes complètes, 19 restantes
