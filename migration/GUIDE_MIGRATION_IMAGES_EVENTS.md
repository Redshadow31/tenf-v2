# 📸 Guide de Migration - Images d'Événements vers Supabase Storage

Ce guide détaille étape par étape la migration des routes d'images d'événements de Netlify Blobs vers Supabase Storage.

---

## 🎯 Objectif

Migrer les 2 routes suivantes :
- `/api/admin/events/upload-image` - Upload d'image
- `/api/admin/events/images/[fileName]` - Récupération d'image

---

## 📋 Étape 1 : Configuration Supabase Storage

### 1.1 Créer le Bucket

1. Connectez-vous à votre tableau de bord Supabase
2. Allez dans **Storage** → **Buckets**
3. Cliquez sur **New bucket**
4. Configurez :
   - **Name** : `events-images`
   - **Public bucket** : ✅ Activé (pour permettre l'accès public aux images)
   - **File size limit** : 5 MB (ou selon vos besoins)
   - **Allowed MIME types** : `image/*` (ou types spécifiques)

### 1.2 Configurer les Permissions

**Option 1 : Bucket Public (Recommandé pour les images d'événements)**

Si le bucket est public, les images seront accessibles directement via URL publique.

**Option 2 : Politiques RLS (Row Level Security)**

Si vous voulez plus de contrôle, créez des politiques :

```sql
-- Politique pour permettre la lecture publique
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'events-images');

-- Politique pour permettre l'upload aux admins authentifiés
CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events-images' 
  AND auth.role() = 'authenticated'
  -- Ajoutez votre logique de vérification admin ici
);
```

---

## 📋 Étape 2 : Migration de la Route Upload

### 2.1 Modifier `app/api/admin/events/upload-image/route.ts`

**Avant** (Netlify Blobs) :
```typescript
import { getStore } from '@netlify/blobs';

const store = getStore('tenf-events-images');
await store.set(fileName, arrayBuffer, {
  metadata: { ... }
});
```

**Après** (Supabase Storage) :
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

// Convertir ArrayBuffer en Blob
const blob = new Blob([arrayBuffer], { type: file.type });

// Upload vers Supabase Storage
const { data, error } = await supabaseAdmin.storage
  .from('events-images')
  .upload(fileName, blob, {
    contentType: file.type,
    upsert: true, // Remplacer si existe déjà
    metadata: {
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      uploadedBy: admin.discordId,
    },
  });

if (error) {
  throw new Error(`Erreur upload: ${error.message}`);
}

// Récupérer l'URL publique
const { data: { publicUrl } } = supabaseAdmin.storage
  .from('events-images')
  .getPublicUrl(fileName);
```

### 2.2 Code Complet Migré

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireSectionAccess('/admin/events/planification');
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    // Vérifications (type, taille)
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Le fichier doit être une image' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'L\'image ne doit pas dépasser 5MB' }, { status: 400 });
    }

    // Convertir en ArrayBuffer puis Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `event-${timestamp}-${randomStr}.${extension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('events-images')
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: true,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: admin.discordId,
        },
      });

    if (error) {
      console.error('[Event Image Upload] Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload', details: error.message },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('events-images')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl, // URL publique Supabase
      fileName,
    });
  } catch (error) {
    console.error('[Event Image Upload API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
```

---

## 📋 Étape 3 : Migration de la Route Récupération

### 3.1 Modifier `app/api/admin/events/images/[fileName]/route.ts`

**Avant** (Netlify Blobs) :
```typescript
import { getStore } from '@netlify/blobs';

const store = getStore('tenf-events-images');
const image = await store.get(fileName, { type: 'blob' });
```

**Après** (Supabase Storage) :
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

const { data, error } = await supabaseAdmin.storage
  .from('events-images')
  .download(fileName);

if (error) {
  return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
}
```

### 3.2 Code Complet Migré

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;

    if (!fileName) {
      return NextResponse.json({ error: 'Nom de fichier requis' }, { status: 400 });
    }

    // Récupérer l'image depuis Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('events-images')
      .download(fileName);

    if (error) {
      console.error('[Event Image API] Erreur Supabase:', error);
      return NextResponse.json({ error: 'Image non trouvée' }, { status: 404 });
    }

    // Déterminer le Content-Type depuis l'extension
    let contentType = 'image/jpeg';
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'png': contentType = 'image/png'; break;
      case 'gif': contentType = 'image/gif'; break;
      case 'webp': contentType = 'image/webp'; break;
      case 'svg': contentType = 'image/svg+xml'; break;
      default: contentType = 'image/jpeg';
    }

    // Essayer de récupérer le Content-Type depuis les métadonnées
    try {
      const { data: fileData } = await supabaseAdmin.storage
        .from('events-images')
        .list(fileName.split('/').slice(0, -1).join('/') || '', {
          search: fileName.split('/').pop(),
        });
      
      if (fileData && fileData[0]?.metadata?.contentType) {
        contentType = fileData[0].metadata.contentType;
      }
    } catch (metadataError) {
      // Utiliser le type déterminé par l'extension
      console.warn('[Event Image API] Impossible de récupérer les métadonnées:', metadataError);
    }

    // Convertir Blob en ArrayBuffer pour NextResponse
    const arrayBuffer = await data.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Event Image API] Erreur GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
