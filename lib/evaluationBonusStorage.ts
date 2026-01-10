// Stockage des bonus d'évaluation mensuels (Section D) dans Netlify Blobs
// Architecture: tenf-evaluation-bonus/{YYYY-MM}/bonus.json
// ⚠️ Ce fichier utilise fs (Node.js) et ne doit être importé que dans des routes API (serveur)

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';
import type { MemberBonus } from './evaluationBonusHelpers';

// ============================================
// TYPES
// ============================================

export interface EvaluationBonusData {
  month: string; // YYYY-MM
  bonuses: Record<string, MemberBonus>; // twitchLogin -> bonus
  lastUpdated: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const BONUS_STORE_NAME = 'tenf-evaluation-bonus';

// ============================================
// UTILITAIRES
// ============================================

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

function getMonthFilePath(monthKey: string): string {
  return `${monthKey}/bonus.json`;
}

// ============================================
// CHARGEMENT ET SAUVEGARDE
// ============================================

export async function loadEvaluationBonusData(monthKey: string): Promise<EvaluationBonusData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(BONUS_STORE_NAME);
      const key = getMonthFilePath(monthKey);
      const data = await store.get(key, { type: 'json' });
      return data as EvaluationBonusData | null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluation-bonus');
      const filePath = path.join(dataDir, getMonthFilePath(monthKey));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EvaluationBonusStorage] Erreur chargement bonus pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveEvaluationBonusData(data: EvaluationBonusData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(BONUS_STORE_NAME);
      const key = getMonthFilePath(data.month);
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluation-bonus');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'bonus.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EvaluationBonusStorage] Erreur sauvegarde bonus pour ${data.month}:`, error);
    throw error;
  }
}

/**
 * Met à jour ou crée les bonus pour un membre
 */
export async function updateMemberBonus(
  monthKey: string,
  twitchLogin: string,
  timezoneBonusEnabled: boolean,
  moderationBonus: number,
  updatedBy: string
): Promise<MemberBonus> {
  let data = await loadEvaluationBonusData(monthKey);
  
  if (!data) {
    data = {
      month: monthKey,
      bonuses: {},
      lastUpdated: new Date().toISOString(),
    };
  }
  
  // Valider moderationBonus (0-5)
  const validModerationBonus = Math.max(0, Math.min(5, moderationBonus));
  
  data.bonuses[twitchLogin.toLowerCase()] = {
    twitchLogin: twitchLogin.toLowerCase(),
    timezoneBonusEnabled,
    moderationBonus: validModerationBonus,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  
  data.lastUpdated = new Date().toISOString();
  await saveEvaluationBonusData(data);
  
  return data.bonuses[twitchLogin.toLowerCase()];
}

/**
 * Récupère les bonus pour un membre
 */
export async function getMemberBonus(monthKey: string, twitchLogin: string): Promise<MemberBonus | null> {
  const data = await loadEvaluationBonusData(monthKey);
  if (!data) return null;
  return data.bonuses[twitchLogin.toLowerCase()] || null;
}

/**
 * Récupère tous les bonus pour un mois
 */
export async function getAllBonuses(monthKey: string): Promise<Record<string, MemberBonus>> {
  const data = await loadEvaluationBonusData(monthKey);
  return data?.bonuses || {};
}

// Note: calculateBonusTotal et TIMEZONE_BONUS_POINTS sont maintenant dans lib/evaluationBonusHelpers.ts
// pour éviter les dépendances Node.js (fs) dans les composants client

