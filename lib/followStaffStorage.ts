/**
 * Stockage configurable des membres du staff pour le suivi des follows.
 * Source principale: Supabase.
 * Compat: fallback lecture Blobs/fichier local + migration lazy vers Supabase.
 */

import fs from 'fs';
import path from 'path';
import { supabaseAdmin } from '@/lib/db/supabase';
import { getBlobStore } from '@/lib/memberData';

export interface FollowStaffEntry {
  slug: string;
  displayName: string;
  isActive: boolean;
  order: number;
}

const STORE_NAME = 'tenf-admin-access';
const STAFF_KEY = 'follow-staff-list';
const FOLLOW_STAFF_TABLE = 'follow_staff';

const DEFAULT_STAFF: FollowStaffEntry[] = [
  { slug: 'red', displayName: 'Red', isActive: true, order: 0 },
  { slug: 'clara', displayName: 'Clara', isActive: true, order: 1 },
  { slug: 'nexou', displayName: 'Nexou', isActive: true, order: 2 },
  { slug: 'tabs', displayName: 'Tabs', isActive: true, order: 3 },
  { slug: 'nangel', displayName: 'Nangel', isActive: true, order: 4 },
  { slug: 'jenny', displayName: 'Jenny', isActive: true, order: 5 },
  { slug: 'selena', displayName: 'Selena', isActive: true, order: 6 },
  { slug: 'dark', displayName: 'Dark', isActive: true, order: 7 },
  { slug: 'yaya', displayName: 'Yaya', isActive: true, order: 8 },
  { slug: 'rubby', displayName: 'Rubby', isActive: true, order: 9 },
  { slug: 'livio', displayName: 'Livio', isActive: true, order: 10 },
  { slug: 'rebelle', displayName: 'Rebelle', isActive: true, order: 11 },
  { slug: 'sigurdson', displayName: 'Sigurdson', isActive: true, order: 12 },
  { slug: 'nico', displayName: 'Nico', isActive: true, order: 13 },
  { slug: 'willy', displayName: 'Willy', isActive: true, order: 14 },
  { slug: 'b1nx', displayName: 'B1nx', isActive: true, order: 15 },
  { slug: 'spydy', displayName: 'Spydy', isActive: true, order: 16 },
  { slug: 'simon', displayName: 'Simon', isActive: true, order: 17 },
  { slug: 'zylkao', displayName: 'Zylkao', isActive: true, order: 18 },
];

function isNetlify(): boolean {
  return !!(process.env.NETLIFY || process.env.NETLIFY_DEV || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

function normalizeStaffList(list: FollowStaffEntry[]): FollowStaffEntry[] {
  return list
    .map((e, index) => ({
      slug: e.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      displayName: e.displayName.trim(),
      isActive: !!e.isActive,
      order: Number.isFinite(e.order) ? Number(e.order) : index,
    }))
    .sort((a, b) => a.order - b.order);
}

function mapRowToEntry(row: any): FollowStaffEntry {
  return {
    slug: row.slug,
    displayName: row.display_name,
    isActive: !!row.is_active,
    order: typeof row.order_index === 'number' ? row.order_index : 0,
  };
}

async function loadLegacyFollowStaffList(): Promise<FollowStaffEntry[]> {
  try {
    let list: FollowStaffEntry[] = [];

    if (isNetlify()) {
      const store = getBlobStore(STORE_NAME);
      const stored = await store.get(STAFF_KEY);
      if (stored) {
        list = JSON.parse(stored) as FollowStaffEntry[];
      }
    } else {
      const filePath = path.join(process.cwd(), 'data', 'follow-staff.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        list = JSON.parse(content) as FollowStaffEntry[];
      }
    }

    if (!list.length) {
      return [...DEFAULT_STAFF];
    }

    return normalizeStaffList(list);
  } catch (e) {
    console.error('[FollowStaffStorage] Erreur chargement legacy:', e);
    return [...DEFAULT_STAFF];
  }
}

async function saveLegacyFollowStaffList(list: FollowStaffEntry[]): Promise<void> {
  const sorted = normalizeStaffList(list);
  if (isNetlify()) {
    const store = getBlobStore(STORE_NAME);
    await store.set(STAFF_KEY, JSON.stringify(sorted, null, 2));
    return;
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(
    path.join(dataDir, 'follow-staff.json'),
    JSON.stringify(sorted, null, 2),
    'utf-8'
  );
}

/**
 * Charge la liste des membres du staff (depuis Blobs ou fichier local)
 * Si vide, initialise avec la liste par défaut
 */
export async function loadFollowStaffList(): Promise<FollowStaffEntry[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(FOLLOW_STAFF_TABLE)
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map(mapRowToEntry);
    }

    // Fallback legacy + migration lazy
    const legacyList = await loadLegacyFollowStaffList();
    await saveFollowStaffList(legacyList);
    return legacyList;
  } catch (e) {
    console.error('[FollowStaffStorage] Erreur:', e);
    const legacyList = await loadLegacyFollowStaffList();
    return legacyList.length ? legacyList : [...DEFAULT_STAFF];
  }
}

/**
 * Sauvegarde la liste des membres du staff
 */
export async function saveFollowStaffList(list: FollowStaffEntry[]): Promise<void> {
  try {
    const sorted = normalizeStaffList(list);
    const rows = sorted.map((e) => ({
      slug: e.slug,
      display_name: e.displayName,
      is_active: e.isActive,
      order_index: e.order,
      updated_at: new Date().toISOString(),
    }));

    // Sync complet simple: delete + insert
    const { error: deleteError } = await supabaseAdmin
      .from(FOLLOW_STAFF_TABLE)
      .delete()
      .neq('slug', '__never__');
    if (deleteError) {
      throw deleteError;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from(FOLLOW_STAFF_TABLE)
        .insert(rows);
      if (insertError) {
        throw insertError;
      }
    }
  } catch (e) {
    console.error('[FollowStaffStorage] Erreur sauvegarde:', e);
    // Compat transitoire si table Supabase absente
    await saveLegacyFollowStaffList(list);
  }
}

/**
 * Retourne les membres actifs uniquement (pour le hub)
 */
export async function getActiveFollowStaff(): Promise<FollowStaffEntry[]> {
  const list = await loadFollowStaffList();
  return list.filter((e) => e.isActive);
}

/**
 * Retourne tous les membres (actifs et inactifs) - pour la gestion admin
 */
export async function getAllFollowStaff(): Promise<FollowStaffEntry[]> {
  return loadFollowStaffList();
}
