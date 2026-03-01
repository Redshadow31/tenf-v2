/**
 * Stockage configurable des membres du staff pour le suivi des follows
 * Liste stockée dans Netlify Blobs, avec fallback sur la liste par défaut
 */

import fs from 'fs';
import path from 'path';

export interface FollowStaffEntry {
  slug: string;
  displayName: string;
  isActive: boolean;
  order: number;
}

const STORE_NAME = 'tenf-admin-access';
const STAFF_KEY = 'follow-staff-list';

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

/**
 * Charge la liste des membres du staff (depuis Blobs ou fichier local)
 * Si vide, initialise avec la liste par défaut
 */
export async function loadFollowStaffList(): Promise<FollowStaffEntry[]> {
  try {
    let list: FollowStaffEntry[] = [];

    if (isNetlify()) {
      try {
        const { getBlobStore } = await import('@/lib/memberData');
        const store = getBlobStore(STORE_NAME);
        const stored = await store.get(STAFF_KEY);
        if (stored) {
          list = JSON.parse(stored);
        }
      } catch (e) {
        console.error('[FollowStaffStorage] Erreur chargement Blobs:', e);
      }
    } else {
      const filePath = path.join(process.cwd(), 'data', 'follow-staff.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        list = JSON.parse(content);
      }
    }

    if (!list || list.length === 0) {
      list = [...DEFAULT_STAFF];
      await saveFollowStaffList(list);
    }

    return list.sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('[FollowStaffStorage] Erreur:', e);
    return [...DEFAULT_STAFF];
  }
}

/**
 * Sauvegarde la liste des membres du staff
 */
export async function saveFollowStaffList(list: FollowStaffEntry[]): Promise<void> {
  try {
    const sorted = [...list].sort((a, b) => a.order - b.order);

    if (isNetlify()) {
      const { getBlobStore } = await import('@/lib/memberData');
      const store = getBlobStore(STORE_NAME);
      await store.set(STAFF_KEY, JSON.stringify(sorted, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(
        path.join(dataDir, 'follow-staff.json'),
        JSON.stringify(sorted, null, 2),
        'utf-8'
      );
    }
  } catch (e) {
    console.error('[FollowStaffStorage] Erreur sauvegarde:', e);
    throw e;
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
