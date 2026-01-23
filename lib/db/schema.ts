// Schéma de base de données Supabase pour TENF V3
// Utilise Drizzle ORM pour la type-safety et les migrations

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
  'Soirée Film',
  'Apéro',
  'Formation',
  'Jeux communautaire',
  'Ateliers créateurs',
  'Aventura 2025',
  'Organisation Aventura 2026'
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
  id: text('id').primaryKey(), // Utiliser text pour accepter les IDs personnalisés
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
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  twitchLogin: text('twitch_login').notNull(),
  displayName: text('display_name').notNull(),
  discordId: text('discord_id'),
  discordUsername: text('discord_username'),
  notes: text('notes'),
  registeredAt: timestamp('registered_at').defaultNow(),
});

// Table: spotlights
export const spotlights = pgTable('spotlights', {
  id: text('id').primaryKey(), // Utiliser text pour accepter les IDs personnalisés
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
  spotlightId: text('spotlight_id').notNull().references(() => spotlights.id, { onDelete: 'cascade' }),
  twitchLogin: text('twitch_login').notNull(),
  displayName: text('display_name'),
  addedAt: timestamp('added_at').defaultNow(),
  addedBy: text('added_by').notNull(), // Discord ID
});

// Table: spotlight_evaluations
export const spotlightEvaluations = pgTable('spotlight_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  spotlightId: text('spotlight_id').notNull().references(() => spotlights.id, { onDelete: 'cascade' }),
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
  raidPointsManual: integer('raid_points_manual'), // Points manuels (surcharge le calcul automatique)
  raidNotes: jsonb('raid_notes').$type<Array<{
    twitchLogin: string;
    note?: string; // Note texte libre
    manualPoints?: number; // Points manuels (0-5)
    lastUpdated: string; // ISO timestamp
    updatedBy: string; // Discord ID
  }>>(),
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
  
  // Note finale manuelle (optionnelle, peut être définie lors de la synthèse)
  finalNote: integer('final_note'),
  finalNoteSavedAt: timestamp('final_note_saved_at'),
  finalNoteSavedBy: text('final_note_saved_by'), // Discord ID
  
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
