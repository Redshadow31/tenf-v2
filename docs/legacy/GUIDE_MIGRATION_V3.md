# 🚀 Guide Complet de Migration TENF V2 → V3

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Phase 1 : Préparation](#phase-1--préparation)
4. [Phase 2 : Configuration Supabase](#phase-2--configuration-supabase)
5. [Phase 3 : Schéma de Base de Données](#phase-3--schéma-de-base-de-données)
6. [Phase 4 : Migration des Données](#phase-4--migration-des-données)
7. [Phase 5 : Refactoring du Code](#phase-5--refactoring-du-code)
8. [Phase 6 : Tests et Validation](#phase-6--tests-et-validation)
9. [Phase 7 : Déploiement](#phase-7--déploiement)
10. [Dépannage](#dépannage)

---

## Vue d'ensemble

### Objectifs de la Migration

- ✅ Remplacer Netlify Blobs par Supabase (PostgreSQL)
- ✅ Implémenter une architecture Repository Pattern
- ✅ Ajouter un cache Redis (Upstash)
- ✅ Améliorer les performances avec des requêtes SQL optimisées
- ✅ Ajouter le support Real-time
- ✅ Faciliter la scalabilité future

### Durée Estimée

- **Phase 1-2** : 2-3 heures (Setup)
- **Phase 3** : 4-6 heures (Schéma DB)
- **Phase 4** : 3-4 heures (Migration données)
- **Phase 5** : 15-20 heures (Refactoring)
- **Phase 6** : 4-6 heures (Tests)
- **Phase 7** : 2-3 heures (Déploiement)

**Total estimé : 30-42 heures** (peut être fait progressivement)

---

## Prérequis

### Comptes à Créer

1. **Supabase** : https://supabase.com
   - Créer un compte gratuit
   - Créer un nouveau projet
   - Noter : URL du projet, `anon key`, `service_role key`

2. **Upstash Redis** (optionnel mais recommandé) : https://upstash.com
   - Créer un compte gratuit
   - Créer une base Redis
   - Noter : `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`

### Outils Requis

- Node.js 18+ installé
- Git configuré
- Accès au projet Netlify actuel
- Accès aux données Netlify Blobs (pour export)

### Connaissances Requises

- TypeScript
- SQL (basique)
- Next.js App Router
- Git

---

## Phase 1 : Préparation

### Étape 1.1 : Créer une Branche de Migration

```bash
# Depuis le répertoire du projet
git checkout -b migration/v3-supabase

# Créer un dossier pour la migration
mkdir -p migration
```

### Étape 1.2 : Installer les Dépendances

```bash
# Installer Supabase client
npm install @supabase/supabase-js

# Installer Drizzle ORM (recommandé pour type-safety)
npm install drizzle-orm drizzle-kit postgres
npm install -D @types/pg

# Installer Upstash Redis (optionnel)
npm install @upstash/redis

# Installer Zod pour validation
npm install zod

# Installer dotenv pour variables d'environnement
npm install dotenv
```

### Étape 1.3 : Créer le Fichier .env.local

Créer un fichier `.env.local` à la racine du projet :

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_anon_key
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key

# Upstash Redis (optionnel)
UPSTASH_REDIS_URL=https://votre-redis.upstash.io
UPSTASH_REDIS_TOKEN=votre_token

# Netlify (pour migration)
NETLIFY_SITE_ID=votre_site_id
NETLIFY_AUTH_TOKEN=votre_auth_token
```

⚠️ **Important** : Ne pas commiter `.env.local` dans Git (déjà dans `.gitignore`)

---

## Phase 2 : Configuration Supabase

### Étape 2.1 : Créer le Projet Supabase

1. Aller sur https://supabase.com
2. Cliquer sur "New Project"
3. Remplir les informations :
   - **Name** : `tenf-v3`
   - **Database Password** : Générer un mot de passe fort (le sauvegarder !)
   - **Region** : Choisir la région la plus proche (Europe pour la France)
4. Cliquer sur "Create new project"
5. Attendre 2-3 minutes que le projet soit créé

### Étape 2.2 : Récupérer les Clés API

1. Dans le dashboard Supabase, aller dans **Settings** → **API**
2. Noter les valeurs suivantes :
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Secret, ne jamais exposer côté client)

### Étape 2.3 : Configurer les RLS (Row Level Security)

Pour l'instant, on va désactiver RLS pour simplifier la migration. On le réactivera plus tard.

1. Aller dans **Authentication** → **Policies**
2. Pour chaque table créée, on configurera RLS plus tard

---

## Phase 3 : Schéma de Base de Données

### Étape 3.1 : Créer le Fichier de Schéma Drizzle

Créer `lib/db/schema.ts` :

```typescript
import { pgTable, text, uuid, boolean, timestamp, jsonb, integer, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const memberRoleEnum = pgEnum('member_role', [
  'Affilié',
  'Développement',
  'Modérateur Junior',
  'Mentor',
  'Admin',
  'Admin Adjoint',
  'Créateur Junior',
  'Communauté'
]);

export const eventCategoryEnum = pgEnum('event_category', [
  'Spotlight',
  'Soirées communautaires',
  'Ateliers créateurs',
  'Aventura 2025'
]);

export const spotlightStatusEnum = pgEnum('spotlight_status', [
  'active',
  'completed',
  'cancelled'
]);

export const bonusTypeEnum = pgEnum('bonus_type', [
  'decalage-horaire',
  'implication-qualitative',
  'conseils-remarquables',
  'autre'
]);

// ============================================
// TABLES
// ============================================

// Table: members
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  twitchLogin: text('twitch_login').notNull().unique(),
  twitchId: text('twitch_id'),
  twitchUrl: text('twitch_url').notNull(),
  discordId: text('discord_id').unique(),
  discordUsername: text('discord_username'),
  displayName: text('display_name').notNull(),
  siteUsername: text('site_username'),
  role: memberRoleEnum('role').notNull().default('Affilié'),
  isVip: boolean('is_vip').default(false),
  isActive: boolean('is_active').default(true),
  badges: jsonb('badges').$type<string[]>().default([]),
  listId: integer('list_id'), // 1, 2, ou 3
  roleManuallySet: boolean('role_manually_set').default(false),
  
  // Informations Twitch (synchronisées)
  twitchStatus: jsonb('twitch_status').$type<{
    isLive?: boolean;
    gameName?: string;
    viewerCount?: number;
    title?: string;
    thumbnailUrl?: string;
  }>(),
  
  // Informations personnalisées
  description: text('description'),
  customBio: text('custom_bio'),
  
  // Métadonnées
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: text('updated_by'), // Discord ID
  
  // Suivi staff
  integrationDate: timestamp('integration_date'),
  roleHistory: jsonb('role_history').$type<Array<{
    fromRole: string;
    toRole: string;
    changedAt: string;
    changedBy: string;
    reason?: string;
  }>>().default([]),
  parrain: text('parrain'),
});

// Table: events
export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  image: text('image'),
  date: timestamp('date').notNull(),
  category: eventCategoryEnum('category').notNull(),
  location: text('location'),
  invitedMembers: jsonb('invited_members').$type<string[]>().default([]),
  isPublished: boolean('is_published').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(), // Discord ID
  updatedAt: timestamp('updated_at'),
});

// Table: event_registrations
export const eventRegistrations = pgTable('event_registrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  twitchLogin: text('twitch_login').notNull(),
  displayName: text('display_name').notNull(),
  discordId: text('discord_id'),
  discordUsername: text('discord_username'),
  notes: text('notes'),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// Table: spotlights
export const spotlights = pgTable('spotlights', {
  id: uuid('id').defaultRandom().primaryKey(),
  streamerTwitchLogin: text('streamer_twitch_login').notNull(),
  streamerDisplayName: text('streamer_display_name'),
  startedAt: timestamp('started_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  status: spotlightStatusEnum('status').notNull().default('active'),
  moderatorDiscordId: text('moderator_discord_id').notNull(),
  moderatorUsername: text('moderator_username').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  createdBy: text('created_by').notNull(), // Discord ID
});

// Table: spotlight_presences
export const spotlightPresences = pgTable('spotlight_presences', {
  id: uuid('id').defaultRandom().primaryKey(),
  spotlightId: uuid('spotlight_id').notNull().references(() => spotlights.id, { onDelete: 'cascade' }),
  twitchLogin: text('twitch_login').notNull(),
  displayName: text('display_name'),
  addedAt: timestamp('added_at').defaultNow(),
  addedBy: text('added_by').notNull(), // Discord ID
});

// Table: spotlight_evaluations
export const spotlightEvaluations = pgTable('spotlight_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  spotlightId: uuid('spotlight_id').notNull().references(() => spotlights.id, { onDelete: 'cascade' }),
  streamerTwitchLogin: text('streamer_twitch_login').notNull(),
  criteria: jsonb('criteria').$type<Array<{
    id: string;
    label: string;
    maxValue: number;
    value: number;
  }>>().notNull(),
  totalScore: integer('total_score').notNull(),
  maxScore: integer('max_score').notNull(),
  moderatorComments: text('moderator_comments'),
  evaluatedAt: timestamp('evaluated_at').defaultNow(),
  evaluatedBy: text('evaluated_by').notNull(), // Discord ID
  validated: boolean('validated').default(false),
  validatedAt: timestamp('validated_at'),
});

// Table: evaluations (évaluations mensuelles)
export const evaluations = pgTable('evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  month: date('month').notNull(), // Format: YYYY-MM-01
  twitchLogin: text('twitch_login').notNull(),
  
  // Section A
  sectionAPoints: integer('section_a_points').default(0),
  spotlightEvaluations: jsonb('spotlight_evaluations').$type<Array<{
    id: string;
    date: string;
    streamerTwitchLogin: string;
    moderatorDiscordId: string;
    moderatorUsername: string;
    members: Array<{
      twitchLogin: string;
      present: boolean;
      note?: number;
      comment?: string;
    }>;
    validated: boolean;
    validatedAt?: string;
  }>>().default([]),
  eventEvaluations: jsonb('event_evaluations').$type<Array<{
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    members: Array<{
      twitchLogin: string;
      present: boolean;
      comment?: string;
    }>;
  }>>().default([]),
  raidPoints: integer('raid_points').default(0),
  spotlightBonus: integer('spotlight_bonus').default(0),
  
  // Section B (Discord engagement)
  sectionBPoints: integer('section_b_points').default(0),
  discordEngagement: jsonb('discord_engagement').$type<{
    messages?: number;
    vocals?: number;
    reactions?: number;
    total?: number;
  }>(),
  
  // Section C (Follows)
  sectionCPoints: integer('section_c_points').default(0),
  followValidations: jsonb('follow_validations').$type<Array<{
    staffDiscordId: string;
    staffTwitchLogin: string;
    validatedAt: string;
    follows: Record<string, boolean>;
  }>>().default([]),
  
  // Section D (Bonus)
  sectionDBonuses: integer('section_d_bonuses').default(0),
  bonuses: jsonb('bonuses').$type<Array<{
    id: string;
    points: number;
    reason: string;
    type: 'decalage-horaire' | 'implication-qualitative' | 'conseils-remarquables' | 'autre';
    createdBy: string;
    createdAt: string;
  }>>().default([]),
  
  // Total
  totalPoints: integer('total_points').default(0),
  
  // Métadonnées
  calculatedAt: timestamp('calculated_at'),
  calculatedBy: text('calculated_by'), // Discord ID
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Table: vip_history
export const vipHistory = pgTable('vip_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  month: date('month').notNull(), // Format: YYYY-MM-01
  twitchLogin: text('twitch_login').notNull(),
  displayName: text('display_name').notNull(),
  vipBadge: text('vip_badge'),
  consecutiveMonths: integer('consecutive_months').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

// Table: logs (audit)
export const logs = pgTable('logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  action: text('action').notNull(),
  userId: text('user_id'), // Discord ID
  username: text('username'),
  details: jsonb('details').$type<Record<string, any>>(),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// ============================================
// RELATIONS
// ============================================

export const membersRelations = relations(members, ({ many }) => ({
  evaluations: many(evaluations),
  eventRegistrations: many(eventRegistrations),
  spotlightPresences: many(spotlightPresences),
  vipHistory: many(vipHistory),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
}));

export const spotlightsRelations = relations(spotlights, ({ many }) => ({
  presences: many(spotlightPresences),
  evaluations: many(spotlightEvaluations),
}));

export const spotlightPresencesRelations = relations(spotlightPresences, ({ one }) => ({
  spotlight: one(spotlights, {
    fields: [spotlightPresences.spotlightId],
    references: [spotlights.id],
  }),
}));

export const spotlightEvaluationsRelations = relations(spotlightEvaluations, ({ one }) => ({
  spotlight: one(spotlights, {
    fields: [spotlightEvaluations.spotlightId],
    references: [spotlights.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  member: one(members, {
    fields: [evaluations.twitchLogin],
    references: [members.twitchLogin],
  }),
}));

export const vipHistoryRelations = relations(vipHistory, ({ one }) => ({
  member: one(members, {
    fields: [vipHistory.twitchLogin],
    references: [members.twitchLogin],
  }),
}));
```

### Étape 3.2 : Créer le Client Drizzle

Créer `lib/db/client.ts` :

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Pour les migrations et les requêtes serveur
const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

// Pour les requêtes client (via Supabase)
export { schema };
```

### Étape 3.3 : Créer le Client Supabase

Créer `lib/db/supabase.ts` :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client pour usage côté client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client pour usage côté serveur (avec service role)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
```

### Étape 3.4 : Configurer Drizzle Kit

Créer `drizzle.config.ts` :

```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

Ajouter dans `package.json` :

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio"
  }
}
```

### Étape 3.5 : Générer et Appliquer les Migrations

1. **Récupérer la connection string Supabase** :
   - Aller dans **Settings** → **Database**
   - Copier la **Connection string** (URI)
   - Format : `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
   - Ajouter dans `.env.local` : `DATABASE_URL=postgresql://...`

2. **Générer les migrations** :

```bash
npm run db:generate
```

3. **Appliquer les migrations** :

```bash
npm run db:migrate
```

4. **Vérifier dans Supabase** :
   - Aller dans **Table Editor**
   - Vérifier que toutes les tables sont créées

---

## Phase 4 : Migration des Données

### Étape 4.1 : Créer le Script d'Export Netlify Blobs

Créer `migration/export-from-blobs.ts` :

```typescript
import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// Configuration Netlify
const siteID = process.env.NETLIFY_SITE_ID!;
const token = process.env.NETLIFY_AUTH_TOKEN!;

const stores = {
  members: { name: 'tenf-admin-members', key: 'admin-members-data' },
  botMembers: { name: 'tenf-bot-members', key: 'bot-members-data' },
  events: { name: 'tenf-events', key: 'events.json' },
  spotlights: { name: 'tenf-spotlights', key: 'active.json' },
  evaluations: { name: 'tenf-evaluations', key: null }, // Structure par mois
  vipHistory: { name: 'tenf-vip-history', key: 'vip-history.json' },
};

async function exportData() {
  const exportDir = path.join(process.cwd(), 'migration', 'exported-data');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  console.log('📦 Export des données depuis Netlify Blobs...\n');

  // Export Members
  try {
    const membersStore = getStore({ name: stores.members.name, siteID, token });
    const membersData = await membersStore.get(stores.members.key, { type: 'text' });
    if (membersData) {
      fs.writeFileSync(
        path.join(exportDir, 'members.json'),
        membersData,
        'utf-8'
      );
      console.log('✅ Members exportés');
    }
  } catch (error) {
    console.error('❌ Erreur export members:', error);
  }

  // Export Bot Members
  try {
    const botStore = getStore({ name: stores.botMembers.name, siteID, token });
    const botData = await botStore.get(stores.botMembers.key, { type: 'text' });
    if (botData) {
      fs.writeFileSync(
        path.join(exportDir, 'bot-members.json'),
        botData,
        'utf-8'
      );
      console.log('✅ Bot members exportés');
    }
  } catch (error) {
    console.error('❌ Erreur export bot members:', error);
  }

  // Export Events
  try {
    const eventsStore = getStore({ name: stores.events.name, siteID, token });
    const eventsData = await eventsStore.get(stores.events.key, { type: 'text' });
    if (eventsData) {
      fs.writeFileSync(
        path.join(exportDir, 'events.json'),
        eventsData,
        'utf-8'
      );
      console.log('✅ Events exportés');
    }
  } catch (error) {
    console.error('❌ Erreur export events:', error);
  }

  // Export Spotlights
  try {
    const spotlightStore = getStore({ name: stores.spotlights.name, siteID, token });
    const spotlightData = await spotlightStore.get(stores.spotlights.key, { type: 'text' });
    if (spotlightData) {
      fs.writeFileSync(
        path.join(exportDir, 'spotlights.json'),
        spotlightData,
        'utf-8'
      );
      console.log('✅ Spotlights exportés');
    }
  } catch (error) {
    console.error('❌ Erreur export spotlights:', error);
  }

  // Export VIP History
  try {
    const vipStore = getStore({ name: stores.vipHistory.name, siteID, token });
    const vipData = await vipStore.get('vip-history.json', { type: 'text' });
    if (vipData) {
      fs.writeFileSync(
        path.join(exportDir, 'vip-history.json'),
        vipData,
        'utf-8'
      );
      console.log('✅ VIP History exporté');
    }
  } catch (error) {
    console.error('❌ Erreur export VIP history:', error);
  }

  console.log('\n✅ Export terminé ! Données dans migration/exported-data/');
}

exportData().catch(console.error);
```

Exécuter :

```bash
npx tsx migration/export-from-blobs.ts
```

### Étape 4.2 : Créer le Script d'Import vers Supabase

Créer `migration/import-to-supabase.ts` :

```typescript
import { db } from '../lib/db/client';
import { members, events, eventRegistrations, spotlights, spotlightPresences, spotlightEvaluations, evaluations, vipHistory } from '../lib/db/schema';
import fs from 'fs';
import path from 'path';
import { eq } from 'drizzle-orm';

const exportDir = path.join(process.cwd(), 'migration', 'exported-data');

async function importMembers() {
  console.log('📥 Import des membres...');
  
  const membersFile = path.join(exportDir, 'members.json');
  if (!fs.existsSync(membersFile)) {
    console.log('⚠️ Fichier members.json non trouvé');
    return;
  }

  const membersData = JSON.parse(fs.readFileSync(membersFile, 'utf-8'));
  const membersArray = Object.values(membersData) as any[];

  let imported = 0;
  let errors = 0;

  for (const member of membersArray) {
    try {
      // Convertir les dates
      const memberRecord = {
        twitchLogin: member.twitchLogin.toLowerCase(),
        twitchId: member.twitchId,
        twitchUrl: member.twitchUrl,
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        displayName: member.displayName,
        siteUsername: member.siteUsername,
        role: member.role || 'Affilié',
        isVip: member.isVip || false,
        isActive: member.isActive !== false, // Par défaut true
        badges: member.badges || [],
        listId: member.listId,
        roleManuallySet: member.roleManuallySet || false,
        twitchStatus: member.twitchStatus || null,
        description: member.description || null,
        customBio: member.customBio || null,
        updatedBy: member.updatedBy || null,
        integrationDate: member.integrationDate ? new Date(member.integrationDate) : null,
        roleHistory: member.roleHistory || [],
        parrain: member.parrain || null,
        createdAt: member.createdAt ? new Date(member.createdAt) : new Date(),
        updatedAt: member.updatedAt ? new Date(member.updatedAt) : new Date(),
      };

      await db.insert(members).values(memberRecord).onConflictDoUpdate({
        target: members.twitchLogin,
        set: memberRecord,
      });

      imported++;
    } catch (error) {
      console.error(`❌ Erreur import membre ${member.twitchLogin}:`, error);
      errors++;
    }
  }

  console.log(`✅ ${imported} membres importés, ${errors} erreurs\n`);
}

async function importEvents() {
  console.log('📥 Import des événements...');
  
  const eventsFile = path.join(exportDir, 'events.json');
  if (!fs.existsSync(eventsFile)) {
    console.log('⚠️ Fichier events.json non trouvé');
    return;
  }

  const eventsData = JSON.parse(fs.readFileSync(eventsFile, 'utf-8')) as any[];

  let imported = 0;
  let errors = 0;

  for (const event of eventsData) {
    try {
      const eventRecord = {
        id: event.id,
        title: event.title,
        description: event.description,
        image: event.image || null,
        date: new Date(event.date),
        category: event.category,
        location: event.location || null,
        invitedMembers: event.invitedMembers || [],
        isPublished: event.isPublished !== false,
        createdBy: event.createdBy,
        createdAt: new Date(event.createdAt),
        updatedAt: event.updatedAt ? new Date(event.updatedAt) : null,
      };

      await db.insert(events).values(eventRecord).onConflictDoUpdate({
        target: events.id,
        set: eventRecord,
      });

      // Importer les inscriptions
      if (event.registrations) {
        for (const reg of event.registrations) {
          await db.insert(eventRegistrations).values({
            eventId: event.id,
            twitchLogin: reg.twitchLogin,
            displayName: reg.displayName,
            discordId: reg.discordId || null,
            discordUsername: reg.discordUsername || null,
            notes: reg.notes || null,
            registeredAt: new Date(reg.registeredAt),
          }).onConflictDoNothing();
        }
      }

      imported++;
    } catch (error) {
      console.error(`❌ Erreur import événement ${event.id}:`, error);
      errors++;
    }
  }

  console.log(`✅ ${imported} événements importés, ${errors} erreurs\n`);
}

async function importSpotlights() {
  console.log('📥 Import des spotlights...');
  
  const spotlightsFile = path.join(exportDir, 'spotlights.json');
  if (!fs.existsSync(spotlightsFile)) {
    console.log('⚠️ Fichier spotlights.json non trouvé');
    return;
  }

  const spotlightData = JSON.parse(fs.readFileSync(spotlightsFile, 'utf-8')) as any;

  try {
    if (spotlightData && spotlightData.id) {
      const spotlightRecord = {
        id: spotlightData.id,
        streamerTwitchLogin: spotlightData.streamerTwitchLogin,
        streamerDisplayName: spotlightData.streamerDisplayName || null,
        startedAt: new Date(spotlightData.startedAt),
        endsAt: new Date(spotlightData.endsAt),
        status: spotlightData.status,
        moderatorDiscordId: spotlightData.moderatorDiscordId,
        moderatorUsername: spotlightData.moderatorUsername,
        createdAt: new Date(spotlightData.createdAt),
        createdBy: spotlightData.createdBy,
      };

      await db.insert(spotlights).values(spotlightRecord).onConflictDoUpdate({
        target: spotlights.id,
        set: spotlightRecord,
      });

      // Importer les présences
      if (spotlightData.presences) {
        for (const presence of spotlightData.presences) {
          await db.insert(spotlightPresences).values({
            spotlightId: spotlightData.id,
            twitchLogin: presence.twitchLogin,
            displayName: presence.displayName || null,
            addedAt: new Date(presence.addedAt),
            addedBy: presence.addedBy,
          }).onConflictDoNothing();
        }
      }

      // Importer les évaluations
      if (spotlightData.evaluation) {
        await db.insert(spotlightEvaluations).values({
          spotlightId: spotlightData.id,
          streamerTwitchLogin: spotlightData.evaluation.streamerTwitchLogin,
          criteria: spotlightData.evaluation.criteria,
          totalScore: spotlightData.evaluation.totalScore,
          maxScore: spotlightData.evaluation.maxScore,
          moderatorComments: spotlightData.evaluation.moderatorComments || null,
          evaluatedAt: new Date(spotlightData.evaluation.evaluatedAt),
          evaluatedBy: spotlightData.evaluation.evaluatedBy,
          validated: spotlightData.validated || false,
          validatedAt: spotlightData.validatedAt ? new Date(spotlightData.validatedAt) : null,
        }).onConflictDoNothing();
      }

      console.log('✅ Spotlight importé\n');
    }
  } catch (error) {
    console.error('❌ Erreur import spotlight:', error);
  }
}

async function importVipHistory() {
  console.log('📥 Import de l\'historique VIP...');
  
  const vipFile = path.join(exportDir, 'vip-history.json');
  if (!fs.existsSync(vipFile)) {
    console.log('⚠️ Fichier vip-history.json non trouvé');
    return;
  }

  const vipData = JSON.parse(fs.readFileSync(vipFile, 'utf-8')) as any[];

  let imported = 0;
  let errors = 0;

  for (const entry of vipData) {
    try {
      await db.insert(vipHistory).values({
        month: new Date(entry.month),
        twitchLogin: entry.twitchLogin,
        displayName: entry.displayName,
        vipBadge: entry.vipBadge || null,
        consecutiveMonths: entry.consecutiveMonths || 1,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      }).onConflictDoNothing();

      imported++;
    } catch (error) {
      console.error(`❌ Erreur import VIP ${entry.twitchLogin}:`, error);
      errors++;
    }
  }

  console.log(`✅ ${imported} entrées VIP importées, ${errors} erreurs\n`);
}

async function main() {
  console.log('🚀 Début de l\'import vers Supabase...\n');

  await importMembers();
  await importEvents();
  await importSpotlights();
  await importVipHistory();

  console.log('✅ Import terminé !');
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
```

Exécuter :

```bash
npx tsx migration/import-to-supabase.ts
```

### Étape 4.3 : Vérifier les Données Importées

1. Aller dans Supabase → **Table Editor**
2. Vérifier chaque table :
   - `members` : Vérifier le nombre de membres
   - `events` : Vérifier les événements
   - `spotlights` : Vérifier les spotlights
   - `vip_history` : Vérifier l'historique VIP

---

## Phase 5 : Refactoring du Code

### Étape 5.1 : Créer le Repository Pattern

Créer `lib/repositories/MemberRepository.ts` :

```typescript
import { db } from '../db/client';
import { members } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import type { MemberData } from '../memberData';

export class MemberRepository {
  async findAll(): Promise<MemberData[]> {
    const result = await db.select().from(members);
    return result.map(this.mapToMemberData);
  }

  async findByTwitchLogin(login: string): Promise<MemberData | null> {
    const result = await db
      .select()
      .from(members)
      .where(eq(members.twitchLogin, login.toLowerCase()))
      .limit(1);

    return result[0] ? this.mapToMemberData(result[0]) : null;
  }

  async findActive(limit = 50, offset = 0): Promise<MemberData[]> {
    const result = await db
      .select()
      .from(members)
      .where(eq(members.isActive, true))
      .orderBy(desc(members.updatedAt))
      .limit(limit)
      .offset(offset);

    return result.map(this.mapToMemberData);
  }

  async findByDiscordId(discordId: string): Promise<MemberData | null> {
    const result = await db
      .select()
      .from(members)
      .where(eq(members.discordId, discordId))
      .limit(1);

    return result[0] ? this.mapToMemberData(result[0]) : null;
  }

  async create(member: Partial<MemberData>): Promise<MemberData> {
    const [result] = await db
      .insert(members)
      .values({
        twitchLogin: member.twitchLogin!.toLowerCase(),
        twitchId: member.twitchId,
        twitchUrl: member.twitchUrl!,
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        displayName: member.displayName!,
        siteUsername: member.siteUsername,
        role: member.role || 'Affilié',
        isVip: member.isVip || false,
        isActive: member.isActive !== false,
        badges: member.badges || [],
        listId: member.listId,
        roleManuallySet: member.roleManuallySet || false,
        twitchStatus: member.twitchStatus || null,
        description: member.description,
        customBio: member.customBio,
        integrationDate: member.integrationDate,
        roleHistory: member.roleHistory || [],
        parrain: member.parrain,
      })
      .returning();

    return this.mapToMemberData(result);
  }

  async update(login: string, updates: Partial<MemberData>): Promise<MemberData> {
    const [result] = await db
      .update(members)
      .set({
        ...updates,
        twitchLogin: updates.twitchLogin?.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(members.twitchLogin, login.toLowerCase()))
      .returning();

    if (!result) {
      throw new Error(`Member not found: ${login}`);
    }

    return this.mapToMemberData(result);
  }

  async delete(login: string): Promise<void> {
    await db
      .delete(members)
      .where(eq(members.twitchLogin, login.toLowerCase()));
  }

  private mapToMemberData(row: typeof members.$inferSelect): MemberData {
    return {
      twitchLogin: row.twitchLogin,
      twitchId: row.twitchId || undefined,
      twitchUrl: row.twitchUrl,
      discordId: row.discordId || undefined,
      discordUsername: row.discordUsername || undefined,
      displayName: row.displayName,
      siteUsername: row.siteUsername || undefined,
      role: row.role as any,
      isVip: row.isVip,
      isActive: row.isActive,
      badges: row.badges || undefined,
      listId: row.listId || undefined,
      roleManuallySet: row.roleManuallySet || undefined,
      twitchStatus: row.twitchStatus || undefined,
      description: row.description || undefined,
      customBio: row.customBio || undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy || undefined,
      integrationDate: row.integrationDate || undefined,
      roleHistory: row.roleHistory || undefined,
      parrain: row.parrain || undefined,
    };
  }
}

export const memberRepository = new MemberRepository();
```

Créer des repositories similaires pour :
- `EventRepository.ts`
- `SpotlightRepository.ts`
- `EvaluationRepository.ts`
- `VipRepository.ts`

### Étape 5.2 : Créer un Cache Redis (Optionnel)

Créer `lib/cache/redis.ts` :

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300 // 5 minutes par défaut
): Promise<T> {
  // Essayer de récupérer depuis le cache
  const cached = await redis.get<T>(key);
  if (cached) {
    return cached;
  }

  // Si pas en cache, exécuter la fonction et mettre en cache
  const data = await fetcher();
  await redis.set(key, data, { ex: ttl });
  return data;
}

export async function invalidateCache(pattern: string): Promise<void> {
  // Upstash Redis ne supporte pas directement les patterns
  // Il faudrait maintenir une liste des clés ou utiliser un préfixe
  // Pour l'instant, on laisse cette fonction pour l'implémentation future
}

export { redis };
```

### Étape 5.3 : Migrer les Routes API

Exemple de migration d'une route API : `app/api/members/public/route.ts` :

**AVANT (V2)** :
```typescript
import { loadMemberDataFromStorage, getAllActiveMemberDataFromAllLists } from '@/lib/memberData';

export async function GET() {
  await loadMemberDataFromStorage();
  const activeMembers = getAllActiveMemberDataFromAllLists();
  // ...
}
```

**APRÈS (V3)** :
```typescript
import { memberRepository } from '@/lib/repositories/MemberRepository';
import { getCached } from '@/lib/cache/redis';

export async function GET() {
  const activeMembers = await getCached(
    'members:active',
    () => memberRepository.findActive(100, 0),
    300 // Cache 5 minutes
  );
  // ...
}
```

### Étape 5.4 : Créer des Services

Créer `lib/services/MemberService.ts` :

```typescript
import { memberRepository } from '../repositories/MemberRepository';
import { getCached } from '../cache/redis';
import type { MemberData } from '../memberData';

export class MemberService {
  async getActiveMembers(limit = 50, offset = 0): Promise<MemberData[]> {
    return getCached(
      `members:active:${limit}:${offset}`,
      () => memberRepository.findActive(limit, offset),
      300
    );
  }

  async getMemberByTwitchLogin(login: string): Promise<MemberData | null> {
    return getCached(
      `member:${login.toLowerCase()}`,
      () => memberRepository.findByTwitchLogin(login),
      600 // Cache 10 minutes pour les membres individuels
    );
  }

  async updateMember(login: string, updates: Partial<MemberData>): Promise<MemberData> {
    const updated = await memberRepository.update(login, updates);
    // Invalider le cache
    await redis.del(`member:${login.toLowerCase()}`);
    await redis.del('members:active:*'); // Pattern (à implémenter)
    return updated;
  }
}

export const memberService = new MemberService();
```

---

## Phase 6 : Tests et Validation

### Étape 6.1 : Tests Manuels

1. **Tester l'affichage des membres** :
   - Aller sur `/membres`
   - Vérifier que tous les membres s'affichent

2. **Tester la modification d'un membre** :
   - Aller dans `/admin/membres`
   - Modifier un membre
   - Vérifier que la modification est sauvegardée

3. **Tester les événements** :
   - Aller sur `/events`
   - Vérifier que les événements s'affichent

4. **Tester les spotlights** :
   - Aller dans `/admin/spotlight`
   - Vérifier que les spotlights s'affichent

### Étape 6.2 : Comparer les Données

Créer un script de comparaison : `migration/compare-data.ts` :

```typescript
// Comparer les données entre Netlify Blobs et Supabase
// Pour vérifier que la migration est complète
```

### Étape 6.3 : Tests de Performance

1. Mesurer le temps de chargement des pages avant/après
2. Vérifier que le cache fonctionne
3. Tester avec plusieurs utilisateurs simultanés

---

## Phase 7 : Déploiement

### Étape 7.1 : Mettre à Jour les Variables d'Environnement Netlify

1. Aller dans Netlify Dashboard → **Site settings** → **Environment variables**
2. Ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `UPSTASH_REDIS_URL` (si utilisé)
   - `UPSTASH_REDIS_TOKEN` (si utilisé)

### Étape 7.2 : Déployer en Staging

1. Créer une branche `staging/v3`
2. Pousser vers Netlify
3. Tester sur l'URL de staging

### Étape 7.3 : Migration Progressive (Recommandé)

Au lieu de migrer tout d'un coup, on peut faire une migration progressive :

1. **Phase 1** : Migrer uniquement la lecture (GET)
   - Les écritures continuent sur Netlify Blobs
   - Les lectures se font depuis Supabase

2. **Phase 2** : Migrer les écritures progressivement
   - Commencer par les moins critiques
   - Tester chaque endpoint

3. **Phase 3** : Migration complète
   - Tous les endpoints utilisent Supabase
   - Désactiver Netlify Blobs

### Étape 7.4 : Rollback Plan

En cas de problème, avoir un plan de rollback :

1. Garder l'ancien code dans une branche `v2-backup`
2. Pouvoir revenir rapidement à V2
3. Avoir un script pour re-exporter depuis Supabase vers Blobs si nécessaire

---

## Dépannage

### Problème : Erreur de connexion à Supabase

**Solution** :
- Vérifier que `DATABASE_URL` est correct
- Vérifier que les clés API sont correctes
- Vérifier que le projet Supabase est actif

### Problème : Données manquantes après migration

**Solution** :
- Vérifier les logs du script d'import
- Comparer le nombre d'enregistrements avant/après
- Ré-exécuter le script d'import si nécessaire

### Problème : Performance dégradée

**Solution** :
- Vérifier que les index sont créés
- Activer le cache Redis
- Optimiser les requêtes SQL

### Problème : Erreurs TypeScript

**Solution** :
- Vérifier que tous les types sont correctement mappés
- Utiliser `as any` temporairement si nécessaire (à corriger ensuite)

---

## Checklist Finale

- [ ] Supabase configuré et accessible
- [ ] Schéma de base de données créé et migré
- [ ] Données exportées depuis Netlify Blobs
- [ ] Données importées vers Supabase
- [ ] Repositories créés pour toutes les entités
- [ ] Routes API migrées
- [ ] Cache Redis configuré (optionnel)
- [ ] Tests manuels effectués
- [ ] Variables d'environnement configurées sur Netlify
- [ ] Déploiement en staging testé
- [ ] Documentation mise à jour
- [ ] Plan de rollback préparé

---

## Ressources Utiles

- **Documentation Supabase** : https://supabase.com/docs
- **Documentation Drizzle ORM** : https://orm.drizzle.team
- **Documentation Upstash Redis** : https://docs.upstash.com/redis
- **Next.js App Router** : https://nextjs.org/docs/app

---

## Support

En cas de problème, vérifier :
1. Les logs dans la console Netlify
2. Les logs Supabase (Dashboard → Logs)
3. Les erreurs dans la console du navigateur

---

**Bon courage pour la migration ! 🚀**
