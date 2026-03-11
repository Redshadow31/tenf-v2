# 🔧 Solution Alternative : Migration Manuelle des Images

**Date** : $(date)  
**Problème** : Les images ne peuvent pas être migrées automatiquement depuis Netlify Blobs

---

## 📋 État Actuel

**15 images manquantes** dans Supabase Storage :
- `event-1768509046408-xarcxfb.png`
- `event-1768507946306-l03yebu.png`
- `event-1768757831625-29htyrr.png`
- `event-1768752823132-845vnqo.png`
- `event-1768313400127-39czvuh.png`
- `event-1768508251983-3og6l2l.png`
- `event-1768754001410-ape0iof.png`
- `event-1768508546738-nasb60v.png`
- `event-1768509574403-dxg4xi6.png`
- `event-1768762056852-ydlhweh.png`
- `event-1768507277900-qqnmiba.png`
- `event-1768506927732-47t5ndo.png`
- `event-1768506610447-f9bmz6k.jpg`
- `event-1768505966594-7qi2odx.png`
- `event-1767875880006-dy9g7gv.png`

---

## 🎯 Solutions

### Solution 1 : Upload Manuel via Dashboard Supabase (Recommandé)

1. **Récupérer les images depuis Netlify Blobs** :
   - Aller dans Netlify Dashboard → Blobs
   - Télécharger les 15 images listées ci-dessus

2. **Uploader dans Supabase Storage** :
   - Aller dans Supabase Dashboard → Storage → `events-images`
   - Cliquer sur "Upload file"
   - Uploader chaque image avec son nom exact (ex: `event-1768509046408-xarcxfb.png`)

3. **Vérifier** :
   ```bash
   npm run migration:verify-images
   ```

---

### Solution 2 : Configurer les Variables d'Environnement Netlify

Si vous avez accès aux tokens Netlify :

1. **Récupérer les tokens** :
   - `NETLIFY_SITE_ID` : Dans Netlify Dashboard → Site settings → General
   - `NETLIFY_AUTH_TOKEN` : Créer un Personal Access Token dans Netlify

2. **Ajouter dans `.env.local`** :
   ```env
   NETLIFY_SITE_ID=votre_site_id
   NETLIFY_AUTH_TOKEN=votre_token
   ```

3. **Relancer la migration** :
   ```bash
   npm run migration:migrate-images
   ```

---

### Solution 3 : Script SQL pour Mettre à Jour les URLs (Si Images Déjà Uploadées)

Si vous avez déjà uploadé les images manuellement dans Supabase Storage :

```sql
-- Vérifier que les URLs sont correctes
SELECT id, title, image 
FROM events 
WHERE image IS NOT NULL;

-- Les URLs devraient déjà être correctes (format: /api/admin/events/images/[fileName])
-- Si ce n'est pas le cas, les corriger :
UPDATE events 
SET image = '/api/admin/events/images/' || SPLIT_PART(image, '/', -1)
WHERE image IS NOT NULL 
  AND image NOT LIKE '/api/admin/events/images/%';
```

---

## 📝 Checklist

- [ ] Vérifier que le bucket `events-images` existe dans Supabase Storage
- [ ] Vérifier que le bucket est configuré en public (pour les lectures)
- [ ] Uploader les 15 images manuellement dans Supabase Storage
- [ ] Vérifier que les noms de fichiers correspondent exactement
- [ ] Relancer `npm run migration:verify-images` pour vérifier
- [ ] Tester une image sur le site : `https://tenf-community.com/api/admin/events/images/[fileName]`

---

## 🔍 Vérification Rapide

Après avoir uploadé les images, tester :

```bash
# Vérifier l'état
npm run migration:verify-images

# Tester une image spécifique (remplacer [fileName])
curl -I https://tenf-community.com/api/admin/events/images/event-1768509046408-xarcxfb.png
```

**Résultat attendu** : `200 OK` avec `Content-Type: image/png`

---

**Dernière mise à jour** : $(date)
