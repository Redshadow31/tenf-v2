# ✅ Configuration du Bucket `events-images` - Vérification

## 📋 État Actuel

Le bucket `events-images` est créé dans Supabase Storage avec la configuration suivante :

- ✅ **Nom** : `events-images`
- ⚠️ **Policies** : 0 (aucune politique RLS)
- ⚠️ **File size limit** : Unset (50 MB par défaut)
- ⚠️ **Allowed MIME types** : Any

## 🔧 Recommandations d'Optimisation

### 1. Limiter les Types MIME (Recommandé)

Pour plus de sécurité, limitez aux types d'images uniquement :

**Types recommandés** :
- `image/jpeg`
- `image/png`
- `image/gif`
- `image/webp`
- `image/svg+xml`

**Comment faire** :
1. Cliquez sur le bucket `events-images`
2. Allez dans l'onglet **Settings**
3. Dans **Allowed MIME types**, sélectionnez les types d'images
4. Sauvegardez

### 2. Définir une Limite de Taille (Recommandé)

Pour éviter les uploads trop volumineux, définissez une limite :

**Recommandation** : 5 MB (5 242 880 bytes)

**Comment faire** :
1. Cliquez sur le bucket `events-images`
2. Allez dans l'onglet **Settings**
3. Dans **File size limit**, entrez `5242880` (5 MB en bytes)
4. Sauvegardez

### 3. Configurer les Permissions (Optionnel)

Si vous voulez que les images soient accessibles publiquement (recommandé pour les images d'événements) :

**Option A : Bucket Public** (Recommandé)
- Le bucket est déjà public si vous pouvez y accéder sans authentification
- Les images seront accessibles via URL publique

**Option B : Politiques RLS** (Si vous voulez plus de contrôle)

Créez des politiques dans l'onglet **Policies** :

```sql
-- Politique pour permettre la lecture publique
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'events-images');

-- Politique pour permettre l'upload aux utilisateurs authentifiés
CREATE POLICY "Authenticated upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'events-images' 
  AND auth.role() = 'authenticated'
);
```

## ✅ Vérification

Pour vérifier que le bucket fonctionne :

1. **Test d'upload** (via l'interface Supabase) :
   - Allez dans **Storage** → **Files**
   - Sélectionnez le bucket `events-images`
   - Cliquez sur **Upload file**
   - Upload une image de test

2. **Test d'accès** :
   - Une fois l'image uploadée, récupérez son URL publique
   - Testez l'accès dans un navigateur

## 🎯 Prochaine Étape

Une fois le bucket configuré, vous pouvez :
1. ✅ Migrer les routes d'upload et de récupération
2. ✅ Migrer les images existantes depuis Netlify Blobs
3. ✅ Tester les routes migrées

**Le bucket est prêt !** Vous pouvez maintenant procéder à la migration des routes. 🚀

---

**Date** : $(date)
