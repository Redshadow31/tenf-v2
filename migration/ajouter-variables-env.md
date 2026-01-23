# 📝 Ajouter les Variables d'Environnement

## ✅ Variables à Ajouter dans .env.local

Ouvrez le fichier `.env.local` à la racine du projet et ajoutez ces lignes :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ggcpwaexhougomfnnsob.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_TC-xB59hf4FEewC8kdFaCQ_3NqsJxc7
SUPABASE_SERVICE_ROLE_KEY=sb_secret_pt1XELVAoYCbc-WM7Jfdjg_W1adRP20

# Database Connection String
DATABASE_URL=postgresql://postgres.ggcpwaexhougomfnnsob:DpDAkhQCrsJrsWXl@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

## 🔍 Vérifier que c'est bien ajouté

Après avoir ajouté les variables, exécutez :

```bash
npx tsx migration/verifier-env.ts
```

Vous devriez voir :
```
✅ NEXT_PUBLIC_SUPABASE_URL = https://ggcpwaexhougomfnnsob.supabase.co
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_TC-xB59hf4FEewC8kdFaCQ_3NqsJxc7
✅ SUPABASE_SERVICE_ROLE_KEY = sb_secret_pt1XE...
✅ DATABASE_URL = postgresql://postgres.ggcpwaexhougomfnnsob:DpDAkhQCrsJrsWXl@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

✅ Toutes les variables sont configurées !
```

## ⚠️ Important

- Le fichier `.env.local` est déjà dans `.gitignore`, donc il ne sera pas commité
- Ne partagez JAMAIS ce fichier publiquement
- Les valeurs ci-dessus sont déjà configurées sur Netlify, donc c'est sûr de les mettre dans `.env.local` pour le développement local
