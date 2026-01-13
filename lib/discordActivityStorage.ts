// Gestion du stockage des données d'activité Discord mensuelles (messages et vocaux)

import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

export interface DiscordActivityData {
  messagesByUser: Record<string, number>; // { login: count }
  vocalsByUser: Record<string, { hoursDecimal: number; totalMinutes: number; display: string }>; // { login: { hoursDecimal, totalMinutes, display } }
  vocalsByUnmatched?: Record<string, { hoursDecimal: number; totalMinutes: number; display: string }>; // { discordUsername: { hoursDecimal, totalMinutes, display } } - pour les stats globales
}

export interface DiscordActivityStorage {
  [month: string]: DiscordActivityData; // { "YYYY-MM": DiscordActivityData }
}

const STORE_NAME = 'tenf-discord-activity';
const STORAGE_KEY = 'discord-activity.json';
const DATA_DIR = path.join(process.cwd(), 'data', 'discord-activity');

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
 * Charge les données d'activité Discord depuis Netlify Blobs
 */
export async function loadDiscordActivity(): Promise<DiscordActivityStorage> {
  if (isNetlify()) {
    try {
      const store = getStore(STORE_NAME);
      const data = await store.get(STORAGE_KEY, { type: 'text' });
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('[Discord Activity Storage] Erreur chargement Blobs:', error);
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
    console.error('[Discord Activity Storage] Erreur chargement fichier:', error);
  }

  return {};
}

/**
 * Sauvegarde les données d'activité Discord dans Netlify Blobs ou fichier local
 */
export async function saveDiscordActivity(data: DiscordActivityStorage): Promise<void> {
  if (isNetlify()) {
    try {
      const store = getStore(STORE_NAME);
      await store.set(STORAGE_KEY, JSON.stringify(data, null, 2));
      return;
    } catch (error) {
      console.error('[Discord Activity Storage] Erreur sauvegarde Blobs:', error);
      throw error;
    }
  }

  // Fallback: système de fichiers local
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, STORAGE_KEY);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('[Discord Activity Storage] Erreur sauvegarde fichier:', error);
    throw error;
  }
}

/**
 * Récupère les données d'activité Discord pour un mois spécifique
 */
export async function getDiscordActivityForMonth(month: string): Promise<DiscordActivityData | null> {
  const storage = await loadDiscordActivity();
  return storage[month] || null;
}

/**
 * Met à jour les données d'activité Discord pour un mois spécifique
 */
export async function updateDiscordActivityForMonth(
  month: string,
  updates: Partial<DiscordActivityData>
): Promise<void> {
  const storage = await loadDiscordActivity();
  const currentData = storage[month] || { messagesByUser: {}, vocalsByUser: {} };
  
  storage[month] = {
    messagesByUser: { ...currentData.messagesByUser, ...(updates.messagesByUser || {}) },
    vocalsByUser: { ...currentData.vocalsByUser, ...(updates.vocalsByUser || {}) },
  };

  await saveDiscordActivity(storage);
}

