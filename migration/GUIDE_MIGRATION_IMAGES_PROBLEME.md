# 🔧 Guide : Résoudre le Problème des Images d'Événements

**Date** : $(date)  
**Problème** : Les images ne s'affichent plus sur `/events` après migration Netlify Blobs → Supabase Storage

---

## 🔍 Diagnostic

### Problème Identifié

Les images d'événements sont stockées dans Supabase Storage, mais :
1. Les URLs dans la base de données pointent peut-être encore vers Netlify Blobs
2. La route API `/api/admin/events/images/[fileName]` fonctionne mais les URLs ne sont peut-être pas correctes
3. Les images existantes n'ont peut-être pas été migrées depuis Netlify Blobs

---

## ✅ Solutions

### Solution 1 : Vérifier les URLs dans la Base de Données

Les événements stockent l'URL de l'image dans le champ `image` de la table `events`.

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT id, title, image FROM events WHERE image IS NOT NULL LIMIT 10;
```

**Problème possible** :
- Les URLs pointent vers `/api/admin/events/images/[fileName]` (correct)
- OU vers l'ancien système Netlify Blobs (à corriger)

**Correction** :
Si les URLs sont incorrectes, les mettre à jour :
```sql
-- Mettre à jour les URLs pour pointer vers la route API
UPDATE events 
SET image = '/api/admin/events/images/' || SPLIT_PART(image, '/', -1)
WHERE image LIKE '%blobs%' OR image LIKE '%netlify%';
```

---

### Solution 2 : Vérifier que les Images Existent dans Supabase Storage

**Vérification** :
1. Aller dans Supabase Dashboard → Storage → `events-images`
2. Vérifier que les fichiers existent

**Si les images n'existent pas** :
- Il faut migrer les images depuis Netlify Blobs vers Supabase Storage
- Voir la section "Migration des Images" ci-dessous

---

### Solution 3 : Vérifier la Route API

La route `/api/admin/events/images/[fileName]` doit :
1. Récupérer l'image depuis Supabase Storage
2. Retourner l'image avec le bon Content-Type

**Test** :
```bash
# Tester avec un fileName existant
curl https://teamnewfamily.netlify.app/api/admin/events/images/event-1234567890-abc123.jpg
```

**Si erreur 404** :
- L'image n'existe pas dans Supabase Storage
- Il faut la migrer

---

## 🔄 Migration des Images depuis Netlify Blobs

### Étape 1 : Lister les Images dans Netlify Blobs

Créer un script pour lister toutes les images :

```typescript
// migration/list-images-blobs.ts
import { getStore } from '@netlify/blobs';

async function listImages() {
  const store = getStore('tenf-events-images'); // Nom du store Netlify Blobs
  const list = await store.list();
  
  console.log('Images trouvées:', list.blobs.length);
  list.blobs.forEach(blob => {
    console.log(`- ${blob.key}`);
  });
  
  return list.blobs;
}
```

### Étape 2 : Migrer les Images vers Supabase Storage

```typescript
// migration/migrate-images-to-supabase.ts
import { getStore } from '@netlify/blobs';
import { supabaseAdmin } from '@/lib/db/supabase';

async function migrateImages() {
  const blobStore = getStore('tenf-events-images');
  const list = await blobStore.list();
  
  for (const blob of list.blobs) {
    try {
      // Récupérer l'image depuis Netlify Blobs
      const imageData = await blobStore.get(blob.key, { type: 'blob' });
      
      if (!imageData) {
        console.warn(`Image ${blob.key} non trouvée dans Blobs`);
        continue;
      }
      
      // Upload vers Supabase Storage
      const { data, error } = await supabaseAdmin.storage
        .from('events-images')
        .upload(blob.key, imageData, {
          contentType: blob.metadata?.contentType || 'image/jpeg',
          upsert: true, // Écraser si existe déjà
        });
      
      if (error) {
        console.error(`Erreur upload ${blob.key}:`, error);
      } else {
        console.log(`✅ ${blob.key} migré avec succès`);
      }
    } catch (error) {
      console.error(`Erreur migration ${blob.key}:`, error);
    }
  }
}
```

### Étape 3 : Mettre à Jour les URLs dans la Base de Données

Après migration, mettre à jour les URLs :

```sql
-- Mettre à jour les URLs pour pointer vers la route API
UPDATE events 
SET image = '/api/admin/events/images/' || SPLIT_PART(image, '/', -1)
WHERE image IS NOT NULL;
```

---

## 🔍 Vérification

### 1. Vérifier qu'une Image Existe dans Supabase Storage

```sql
-- Dans Supabase SQL Editor
SELECT 
  name,
  bucket_id,
  created_at,
  metadata
FROM storage.objects
WHERE bucket_id = 'events-images'
LIMIT 10;
```

### 2. Tester la Route API

```bash
# Remplacer [fileName] par un nom de fichier réel
curl -I https://teamnewfamily.netlify.app/api/admin/events/images/[fileName]
```

**Résultat attendu** : `200 OK` avec `Content-Type: image/jpeg` (ou autre)

### 3. Vérifier les URLs dans la Base de Données

```sql
SELECT id, title, image 
FROM events 
WHERE image IS NOT NULL 
LIMIT 5;
```

**Format attendu** : `/api/admin/events/images/event-1234567890-abc123.jpg`

---

## 🐛 Problèmes Courants

### Problème 1 : Erreur 404 sur `/api/admin/events/images/[fileName]`

**Cause** : L'image n'existe pas dans Supabase Storage

**Solution** :
1. Vérifier que le bucket `events-images` existe
2. Vérifier que l'image existe dans le bucket
3. Migrer l'image depuis Netlify Blobs si nécessaire

---

### Problème 2 : Erreur 500 sur la Route API

**Cause** : Problème de configuration Supabase ou permissions

**Solution** :
1. Vérifier les variables d'environnement Supabase
2. Vérifier les permissions RLS du bucket
3. Vérifier les logs serveur

---

### Problème 3 : Images Affichées mais Cassees

**Cause** : URL incorrecte ou Content-Type incorrect

**Solution** :
1. Vérifier que l'URL pointe vers `/api/admin/events/images/[fileName]`
2. Vérifier que le Content-Type est correct dans la route API
3. Vérifier la console du navigateur pour les erreurs

---

## 📝 Checklist de Vérification

- [ ] Les images existent dans Supabase Storage (`events-images` bucket)
- [ ] Les URLs dans la table `events` pointent vers `/api/admin/events/images/[fileName]`
- [ ] La route API `/api/admin/events/images/[fileName]` fonctionne
- [ ] Les permissions RLS du bucket sont correctes
- [ ] Les variables d'environnement Supabase sont configurées
- [ ] Les images sont accessibles publiquement (ou via la route API)

---

## 🚀 Actions Immédiates

1. **Vérifier les URLs dans la DB** :
   ```sql
   SELECT id, title, image FROM events WHERE image IS NOT NULL;
   ```

2. **Vérifier les images dans Supabase Storage** :
   - Dashboard Supabase → Storage → `events-images`

3. **Tester une image** :
   - Prendre un `fileName` d'un événement
   - Tester : `https://teamnewfamily.netlify.app/api/admin/events/images/[fileName]`

4. **Si les images n'existent pas** :
   - Créer le script de migration
   - Migrer les images depuis Netlify Blobs

---

**Dernière mise à jour** : $(date)
