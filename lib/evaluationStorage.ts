// Stockage des évaluations mensuelles dans Netlify Blobs
// Architecture: tenf-evaluations/{YYYY-MM}/section-a.json, section-b.json, section-c.json, section-d.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface SpotlightEvaluation {
  id: string;
  date: string; // ISO date
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
  validatedAt?: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
}

export interface EventEvaluation {
  id: string;
  name: string;
  startDate: string; // ISO date
  endDate: string; // ISO date
  members: Array<{
    twitchLogin: string;
    present: boolean;
    comment?: string;
  }>;
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
}

export interface SectionAData {
  month: string; // YYYY-MM
  spotlights: SpotlightEvaluation[];
  events: EventEvaluation[];
  raidPoints: Record<string, number>; // twitchLogin -> points (calculé depuis les raids existants)
  spotlightBonus: Record<string, number>; // twitchLogin -> bonus points
  lastUpdated: string; // ISO timestamp
}

export interface FollowValidation {
  staffDiscordId: string;
  staffTwitchLogin: string;
  validatedAt: string; // ISO timestamp
  follows: Record<string, boolean>; // twitchLogin (membre évalué) -> suit ou non
}

export interface SectionCData {
  month: string; // YYYY-MM
  validations: FollowValidation[];
  lastUpdated: string; // ISO timestamp
}

export interface BonusEntry {
  id: string;
  twitchLogin: string;
  points: number;
  reason: string;
  type: 'decalage-horaire' | 'implication-qualitative' | 'conseils-remarquables' | 'autre';
  createdBy: string; // Discord ID
  createdAt: string; // ISO timestamp
}

export interface SectionDData {
  month: string; // YYYY-MM
  bonuses: BonusEntry[];
  summaryA?: number; // Points section A
  summaryB?: number; // Points section B
  summaryC?: number; // Points section C
  lastUpdated: string; // ISO timestamp
}

export interface FinalScore {
  twitchLogin: string;
  sectionA: number;
  sectionB: number;
  sectionC: number;
  sectionDBonuses: number;
  total: number;
  calculatedAt: string; // ISO timestamp
}

export interface EvaluationFinalResult {
  month: string; // YYYY-MM
  scores: FinalScore[];
  calculatedAt: string; // ISO timestamp
  calculatedBy: string; // Discord ID
}

// ============================================
// CONSTANTES
// ============================================

const EVALUATION_STORE_NAME = 'tenf-evaluations';

// ============================================
// UTILITAIRES
// ============================================

export function getMonthKey(year?: number, month?: number): string {
  const d = year && month ? new Date(year, month - 1) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKey();
}

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

function getMonthFolderPath(monthKey: string): string {
  return `${monthKey}`;
}

// ============================================
// SECTION A - PRÉSENCE ACTIVE
// ============================================

export async function loadSectionAData(monthKey: string): Promise<SectionAData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(monthKey)}/section-a.json`;
      const data = await store.get(key, { type: 'json' });
      return data as SectionAData | null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const filePath = path.join(dataDir, `${monthKey}`, 'section-a.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur chargement Section A pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveSectionAData(data: SectionAData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(data.month)}/section-a.json`;
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'section-a.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur sauvegarde Section A pour ${data.month}:`, error);
    throw error;
  }
}

// ============================================
// SECTION C - FOLLOW
// ============================================

export async function loadSectionCData(monthKey: string): Promise<SectionCData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(monthKey)}/section-c.json`;
      const data = await store.get(key, { type: 'json' });
      return data as SectionCData | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const filePath = path.join(dataDir, `${monthKey}`, 'section-c.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur chargement Section C pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveSectionCData(data: SectionCData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(data.month)}/section-c.json`;
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'section-c.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur sauvegarde Section C pour ${data.month}:`, error);
    throw error;
  }
}

// ============================================
// SECTION D - SYNTHÈSE & BONUS
// ============================================

export async function loadSectionDData(monthKey: string): Promise<SectionDData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(monthKey)}/section-d.json`;
      const data = await store.get(key, { type: 'json' });
      return data as SectionDData | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const filePath = path.join(dataDir, `${monthKey}`, 'section-d.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur chargement Section D pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveSectionDData(data: SectionDData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(data.month)}/section-d.json`;
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'section-d.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur sauvegarde Section D pour ${data.month}:`, error);
    throw error;
  }
}

// ============================================
// RÉSULTAT FINAL
// ============================================

export async function loadFinalResult(monthKey: string): Promise<EvaluationFinalResult | null> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(monthKey)}/final-result.json`;
      const data = await store.get(key, { type: 'json' });
      return data as EvaluationFinalResult | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const filePath = path.join(dataDir, `${monthKey}`, 'final-result.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur chargement résultat final pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveFinalResult(data: EvaluationFinalResult): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(EVALUATION_STORE_NAME);
      const key = `${getMonthFolderPath(data.month)}/final-result.json`;
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'final-result.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[EvaluationStorage] Erreur sauvegarde résultat final pour ${data.month}:`, error);
    throw error;
  }
}

