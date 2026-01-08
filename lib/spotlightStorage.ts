// Stockage des spotlights actifs et des évaluations dans Netlify Blobs
// Architecture: tenf-spotlights/active.json, evaluations/{spotlightId}.json

import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

// ============================================
// TYPES
// ============================================

export interface ActiveSpotlight {
  id: string;
  streamerTwitchLogin: string;
  streamerDisplayName?: string;
  startedAt: string; // ISO timestamp
  endsAt: string; // ISO timestamp (startedAt + 2h)
  status: 'active' | 'completed' | 'cancelled';
  moderatorDiscordId: string;
  moderatorUsername: string;
  createdAt: string; // ISO timestamp
  createdBy: string; // Discord ID
}

export interface SpotlightPresence {
  twitchLogin: string;
  displayName?: string;
  addedAt: string; // ISO timestamp
  addedBy: string; // Discord ID
}

export interface SpotlightEvaluationCriteria {
  id: string;
  label: string;
  maxValue: number;
  value: number;
}

export interface SpotlightEvaluation {
  spotlightId: string;
  streamerTwitchLogin: string;
  criteria: SpotlightEvaluationCriteria[];
  totalScore: number;
  maxScore: number;
  moderatorComments: string;
  evaluatedAt: string; // ISO timestamp
  evaluatedBy: string; // Discord ID
}

export interface SpotlightData {
  spotlight: ActiveSpotlight;
  presences: SpotlightPresence[];
  evaluation?: SpotlightEvaluation;
  validated: boolean;
  validatedAt?: string; // ISO timestamp
}

// ============================================
// CONSTANTES
// ============================================

const SPOTLIGHT_STORE_NAME = 'tenf-spotlights';

// ============================================
// UTILITAIRES
// ============================================

function isNetlify(): boolean {
  return typeof getStore === 'function' || 
         !!process.env.NETLIFY || 
         !!process.env.NETLIFY_DEV;
}

// ============================================
// SPOTLIGHT ACTIF
// ============================================

export async function getActiveSpotlight(): Promise<ActiveSpotlight | null> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      const data = await store.get('active.json', { type: 'json' });
      if (data) {
        // Si le spotlight est annulé, on le retourne quand même pour permettre l'affichage
        if (data.status === 'cancelled') {
          return data as ActiveSpotlight;
        }
        // Si le spotlight est actif, vérifier s'il n'a pas expiré
        if (data.status === 'active') {
          const endsAt = new Date(data.endsAt);
          const now = new Date();
          if (now > endsAt) {
            // Le spotlight a expiré, le marquer comme complété
            await saveActiveSpotlight({ ...data, status: 'completed' });
            return { ...data, status: 'completed' } as ActiveSpotlight;
          }
          return data as ActiveSpotlight;
        }
        // Si le spotlight est complété, on le retourne aussi
        if (data.status === 'completed') {
          return data as ActiveSpotlight;
        }
      }
      return null;
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const filePath = path.join(dataDir, 'active.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        if (data && data.status === 'active') {
          const endsAt = new Date(data.endsAt);
          const now = new Date();
          if (now > endsAt) {
            await saveActiveSpotlight({ ...data, status: 'completed' });
            return null;
          }
          return data as ActiveSpotlight;
        }
        return null;
      }
      return null;
    }
  } catch (error) {
    console.error('[SpotlightStorage] Erreur chargement spotlight actif:', error);
    return null;
  }
}

export async function saveActiveSpotlight(spotlight: ActiveSpotlight): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      await store.set('active.json', JSON.stringify(spotlight, null, 2));
    } else {
      // Développement local
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'active.json');
      fs.writeFileSync(filePath, JSON.stringify(spotlight, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('[SpotlightStorage] Erreur sauvegarde spotlight actif:', error);
    throw error;
  }
}

export async function createActiveSpotlight(
  streamerTwitchLogin: string,
  streamerDisplayName: string | undefined,
  moderatorDiscordId: string,
  moderatorUsername: string,
  createdBy: string
): Promise<ActiveSpotlight> {
  const now = new Date();
  const endsAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 heures

  const spotlight: ActiveSpotlight = {
    id: `spotlight-${Date.now()}`,
    streamerTwitchLogin,
    streamerDisplayName,
    startedAt: now.toISOString(),
    endsAt: endsAt.toISOString(),
    status: 'active',
    moderatorDiscordId,
    moderatorUsername,
    createdAt: now.toISOString(),
    createdBy,
  };

  await saveActiveSpotlight(spotlight);
  return spotlight;
}

// ============================================
// PRÉSENCES
// ============================================

