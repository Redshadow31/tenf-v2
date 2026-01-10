// Stockage des notes d'évaluation des raids mensuels dans Netlify Blobs
// Architecture: tenf-raid-evaluations/{YYYY-MM}/notes.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface RaidEvaluationNote {
  twitchLogin: string;
  note?: string; // Note manuelle (texte libre)
  manualPoints?: number; // Points manuels (0-5), si non défini, utilise les points calculés automatiquement
  lastUpdated: string; // ISO timestamp
  updatedBy: string; // Discord ID
}

export interface RaidEvaluationData {
  month: string; // YYYY-MM
  notes: Record<string, RaidEvaluationNote>; // twitchLogin -> note
  lastUpdated: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const RAID_EVALUATION_STORE_NAME = 'tenf-raid-evaluations';

// ============================================
// UTILITAIRES
// ============================================

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

function getMonthFilePath(monthKey: string): string {
  return `${monthKey}/notes.json`;
}

// ============================================
// CHARGEMENT ET SAUVEGARDE
// ============================================

export async function loadRaidEvaluationData(monthKey: string): Promise<RaidEvaluationData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(RAID_EVALUATION_STORE_NAME);
      const key = getMonthFilePath(monthKey);
      const data = await store.get(key, { type: 'json' });
      return data as RaidEvaluationData | null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'raid-evaluations');
      const filePath = path.join(dataDir, getMonthFilePath(monthKey));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[RaidEvaluationStorage] Erreur chargement pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveRaidEvaluationData(data: RaidEvaluationData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(RAID_EVALUATION_STORE_NAME);
      const key = getMonthFilePath(data.month);
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'raid-evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'notes.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[RaidEvaluationStorage] Erreur sauvegarde pour ${data.month}:`, error);
    throw error;
  }
}

/**
 * Met à jour ou crée une note d'évaluation pour un membre
 */
export async function updateRaidEvaluationNote(
  monthKey: string,
  twitchLogin: string,
  note: string | undefined,
  manualPoints: number | undefined,
  updatedBy: string
): Promise<void> {
  let data = await loadRaidEvaluationData(monthKey);
  
  if (!data) {
    data = {
      month: monthKey,
      notes: {},
      lastUpdated: new Date().toISOString(),
    };
  }
  
  const loginLower = twitchLogin.toLowerCase();
  const existingNote = data.notes[loginLower];
  
  // Si note et manualPoints sont vides/undefined, supprimer l'entrée complète
  if ((note === undefined || note.trim() === '') && (manualPoints === undefined || manualPoints === null)) {
    delete data.notes[loginLower];
  } else {
    // Mettre à jour ou créer la note avec les nouvelles valeurs
    data.notes[loginLower] = {
      twitchLogin: loginLower,
      note: note !== undefined && note.trim() !== '' ? note.trim() : existingNote?.note,
      manualPoints: manualPoints !== undefined && manualPoints !== null ? Math.max(0, Math.min(5, manualPoints)) : existingNote?.manualPoints,
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };
  }
  
  data.lastUpdated = new Date().toISOString();
  await saveRaidEvaluationData(data);
}

/**
 * Récupère la note d'évaluation pour un membre
 */
export async function getRaidEvaluationNote(
  monthKey: string,
  twitchLogin: string
): Promise<string | undefined> {
  const data = await loadRaidEvaluationData(monthKey);
  if (!data) return undefined;
  return data.notes[twitchLogin.toLowerCase()]?.note;
}

