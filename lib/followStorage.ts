// Stockage des validations de follow dans Supabase
// Table: follow_validations
// Compat: fallback legacy Blobs/fichier local + migration lazy.

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/db/supabase';

// ============================================
// TYPES
// ============================================

export type FollowStatus = 'followed' | 'not_followed' | 'unknown';

export interface MemberFollowValidation {
  twitchLogin: string;
  displayName: string;
  role?: string;
  status: FollowStatus; // Ancien champ, conservé pour compatibilité
  validatedAt: string; // ISO timestamp
  // Nouveaux champs pour le suivi amélioré
  jeSuis?: boolean; // Le staff suit ce membre
  meSuit?: boolean | null; // Ce membre suit le staff (null = inconnu)
}

export interface StaffFollowValidation {
  staffSlug: string;
  staffName: string;
  month: string; // YYYY-MM
  members: MemberFollowValidation[];
  moderatorComments?: string;
  validatedAt: string; // ISO timestamp
  validatedBy: string; // Discord ID
  // Nouvelles métadonnées pour Red
  staffTwitchId?: string;
  staffDiscordId?: string;
  // Stats agrégées
  stats?: {
    totalMembers: number;
    totalJeSuis: number; // Nombre de membres que le staff suit
    totalRetour: number; // Nombre de follows retour (jeSuis=true ET meSuit=true)
    tauxRetour: number; // Pourcentage de retour (totalRetour / totalJeSuis * 100)
  };
}

// ============================================
// UTILITAIRES
// ============================================

const STORE_NAME = 'tenf-follow-validations';
const FOLLOW_VALIDATIONS_TABLE = 'follow_validations';

function isNetlify(): boolean {
  if (process.env.NETLIFY || process.env.NETLIFY_DEV) {
    return true;
  }
  if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT) {
    return true;
  }
  if (process.env.NETLIFY_FUNCTIONS_VERSION) {
    return true;
  }
  try {
    if (typeof window === "undefined") {
      const { getStore } = require("@netlify/blobs");
      if (getStore) {
        const fs = require("fs");
        const path = require("path");
        const dataDir = path.join(process.cwd(), "data");
        try {
          if (fs.existsSync(dataDir) && fs.statSync(dataDir).isDirectory()) {
            return false;
          }
        } catch {
          // Ignorer
        }
        return true;
      }
    }
  } catch {
    // Ignorer
  }
  return false;
}

function monthToKey(month: string): string {
  return /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : month;
}

function keyToMonth(key: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(key)) return key.slice(0, 7);
  return key;
}

function normalizeValidation(validation: StaffFollowValidation): StaffFollowValidation {
  return {
    ...validation,
    staffSlug: (validation.staffSlug || '').trim().toLowerCase(),
    month: keyToMonth(validation.month),
    members: Array.isArray(validation.members) ? validation.members : [],
    validatedAt: validation.validatedAt || new Date().toISOString(),
    validatedBy: validation.validatedBy || 'system',
  };
}

function rowToValidation(row: any): StaffFollowValidation {
  return normalizeValidation({
    staffSlug: row.staff_slug,
    staffName: row.staff_name || row.staff_slug,
    month: keyToMonth(row.month_key),
    members: Array.isArray(row.members) ? row.members : [],
    moderatorComments: row.moderator_comments || '',
    validatedAt: row.validated_at || row.updated_at || row.created_at || new Date().toISOString(),
    validatedBy: row.validated_by || 'system',
    staffTwitchId: row.staff_twitch_id || undefined,
    staffDiscordId: row.staff_discord_id || undefined,
    stats: row.stats || undefined,
  });
}

function validationToRow(validation: StaffFollowValidation): any {
  const normalized = normalizeValidation(validation);
  return {
    month_key: monthToKey(normalized.month),
    staff_slug: normalized.staffSlug,
    staff_name: normalized.staffName || normalized.staffSlug,
    members: normalized.members || [],
    moderator_comments: normalized.moderatorComments || null,
    validated_at: normalized.validatedAt,
    validated_by: normalized.validatedBy || 'system',
    staff_twitch_id: normalized.staffTwitchId || null,
    staff_discord_id: normalized.staffDiscordId || null,
    stats: normalized.stats || null,
    updated_at: new Date().toISOString(),
  };
}

