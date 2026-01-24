# 🔧 Correction de la Version Node.js

**Date** : 2025-01-08  
**Problème** : Netlify utilise Node.js v18.20.8, mais Supabase nécessite Node.js >= 20.0.0

---

## ⚠️ Problème Identifié

Lors du build Netlify, des avertissements apparaissent :

```
npm warn EBADENGINE Unsupported engine {
  package: '@supabase/supabase-js@2.91.0',
  required: { node: '>=20.0.0' },
  current: { node: 'v18.20.8', npm: '10.8.2' }
}
```

Ces avertissements concernent tous les packages Supabase :
- `@supabase/supabase-js`
- `@supabase/auth-js`
- `@supabase/functions-js`
- `@supabase/postgrest-js`
- `@supabase/realtime-js`
- `@supabase/storage-js`
- `iceberg-js`

---

## ✅ Solution Appliquée

### 1. Mise à jour de `netlify.toml`

```toml
[build.environment]
  NODE_VERSION = "20"  # Changé de "18" à "20"
```

### 2. Création de `.nvmrc`

Création d'un fichier `.nvmrc` pour spécifier la version Node.js pour le développement local :

```
20
```

### 3. Ajout de `engines` dans `package.json`

```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}
```

---

## 📋 Vérifications

### Netlify

Le prochain build Netlify utilisera automatiquement Node.js 20, ce qui éliminera les avertissements EBADENGINE.

### Développement Local

Pour utiliser Node.js 20 en local :

```bash
# Si vous utilisez nvm
nvm use

# Ou installer Node.js 20 manuellement
nvm install 20
nvm use 20
```

---

## ✅ Résultat Attendu

- ✅ Plus d'avertissements EBADENGINE lors du build
- ✅ Compatibilité complète avec Supabase
- ✅ Build Netlify plus rapide et fiable
- ✅ Environnement de développement cohérent

---

**Les changements ont été commités et seront appliqués au prochain build Netlify !** 🚀
