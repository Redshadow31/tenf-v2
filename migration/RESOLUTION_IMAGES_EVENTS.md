# 🔧 Résolution : Images d'Événements Non Affichées

**Date** : $(date)  
**Problème** : Les images ne s'affichent plus sur `/events` après migration Netlify Blobs → Supabase Storage

---

## 🎯 Solution Rapide

### Étape 1 : Vérifier l'État Actuel

```bash
npm run migration:verify-images
```

Ce script va :
- ✅ Lister tous les événements avec images
- ✅ Vérifier si les URLs sont correctes
- ✅ Vérifier si les images existent dans Supabase Storage
- ✅ Identifier les problèmes

---

### Étape 2 : Migrer les Images (si nécessaire)

Si des images sont manquantes ou nécessitent une migration :

```bash
npm run migration:migrate-images
```

**⚠️ Prérequis** :
- Variables d'environnement Netlify configurées (`NETLIFY_SITE_ID`, `NETLIFY_AUTH_TOKEN`)
- OU exécuter dans un environnement Netlify

Ce script va :
- ✅ Lister toutes les images dans Netlify Blobs
- ✅ Les télécharger depuis Netlify Blobs
- ✅ Les uploader vers Supabase Storage
- ✅ Mettre à jour les URLs dans la base de données

---

## 🔍 Diagnostic Manuel

### 1. Vérifier les URLs dans la Base de Données

```sql
-- Dans Supabase SQL Editor
SELECT id, title, image 
FROM events 
WHERE image IS NOT NULL 
LIMIT 10;
```

**Format attendu** : `/api/admin/events/images/event-1234567890-abc123.jpg`

**Si format incorrect** :
```sql
-- Corriger les URLs
UPDATE events 
SET image = '/api/admin/events/images/' || SPLIT_PART(image, '/', -1)
WHERE image IS NOT NULL 
  AND image NOT LIKE '/api/admin/events/images/%';
```

---

### 2. Vérifier les Images dans Supabase Storage

1. Aller dans **Supabase Dashboard** → **Storage** → **`events-images`**
2. Vérifier que les fichiers existent
3. Si le bucket n'existe pas, le créer (voir `migration/CONFIGURATION_BUCKET_EVENTS_IMAGES.md`)

---

### 3. Tester une Image

Prendre un `fileName` d'un événement et tester :

```bash
# Remplacer [fileName] par un nom réel
curl -I https://teamnewfamily.netlify.app/api/admin/events/images/[fileName]
```

**Résultat attendu** : `200 OK` avec `Content-Type: image/jpeg`

---

## 🐛 Problèmes Courants

### Problème 1 : Erreur 404 sur la Route API

**Cause** : L'image n'existe pas dans Supabase Storage

**Solution** :
1. Vérifier que le bucket `events-images` existe
2. Migrer les images depuis Netlify Blobs
3. Vérifier les permissions RLS du bucket

---

### Problème 2 : URLs Incorrectes dans la DB

**Cause** : Les URLs pointent encore vers Netlify Blobs

**Solution** :
```sql
UPDATE events 
SET image = '/api/admin/events/images/' || SPLIT_PART(image, '/', -1)
WHERE image LIKE '%blobs%' OR image LIKE '%netlify%';
```

---

### Problème 3 : Images Cassees dans le Navigateur

**Cause** : Content-Type incorrect ou erreur CORS

**Solution** :
1. Vérifier que la route API retourne le bon Content-Type
2. Vérifier les headers CORS dans `next.config.js`
3. Vérifier la console du navigateur pour les erreurs

---

## 📋 Checklist de Vérification

- [ ] Les images existent dans Supabase Storage (`events-images` bucket)
- [ ] Les URLs dans la table `events` pointent vers `/api/admin/events/images/[fileName]`
- [ ] La route API `/api/admin/events/images/[fileName]` fonctionne (test avec curl)
- [ ] Les permissions RLS du bucket sont correctes (public read)
- [ ] Les variables d'environnement Supabase sont configurées
- [ ] Le bucket `events-images` est configuré comme public

---

## 🚀 Actions Immédiates

1. **Exécuter le script de vérification** :
   ```bash
   npm run migration:verify-images
   ```

2. **Si des images sont manquantes, migrer** :
   ```bash
   npm run migration:migrate-images
   ```

3. **Vérifier manuellement dans Supabase** :
   - Dashboard → Storage → `events-images`
   - Vérifier que les fichiers existent

4. **Tester une image** :
   - Prendre un fileName d'un événement
   - Tester l'URL : `https://teamnewfamily.netlify.app/api/admin/events/images/[fileName]`

---

**Dernière mise à jour** : $(date)