```

---

## 📋 Étape 4 : Migration des Images Existantes

### 4.1 Script de Migration

Créez `migration/migrate-event-images.ts` :

```typescript
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getStore } from '@netlify/blobs';
import { supabaseAdmin } from '../lib/db/supabase';

async function migrateImages() {
  console.log('🚀 Démarrage de la migration des images d\'événements...\n');

  try {
    // 1. Lister toutes les images dans Netlify Blobs
    const store = getStore('tenf-events-images');
    const { blobs } = await store.list();

    console.log(`📦 ${blobs.length} image(s) trouvée(s) dans Netlify Blobs\n`);

    let successCount = 0;
    let errorCount = 0;

    // 2. Migrer chaque image
    for (const blob of blobs) {
      try {
        console.log(`📤 Migration de ${blob.key}...`);

        // Télécharger depuis Netlify Blobs
        const imageData = await store.get(blob.key, { type: 'blob' });
        if (!imageData) {
          console.log(`⚠️  Image ${blob.key} introuvable, ignorée`);
          continue;
        }

        // Upload vers Supabase Storage
        const { data, error } = await supabaseAdmin.storage
          .from('events-images')
          .upload(blob.key, imageData, {
            contentType: blob.metadata?.contentType || 'image/jpeg',
            upsert: true,
            metadata: blob.metadata || {},
          });

        if (error) {
          console.error(`❌ Erreur pour ${blob.key}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ ${blob.key} migrée avec succès`);
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ Erreur pour ${blob.key}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 RÉSULTATS DE LA MIGRATION');
    console.log('============================================================');
    console.log(`✅ Succès: ${successCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📊 Total: ${blobs.length}`);
    console.log('============================================================\n');
  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

migrateImages();
```

### 4.2 Exécuter la Migration

```bash
npx tsx migration/migrate-event-images.ts
```

---

## 📋 Étape 5 : Tests

### 5.1 Test d'Upload

```bash
curl -X POST "http://localhost:3000/api/admin/events/upload-image" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -F "image=@test-image.jpg"
```

**Attendu** : `200 OK` avec `imageUrl` (URL Supabase)

### 5.2 Test de Récupération

```bash
curl "http://localhost:3000/api/admin/events/images/event-1234567890-abc123.jpg"
```

**Attendu** : Image retournée avec headers corrects

---

## ✅ Checklist de Migration

- [ ] Bucket Supabase Storage `events-images` créé
- [ ] Permissions configurées (public read, admin write)
- [ ] Route `/api/admin/events/upload-image` migrée
- [ ] Route `/api/admin/events/images/[fileName]` migrée
- [ ] Script de migration des images existantes créé
- [ ] Images existantes migrées
- [ ] Tests d'upload réussis
- [ ] Tests de récupération réussis
- [ ] Code legacy nettoyé (imports Netlify Blobs supprimés)
- [ ] Documentation mise à jour

---

## 🎯 Résultat Final

Une fois la migration terminée :
- ✅ Les images sont stockées dans Supabase Storage
- ✅ Les URLs publiques sont générées automatiquement
- ✅ Plus de dépendance à Netlify Blobs pour les images
- ✅ Migration complète à 100% !

---

**Date de création** : $(date)