export async function getSpotlightPresences(spotlightId: string): Promise<SpotlightPresence[]> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      const data = await store.get(`${spotlightId}/presences.json`, { type: 'json' });
      return (data || []) as SpotlightPresence[];
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const filePath = path.join(dataDir, `${spotlightId}`, 'presences.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return [];
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur chargement présences pour ${spotlightId}:`, error);
    return [];
  }
}

export async function saveSpotlightPresences(spotlightId: string, presences: SpotlightPresence[]): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      await store.set(`${spotlightId}/presences.json`, JSON.stringify(presences, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const spotlightDir = path.join(dataDir, spotlightId);
      if (!fs.existsSync(spotlightDir)) {
        fs.mkdirSync(spotlightDir, { recursive: true });
      }
      const filePath = path.join(spotlightDir, 'presences.json');
      fs.writeFileSync(filePath, JSON.stringify(presences, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur sauvegarde présences pour ${spotlightId}:`, error);
    throw error;
  }
}

export async function addSpotlightPresence(
  spotlightId: string,
  twitchLogin: string,
  displayName: string | undefined,
  addedBy: string
): Promise<void> {
  const presences = await getSpotlightPresences(spotlightId);
  
  // Vérifier si le membre n'est pas déjà présent
  if (presences.some(p => p.twitchLogin.toLowerCase() === twitchLogin.toLowerCase())) {
    return; // Déjà présent
  }

  presences.push({
    twitchLogin,
    displayName,
    addedAt: new Date().toISOString(),
    addedBy,
  });

  await saveSpotlightPresences(spotlightId, presences);
}

// ============================================
// ÉVALUATION
// ============================================

export async function getSpotlightEvaluation(spotlightId: string): Promise<SpotlightEvaluation | null> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      const data = await store.get(`${spotlightId}/evaluation.json`, { type: 'json' });
      return data as SpotlightEvaluation | null;
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const filePath = path.join(dataDir, `${spotlightId}`, 'evaluation.json');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
      return null;
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur chargement évaluation pour ${spotlightId}:`, error);
    return null;
  }
}

export async function saveSpotlightEvaluation(evaluation: SpotlightEvaluation): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      await store.set(`${evaluation.spotlightId}/evaluation.json`, JSON.stringify(evaluation, null, 2));
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const spotlightDir = path.join(dataDir, evaluation.spotlightId);
      if (!fs.existsSync(spotlightDir)) {
        fs.mkdirSync(spotlightDir, { recursive: true });
      }
      const filePath = path.join(spotlightDir, 'evaluation.json');
      fs.writeFileSync(filePath, JSON.stringify(evaluation, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur sauvegarde évaluation pour ${evaluation.spotlightId}:`, error);
    throw error;
  }
}

/**
 * Supprime l'évaluation d'un spotlight
 */
export async function deleteSpotlightEvaluation(spotlightId: string): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      await store.delete(`${spotlightId}/evaluation.json`);
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const filePath = path.join(dataDir, `${spotlightId}`, 'evaluation.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur suppression évaluation pour ${spotlightId}:`, error);
    throw error;
  }
}

/**
 * Supprime les présences d'un spotlight
 */
export async function deleteSpotlightPresences(spotlightId: string): Promise<void> {
  try {
    if (isNetlify()) {
      const store = getStore(SPOTLIGHT_STORE_NAME);
      await store.delete(`${spotlightId}/presences.json`);
    } else {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const filePath = path.join(dataDir, `${spotlightId}`, 'presences.json');
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur suppression présences pour ${spotlightId}:`, error);
    throw error;
  }
}

/**
 * Supprime toutes les données d'un spotlight (évaluation, présences, dossier complet)
 */
export async function deleteAllSpotlightData(spotlightId: string): Promise<void> {
  try {
    // Supprimer l'évaluation
    await deleteSpotlightEvaluation(spotlightId);
    
    // Supprimer les présences
    await deleteSpotlightPresences(spotlightId);
    
    // Supprimer le dossier complet (si en développement local)
    if (!isNetlify()) {
      const dataDir = path.join(process.cwd(), 'data', 'spotlights');
      const spotlightDir = path.join(dataDir, spotlightId);
      if (fs.existsSync(spotlightDir)) {
        fs.rmSync(spotlightDir, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.error(`[SpotlightStorage] Erreur suppression complète pour ${spotlightId}:`, error);
    throw error;
  }
}

// ============================================
// DONNÉES COMPLÈTES
// ============================================

export async function getSpotlightData(spotlightId: string): Promise<SpotlightData | null> {
  const spotlight = await getActiveSpotlight();
  if (!spotlight || spotlight.id !== spotlightId) {
    return null;
  }

  const presences = await getSpotlightPresences(spotlightId);
  const evaluation = await getSpotlightEvaluation(spotlightId);

  return {
    spotlight,
    presences,
    evaluation: evaluation || undefined,
    validated: false,
  };
}


