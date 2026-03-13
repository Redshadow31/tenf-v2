# 🔑 Vérification de la Clé Service Role

## ❌ Problème : "Invalid API key"

Toutes les opérations d'import échouent avec "Invalid API key". Cela signifie que la clé `SUPABASE_SERVICE_ROLE_KEY` n'est pas correcte.

## ✅ Solution : Vérifier la Clé dans Supabase

### Étape 1 : Aller dans Supabase Dashboard

1. Aller sur https://supabase.com/dashboard/project/ggcpwaexhougomfnnsob
2. **Settings** → **API**

### Étape 2 : Vérifier la Clé Service Role

Dans la section **"Project API keys"**, vous devriez voir :

- **anon public** → C'est `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (déjà configuré)
- **service_role** → C'est `SUPABASE_SERVICE_ROLE_KEY` ⚠️ (à vérifier)

### Étape 3 : Copier la Bonne Clé

1. Chercher la clé **"service_role"** (pas "anon")
2. Cliquer sur l'icône **œil** pour révéler la clé
3. **Copier la clé complète**
4. Elle devrait commencer par `eyJ...` (format JWT) ou `sb_secret_...`

### Étape 4 : Mettre à Jour .env.local

1. Ouvrir `.env.local`
2. Trouver la ligne `SUPABASE_SERVICE_ROLE_KEY=...`
3. Remplacer par la vraie clé copiée depuis Supabase
4. Sauvegarder

### Étape 5 : Relancer l'Import

```bash
npx tsx migration/import-to-supabase.ts
```

## 🔍 Format de la Clé

La clé service_role peut avoir deux formats :

1. **Format JWT** : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (longue, commence par eyJ)
2. **Format Secret** : `sb_secret_EXAMPLE_PLACEHOLDER` (commence par sb_secret_)

Les deux formats sont valides, mais vous devez utiliser **exactement** celle qui est dans votre dashboard Supabase.

## ⚠️ Important

- La clé service_role est **SECRÈTE** et ne doit jamais être exposée côté client
- Elle bypass toutes les restrictions RLS (Row Level Security)
- Elle doit être utilisée uniquement côté serveur
