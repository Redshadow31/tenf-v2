# 🎯 Plan de Finalisation - Migration V3

**Date** : $(date)  
**Statut actuel** : 94% complété (29/31 routes migrées)  
**Objectif** : Finaliser la migration à 100%

---

## 📊 État Actuel

### ✅ Routes Migrées (29/31 - 94%)

- ✅ **Routes Évaluations** : 8/8 (100%)
- ✅ **Routes Spotlight** : 11/11 (100%)
- ✅ **Routes Événements** : 4/6 (66%)
- ✅ **Routes Membres** : 3/3 (100%)
- ✅ **Routes VIP** : 1/1 (100%)
- ✅ **Routes Stats/Home** : 2/2 (100%)

### ⏳ Routes Restantes (2/31 - 6%)

#### Routes Événements - Images (2 routes)
1. `/api/admin/events/upload-image` - Upload d'image d'événement
2. `/api/admin/events/images/[fileName]` - Récupération d'image d'événement

**Complexité** : ÉLEVÉE (nécessite Supabase Storage)  
**Priorité** : MOYENNE (optionnel, peut être fait plus tard)

---

## 🎯 Plan de Finalisation

### Phase 1 : Routes d'Images d'Événements (Optionnel)

#### Étape 1.1 : Configuration Supabase Storage

**Objectif** : Configurer un bucket Supabase Storage pour les images d'événements

**Actions** :
1. Se connecter au tableau de bord Supabase
2. Aller dans **Storage** → **Buckets**
3. Créer un nouveau bucket nommé `events-images`
4. Configurer les permissions :
   - **Public** : Lecture seule (pour afficher les images)
   - **Authentifié** : Écriture (pour les admins)
5. Configurer les politiques RLS (Row Level Security) si nécessaire

**Documentation** : 
- Guide Supabase Storage : https://supabase.com/docs/guides/storage
- Configuration RLS : https://supabase.com/docs/guides/storage/security/access-control

#### Étape 1.2 : Migration de la Route Upload

**Fichier** : `app/api/admin/events/upload-image/route.ts`

**Actions** :
1. Remplacer `getStore('tenf-events-images')` par Supabase Storage
2. Utiliser `supabaseAdmin.storage.from('events-images').upload()`
3. Gérer les erreurs et la validation
4. Retourner l'URL publique de l'image

**Code de référence** :
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

// Upload
const { data, error } = await supabaseAdmin.storage
  .from('events-images')
  .upload(fileName, fileBuffer, {
    contentType: fileType,
    upsert: true
  });

// Récupérer l'URL publique
const { data: { publicUrl } } = supabaseAdmin.storage
  .from('events-images')
  .getPublicUrl(fileName);
```

#### Étape 1.3 : Migration de la Route Récupération

**Fichier** : `app/api/admin/events/images/[fileName]/route.ts`

**Actions** :
1. Remplacer `getStore('tenf-events-images')` par Supabase Storage
2. Utiliser `supabaseAdmin.storage.from('events-images').download()`
3. Retourner le fichier avec les bons headers

**Code de référence** :
```typescript
import { supabaseAdmin } from '@/lib/db/supabase';

const { data, error } = await supabaseAdmin.storage
  .from('events-images')
  .download(fileName);

if (error) {
  return new NextResponse('Image not found', { status: 404 });
}

