# 📦 Scripts de Migration V2 → V3

Ce dossier contient tous les scripts nécessaires pour migrer de Netlify Blobs vers Supabase.

## Structure

```
migration/
├── README.md                    # Ce fichier
├── export-from-blobs.ts         # Export des données depuis Netlify Blobs
├── import-to-supabase.ts        # Import des données vers Supabase
├── compare-data.ts              # Comparaison des données (vérification)
└── exported-data/               # Dossier pour les données exportées (gitignored)
```

## Utilisation

### 1. Exporter les données depuis Netlify Blobs

```bash
# S'assurer que les variables d'environnement sont configurées dans .env.local
npx tsx migration/export-from-blobs.ts
```

Les données seront exportées dans `migration/exported-data/`.

### 2. Importer les données vers Supabase

```bash
# S'assurer que DATABASE_URL est configuré dans .env.local
npx tsx migration/import-to-supabase.ts
```

### 3. Vérifier la migration

```bash
npx tsx migration/compare-data.ts
```

## Variables d'Environnement Requises

```env
# Pour l'export
NETLIFY_SITE_ID=votre_site_id
NETLIFY_AUTH_TOKEN=votre_auth_token

# Pour l'import
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

## Notes

- Les scripts créent automatiquement le dossier `exported-data` si nécessaire
- Les données exportées sont en JSON et peuvent être inspectées manuellement
- En cas d'erreur, vérifier les logs dans la console
