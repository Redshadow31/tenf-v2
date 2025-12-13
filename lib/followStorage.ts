// Stockage des validations de follow dans Netlify Blobs
// Architecture: tenf-follow-validations/{YYYY-MM}/{staffSlug}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export type FollowStatus = 'followed' | 'not_followed' | 'unknown';

export interface MemberFollowValidation {
  twitchLogin: string;
  displayName: string;
  role?: string;
  status: FollowStatus;
  validatedAt: string; // ISO timestamp
}

export interface StaffFollowValidation {
  staffSlug: string;
  staffName: string;
  month: string; // YYYY-MM
  members: MemberFollowValidation[];
  moderatorComments?: string;
  validatedAt: string; // ISO timestamp
  validatedBy: string; // Discord ID
}

// ============================================
// UTILITAIRES
// ============================================

const STORE_NAME = 'tenf-follow-validations';

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
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const data = await store.get(`${month}/${staffSlug}.json`, { type: 'json' }).catch(() => null);
      return data as StaffFollowValidation | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'follow-validations', month);
      const filePath = path.join(dataDir, `${staffSlug}.json`);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
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
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      await store.set(
        `${validation.month}/${validation.staffSlug}.json`,
        JSON.stringify(validation, null, 2)
      );
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'follow-validations', validation.month);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, `${validation.staffSlug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(validation, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[FollowStorage] Erreur sauvegarde validation ${validation.staffSlug}/${validation.month}:`, error);
    throw error;
  }
}

/**
 * Récupère toutes les validations pour un mois donné
 */
export async function getAllFollowValidationsForMonth(
  month: string
): Promise<StaffFollowValidation[]> {
  try {
    const validations: StaffFollowValidation[] = [];
    
    if (isNetlify()) {
      const store = getStore(STORE_NAME);
      const list = await store.list({ prefix: `${month}/` });
      
      // Itérer sur les blobs
      let cursor: string | undefined;
      do {
        const result = cursor 
          ? await store.list({ prefix: `${month}/`, cursor })
          : list;
        
        for (const item of result.blobs) {
          try {
            const data = await store.get(item.key, { type: 'json' });
            if (data) {
              validations.push(data as StaffFollowValidation);
            }
          } catch (error) {
            console.error(`[FollowStorage] Erreur lecture ${item.key}:`, error);
          }
        }
        
        cursor = result.cursor;
      } while (cursor);
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'follow-validations', month);
      if (fs.existsSync(dataDir)) {
        const files = fs.readdirSync(dataDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(dataDir, file);
              const content = fs.readFileSync(filePath, 'utf-8');
              const data = JSON.parse(content);
              validations.push(data as StaffFollowValidation);
            } catch (error) {
              console.error(`[FollowStorage] Erreur lecture ${file}:`, error);
            }
          }
        }
      }
    }
    
    return validations;
  } catch (error) {
    console.error(`[FollowStorage] Erreur récupération validations pour ${month}:`, error);
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
  followRate: number; // Pourcentage
} {
  const totalMembers = validation.members.length;
  const followedCount = validation.members.filter(m => m.status === 'followed').length;
  const notFollowedCount = validation.members.filter(m => m.status === 'not_followed').length;
  const unknownCount = validation.members.filter(m => m.status === 'unknown').length;
  
  const followRate = totalMembers > 0 
    ? Math.round((followedCount / totalMembers) * 100 * 10) / 10 
    : 0;
  
  return {
    totalMembers,
    followedCount,
    notFollowedCount,
    unknownCount,
    followRate,
  };
}