return new NextResponse(data, {
  headers: {
    'Content-Type': 'image/jpeg', // ou le type approprié
  },
});
```

#### Étape 1.4 : Migration des Images Existantes

**Script** : `migration/migrate-event-images.ts`

**Actions** :
1. Lister toutes les images dans Netlify Blobs (`tenf-events-images`)
2. Pour chaque image :
   - Télécharger depuis Netlify Blobs
   - Uploader vers Supabase Storage
   - Vérifier l'upload
3. Logger les résultats

**Note** : Ce script peut être exécuté une seule fois pour migrer les images existantes.

---

### Phase 2 : Vérification et Tests

#### Étape 2.1 : Tests des Routes d'Images

**Script** : `migration/test-routes-events-images.ts`

**Tests à effectuer** :
1. Upload d'une image de test
2. Récupération de l'image uploadée
3. Vérification de l'URL publique
4. Test d'erreur (image inexistante)

#### Étape 2.2 : Tests End-to-End

**Actions** :
1. Tester le flux complet : upload → récupération → affichage
2. Vérifier les permissions (admin uniquement)
3. Tester avec différents formats d'images
4. Vérifier la taille maximale

---

### Phase 3 : Nettoyage et Documentation

#### Étape 3.1 : Nettoyage du Code Legacy

**Actions** :
1. Supprimer les imports `@netlify/blobs` des routes migrées
2. Supprimer les fonctions `eventStorage` liées aux images (si non utilisées ailleurs)
3. Vérifier qu'aucune autre route n'utilise `tenf-events-images`

#### Étape 3.2 : Documentation Finale

**Fichiers à créer/mettre à jour** :
1. `migration/MIGRATION_COMPLETE_FINAL.md` - Résumé final
2. `migration/GUIDE_SUPABASE_STORAGE.md` - Guide d'utilisation Supabase Storage
3. Mettre à jour `migration/ETAT_MIGRATION_V3.md` avec le statut final

---

## 📋 Checklist de Finalisation

### Routes d'Images
- [ ] Configurer le bucket Supabase Storage `events-images`
- [ ] Migrer `/api/admin/events/upload-image`
- [ ] Migrer `/api/admin/events/images/[fileName]`
- [ ] Créer le script de migration des images existantes
- [ ] Exécuter la migration des images
- [ ] Tester les routes d'images
- [ ] Documenter l'utilisation de Supabase Storage

### Vérifications Finales
- [ ] Toutes les routes utilisent Supabase (plus de Netlify Blobs)
- [ ] Tous les tests passent
- [ ] Documentation à jour
- [ ] Code legacy nettoyé
- [ ] Variables d'environnement documentées

### Déploiement
- [ ] Toutes les migrations SQL appliquées en production
- [ ] Variables d'environnement configurées sur Netlify
- [ ] Bucket Supabase Storage créé en production
- [ ] Images migrées en production
- [ ] Tests de production effectués

---

## 🔧 Configuration Requise

### Variables d'Environnement

**Déjà configurées** :
- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Nouvelles (si nécessaire)** :
- Aucune nouvelle variable nécessaire (utilise les mêmes que Supabase)

### Permissions Supabase Storage

**Bucket** : `events-images`
- **Public read** : Pour afficher les images sur le site
- **Authenticated write** : Pour les admins qui uploadent

---

## 📚 Ressources

### Documentation Supabase Storage
- [Guide Storage](https://supabase.com/docs/guides/storage)
- [API Storage](https://supabase.com/docs/reference/javascript/storage)
- [Politiques RLS](https://supabase.com/docs/guides/storage/security/access-control)

### Exemples de Code
- Upload : `supabase.storage.from('bucket').upload()`
- Download : `supabase.storage.from('bucket').download()`
- Public URL : `supabase.storage.from('bucket').getPublicUrl()`
- List : `supabase.storage.from('bucket').list()`
- Delete : `supabase.storage.from('bucket').remove()`

---

## ⏱️ Estimation

**Temps estimé** : 2-4 heures
- Configuration Supabase Storage : 30 min
- Migration des routes : 1-2 heures
- Migration des images existantes : 30 min - 1 heure
- Tests et documentation : 1 heure

---

## 🎯 Objectif Final

**100% des routes migrées vers Supabase**  
**0 dépendance à Netlify Blobs pour les routes critiques**  
**Application prête pour la production**

---

**Date de création** : $(date)  
**Statut** : ⏳ En attente de finalisation
