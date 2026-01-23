# 🗄️ Base de Données Supabase

Ce dossier contient tout le code lié à la base de données Supabase.

## Structure

```
lib/db/
├── schema.ts              # Schéma Drizzle ORM (tables, relations)
├── client.ts              # Client Drizzle pour requêtes serveur
├── supabase.ts            # Clients Supabase (client + admin)
├── migrations/            # Migrations SQL générées par Drizzle
└── README.md              # Ce fichier
```

## Utilisation

### Générer une Migration

Après avoir modifié `schema.ts` :

```bash
npm run db:generate
```

### Appliquer les Migrations

```bash
npm run db:migrate
```

### Ouvrir Drizzle Studio (Interface Graphique)

```bash
npm run db:studio
```

## Schéma de Base de Données

### Tables Principales

- **members** : Membres TENF
- **events** : Événements communautaires
- **event_registrations** : Inscriptions aux événements
- **spotlights** : Spotlights actifs
- **spotlight_presences** : Présences aux spotlights
- **spotlight_evaluations** : Évaluations des spotlights
- **evaluations** : Évaluations mensuelles (sections A, B, C, D)
- **vip_history** : Historique des VIPs
- **logs** : Logs d'audit

### Relations

- `members` → `evaluations` (one-to-many)
- `members` → `event_registrations` (one-to-many)
- `events` → `event_registrations` (one-to-many)
- `spotlights` → `spotlight_presences` (one-to-many)
- `spotlights` → `spotlight_evaluations` (one-to-many)

## Variables d'Environnement

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key
```

## Notes

- Utiliser `db` (Drizzle) pour les requêtes serveur avec type-safety
- Utiliser `supabase` pour les requêtes client
- Utiliser `supabaseAdmin` pour les opérations admin côté serveur