async function getLegacyValidation(staffSlug: string, month: string): Promise<StaffFollowValidation | null> {
  try {
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(`${month}/${staffSlug}.json`, { type: 'json' }).catch(() => null);
      return data as StaffFollowValidation | null;
    }

    const dataDir = path.join(process.cwd(), 'data', 'follow-validations', month);
    const filePath = path.join(dataDir, `${staffSlug}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content) as StaffFollowValidation;
    }
    return null;
  } catch {
    return null;
  }
}

async function listLegacyValidationsForMonth(month: string): Promise<StaffFollowValidation[]> {
  try {
    const validations: StaffFollowValidation[] = [];

    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const list = await store.list({ prefix: `${month}/` });
      for (const item of list.blobs || []) {
        try {
          const data = await store.get(item.key, { type: 'json' });
          if (data) validations.push(normalizeValidation(data as StaffFollowValidation));
        } catch {
          // ignore
        }
      }
      return validations;
    }

    const dataDir = path.join(process.cwd(), 'data', 'follow-validations', month);
    if (fs.existsSync(dataDir)) {
      const files = fs.readdirSync(dataDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const filePath = path.join(dataDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          validations.push(normalizeValidation(JSON.parse(content) as StaffFollowValidation));
        } catch {
          // ignore
        }
      }
    }
    return validations;
  } catch {
    return [];
  }
}

async function saveManyToSupabase(validations: StaffFollowValidation[]): Promise<void> {
  if (!validations.length) return;
  const rows = validations.map(validationToRow);
  const { error } = await supabaseAdmin
    .from(FOLLOW_VALIDATIONS_TABLE)
    .upsert(rows, { onConflict: 'month_key,staff_slug' });
  if (error) throw error;
}

async function saveLegacyValidation(validation: StaffFollowValidation): Promise<void> {
  const normalized = normalizeValidation(validation);
  if (isNetlify()) {
    const store = getStore(STORE_NAME);
    await store.set(
      `${normalized.month}/${normalized.staffSlug}.json`,
      JSON.stringify(normalized, null, 2)
    );
    return;
  }

  const dataDir = path.join(process.cwd(), 'data', 'follow-validations', normalized.month);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const filePath = path.join(dataDir, `${normalized.staffSlug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(normalized, null, 2), 'utf-8');
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// ============================================
// CRUD VALIDATIONS
// ============================================

/**
 * Récupère la validation de follow pour un membre du staff et un mois donné
 */
export async function getStaffFollowValidation(
  staffSlug: string,
  month: string
): Promise<StaffFollowValidation | null> {
  try {
    const normalizedSlug = (staffSlug || '').toLowerCase().trim();
    const monthKey = monthToKey(month);

    const { data, error } = await supabaseAdmin
      .from(FOLLOW_VALIDATIONS_TABLE)
      .select('*')
      .eq('month_key', monthKey)
      .eq('staff_slug', normalizedSlug)
      .maybeSingle();

    if (!error && data) {
      return rowToValidation(data);
    }

    // Fallback legacy + migration lazy
    const legacy = await getLegacyValidation(normalizedSlug, keyToMonth(monthKey));
    if (legacy) {
      try {
        await saveStaffFollowValidation(legacy);
      } catch {
        // best effort: la table Supabase peut ne pas exister temporairement
      }
      return normalizeValidation(legacy);
    }

    return null;
  } catch (error) {
    console.error(`[FollowStorage] Erreur récupération validation ${staffSlug}/${month}:`, error);
    return null;
  }
}

/**
 * Sauvegarde une validation de follow
 */
export async function saveStaffFollowValidation(
  validation: StaffFollowValidation
): Promise<void> {
  try {
    const row = validationToRow(validation);
    const { error } = await supabaseAdmin
      .from(FOLLOW_VALIDATIONS_TABLE)
      .upsert(row, { onConflict: 'month_key,staff_slug' });
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error(`[FollowStorage] Erreur sauvegarde validation ${validation.staffSlug}/${validation.month}:`, error);
    // Compat transitoire: sauvegarde legacy si Supabase indisponible
    await saveLegacyValidation(validation);
  }
}

/**
 * Récupère toutes les validations pour un mois donné
 */
export async function getAllFollowValidationsForMonth(
  month: string
): Promise<StaffFollowValidation[]> {
  try {
    const monthKey = monthToKey(month);
    const { data, error } = await supabaseAdmin
      .from(FOLLOW_VALIDATIONS_TABLE)
      .select('*')
      .eq('month_key', monthKey)
      .order('staff_slug', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(rowToValidation);
    }

    // Fallback legacy + migration lazy
    const legacy = await listLegacyValidationsForMonth(keyToMonth(monthKey));
    if (legacy.length > 0) {
      try {
        await saveManyToSupabase(legacy);
      } catch {
        // best effort: la table Supabase peut ne pas exister temporairement
      }
      return legacy.map(normalizeValidation);
    }

    return [];
  } catch (error) {
    console.error(`[FollowStorage] Erreur récupération validations pour ${month}:`, error);
    return [];
  }
}

/**
 * Retourne le dernier mois (au sens chronologique, ≤ beforeOrEqualMonth) pour lequel il existe au moins une validation.
 * Utile pour qu'un mois sans données (ex. février) reprenne les dernières données enregistrées (ex. janvier).
 */
export async function getLastMonthWithData(beforeOrEqualMonth: string): Promise<string | null> {
  try {
    const beforeKey = monthToKey(beforeOrEqualMonth);
    const { data, error } = await supabaseAdmin
      .from(FOLLOW_VALIDATIONS_TABLE)
      .select('month_key')
      .lt('month_key', beforeKey)
      .order('month_key', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.month_key) {
      return keyToMonth(String(data.month_key));
    }
  } catch {
    // fallback legacy loop below
  }

  const [yearStr, monthStr] = beforeOrEqualMonth.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  for (let i = 0; i < 12; i++) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    const candidate = `${year}-${String(month).padStart(2, '0')}`;
    const validations = await getAllFollowValidationsForMonth(candidate);
    if (validations.length > 0) {
      return candidate;
    }
  }
  return null;
}

/**
 * Type souple pour supporter plusieurs formats de stockage
 */
export type StaffFollowValidationAny = {
  month?: string;
  staffSlug?: string;
  savedAt?: string;
  // Format A (simple) : liste de logins qui "me suivent"
  follows?: string[];
  // Format B : map par membre avec booléens (Je suis / Me suit)
  // + compat format actuel (tableau de MemberFollowValidation)
  members?: Record<string, { iFollow?: boolean; followsMe?: boolean }> | MemberFollowValidation[];
  // Format C : rows/tableau
  rows?: Array<{
    login?: string;
    user?: string;
    iFollow?: boolean;
    followsMe?: boolean;
    meSuit?: boolean;
  }>;
  // Format D : structure actuelle avec members array
  membersArray?: Array<{
    twitchLogin: string;
    displayName: string;
    role?: string;
    status?: FollowStatus;
    validatedAt?: string;
    jeSuis?: boolean;
    meSuit?: boolean | null;
  }>;
  // On tolère d'autres champs
  [key: string]: any;
};

/**
 * Liste toutes les validations de follow pour un mois donné
 * Supporte plusieurs formats de stockage
 */
export async function listStaffFollowValidations(month: string): Promise<StaffFollowValidationAny[]> {
  try {
    const validations = await getAllFollowValidationsForMonth(month);
    return validations.map((v) => ({
      ...v,
      month: v.month || month,
      staffSlug: v.staffSlug,
      savedAt: v.validatedAt,
      membersArray: v.members,
    }));
  } catch (error) {
    console.error(`[FollowStorage] Erreur listing validations pour ${month}:`, error);
    return [];
  }
}

/**
 * Vérifie si une validation est obsolète (plus de 30 jours)
 */
export function isValidationObsolete(validatedAt: string): boolean {
  const validationDate = new Date(validatedAt);
  const now = new Date();
  const diffMs = now.getTime() - validationDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 30;
}

/**
 * Calcule les statistiques pour une validation
 */
export function calculateFollowStats(validation: StaffFollowValidation): {
  totalMembers: number;
  followedCount: number;
  notFollowedCount: number;
  unknownCount: number;
  followRate: number; // Pourcentage (ancien calcul)
  // Nouvelles stats
  totalJeSuis: number; // Nombre de membres que le staff suit
  totalRetour: number; // Nombre de follows retour (jeSuis=true ET meSuit=true)
  tauxRetour: number; // Pourcentage de retour (totalRetour / totalJeSuis * 100)
} {
  const totalMembers = validation.members.length;
  const followedCount = validation.members.filter(m => m.status === 'followed').length;
  const notFollowedCount = validation.members.filter(m => m.status === 'not_followed').length;
  const unknownCount = validation.members.filter(m => m.status === 'unknown').length;
  
  const followRate = totalMembers > 0 
    ? Math.round((followedCount / totalMembers) * 100 * 10) / 10 
    : 0;
  
  // Nouvelles stats basées sur jeSuis et meSuit
  const totalJeSuis = validation.members.filter(m => m.jeSuis === true).length;
  const totalRetour = validation.members.filter(m => m.jeSuis === true && m.meSuit === true).length;
  const tauxRetour = totalJeSuis > 0
    ? Math.round((totalRetour / totalJeSuis) * 100 * 10) / 10
    : 0;
  
  return {
    totalMembers,
    followedCount,
    notFollowedCount,
    unknownCount,
    followRate,
    totalJeSuis,
    totalRetour,
    tauxRetour,
  };
}

