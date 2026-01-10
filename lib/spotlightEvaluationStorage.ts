// Stockage des notes d'évaluation des spotlights mensuels dans Netlify Blobs
// Architecture: tenf-spotlight-evaluations/{YYYY-MM}/notes.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface SpotlightEvaluationNote {
  twitchLogin: string;
  note?: string; // Note manuelle (texte libre)
  lastUpdated: string; // ISO timestamp
  updatedBy: string; // Discord ID
}

export interface SpotlightEvaluationData {
  month: string; // YYYY-MM
  notes: Record<string, SpotlightEvaluationNote>; // twitchLogin -> note
  lastUpdated: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const SPOTLIGHT_EVALUATION_STORE_NAME = 'tenf-spotlight-evaluations';

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

export async function loadSpotlightEvaluationData(monthKey: string): Promise<SpotlightEvaluationData | null> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_EVALUATION_STORE_NAME);
      const key = getMonthFilePath(monthKey);
      const data = await store.get(key, { type: 'json' });
      return data as SpotlightEvaluationData | null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'spotlight-evaluations');
      const filePath = path.join(dataDir, getMonthFilePath(monthKey));
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[SpotlightEvaluationStorage] Erreur chargement pour ${monthKey}:`, error);
    return null;
  }
}

export async function saveSpotlightEvaluationData(data: SpotlightEvaluationData): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_EVALUATION_STORE_NAME);
      const key = getMonthFilePath(data.month);
      await store.set(key, JSON.stringify(data, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'spotlight-evaluations');
      const monthDir = path.join(dataDir, data.month);
      if (!fs.existsSync(monthDir)) {
        fs.mkdirSync(monthDir, { recursive: true });
      }
      const filePath = path.join(monthDir, 'notes.json');
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[SpotlightEvaluationStorage] Erreur sauvegarde pour ${data.month}:`, error);
    throw error;
  }
}

/**
 * Met à jour ou crée une note d'évaluation pour un membre
 */
export async function updateSpotlightEvaluationNote(
  monthKey: string,
  twitchLogin: string,
  note: string | undefined,
  updatedBy: string
): Promise<void> {
  let data = await loadSpotlightEvaluationData(monthKey);
  
  if (!data) {
    data = {
      month: monthKey,
      notes: {},
      lastUpdated: new Date().toISOString(),
    };
  }
  
  if (note === undefined || note.trim() === '') {
    // Supprimer la note si elle est vide
    delete data.notes[twitchLogin.toLowerCase()];
  } else {
    // Mettre à jour ou créer la note
    data.notes[twitchLogin.toLowerCase()] = {
      twitchLogin: twitchLogin.toLowerCase(),
      note: note.trim(),
      lastUpdated: new Date().toISOString(),
      updatedBy,
    };
  }
  
  data.lastUpdated = new Date().toISOString();
  await saveSpotlightEvaluationData(data);
}

/**
 * Récupère la note d'évaluation pour un membre
 */
export async function getSpotlightEvaluationNote(
  monthKey: string,
  twitchLogin: string
): Promise<string | undefined> {
  const data = await loadSpotlightEvaluationData(monthKey);
  if (!data) return undefined;
  return data.notes[twitchLogin.toLowerCase()]?.note;
}

