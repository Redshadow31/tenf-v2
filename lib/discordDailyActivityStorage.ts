// Gestion du stockage des données d'activité Discord quotidiennes (messages et vocaux par jour)

import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

export interface DailyActivityPoint {
  date: string; // Format: "YYYY-MM-DD"
  messages: number;
  vocals: number; // Heures décimales
}

export interface DiscordDailyActivityStorage {
  data: DailyActivityPoint[];
  lastUpdated?: string;
  updatedBy?: string;
}

const STORE_NAME = 'tenf-discord-daily-activity';
const STORAGE_KEY = 'discord-daily-activity.json';
const DATA_DIR = path.join(process.cwd(), 'data', 'discord-daily-activity');

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
  return false;
}

/**
 * Charge les données d'activité Discord quotidiennes depuis Netlify Blobs
 */
export async function loadDiscordDailyActivity(): Promise<DiscordDailyActivityStorage> {
  if (isNetlify()) {
    try {
      const store = getStore(STORE_NAME);
      const data = await store.get(STORAGE_KEY, { type: 'text' });
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[Discord Daily Activity Storage] Erreur chargement Blobs:', error);
    }
  }

  // Fallback: système de fichiers local
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, STORAGE_KEY);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('[Discord Daily Activity Storage] Erreur chargement fichier:', error);
  }

  return { data: [] };
}

/**
 * Sauvegarde les données d'activité Discord quotidiennes dans Netlify Blobs ou fichier local
 */
export async function saveDiscordDailyActivity(
  data: DiscordDailyActivityStorage,
  updatedBy?: string
): Promise<void> {
  const dataToSave: DiscordDailyActivityStorage = {
    ...data,
    lastUpdated: new Date().toISOString(),
    updatedBy: updatedBy || data.updatedBy,
  };

  if (isNetlify()) {
    try {
      const store = getStore(STORE_NAME);
      await store.set(STORAGE_KEY, JSON.stringify(dataToSave, null, 2));
      return;
    } catch (error) {
      console.error('[Discord Daily Activity Storage] Erreur sauvegarde Blobs:', error);
      throw error;
    }
  }

  // Fallback: système de fichiers local
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, STORAGE_KEY);
    fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Discord Daily Activity Storage] Erreur sauvegarde fichier:', error);
    throw error;
  }
}

/**
 * Met à jour les données d'activité Discord quotidiennes
 */
export async function updateDiscordDailyActivity(
  points: DailyActivityPoint[],
  updatedBy?: string
): Promise<void> {
  // Trier par date et dédupliquer (garder la dernière occurrence)
  const dateMap = new Map<string, DailyActivityPoint>();
  for (const point of points) {
    dateMap.set(point.date, point);
  }

  const sortedData = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const storage: DiscordDailyActivityStorage = {
    data: sortedData,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };

  await saveDiscordDailyActivity(storage, updatedBy);
}

/**
 * Ajoute ou met à jour des points d'activité quotidienne
 */
export async function upsertDiscordDailyActivity(
  points: DailyActivityPoint[],
  updatedBy?: string
): Promise<void> {
  const existing = await loadDiscordDailyActivity();
  const dateMap = new Map<string, DailyActivityPoint>();

  // Charger les données existantes
  for (const point of existing.data || []) {
    dateMap.set(point.date, point);
  }

  // Ajouter/mettre à jour avec les nouvelles données
  for (const point of points) {
    dateMap.set(point.date, point);
  }

  const sortedData = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const storage: DiscordDailyActivityStorage = {
    data: sortedData,
    lastUpdated: new Date().toISOString(),
    updatedBy,
  };

  await saveDiscordDailyActivity(storage, updatedBy);
}

