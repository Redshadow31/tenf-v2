// Stockage des statistiques Statbot dans Netlify Blobs

import { getStore } from '@netlify/blobs';
import { StatbotMember } from './statbot';

export interface DiscordStats {
  month: string; // YYYY-MM
  members: StatbotMember[];
  totalMessages: number;
  totalVoiceHours: number;
  lastUpdated: string; // ISO timestamp
}

/**
 * Obtient la clé du mois au format YYYY-MM
 */
export function getMonthKey(date?: Date): string {
  const d = date || new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Charge les statistiques Discord depuis Netlify Blobs
 */
export async function loadDiscordStats(monthKey: string): Promise<DiscordStats | null> {
  try {
    const store = getStore({
      name: 'tenf-stats',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOB_READ_WRITE_TOKEN,
    });

    const key = `${monthKey}/discord-stats.json`;
    const data = await store.get(key, { type: 'json' });

    if (!data) {
      return null;
    }

    return data as DiscordStats;
  } catch (error) {
    console.error(`[StatbotStorage] Erreur lors du chargement des stats pour ${monthKey}:`, error);
    return null;
  }
}

/**
 * Sauvegarde les statistiques Discord dans Netlify Blobs
 */
export async function saveDiscordStats(
  monthKey: string,
  members: StatbotMember[],
  totalMessages: number,
  totalVoiceHours: number
): Promise<void> {
  try {
    const store = getStore({
      name: 'tenf-stats',
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_BLOB_READ_WRITE_TOKEN,
    });

    const stats: DiscordStats = {
      month: monthKey,
      members,
      totalMessages,
      totalVoiceHours,
      lastUpdated: new Date().toISOString(),
    };

    const key = `${monthKey}/discord-stats.json`;
    await store.set(key, JSON.stringify(stats, null, 2));

    console.log(`[StatbotStorage] Stats sauvegardées pour ${monthKey}: ${members.length} membres`);
  } catch (error) {
    console.error(`[StatbotStorage] Erreur lors de la sauvegarde des stats pour ${monthKey}:`, error);
    throw error;
  }
}

/**
 * Récupère les statistiques d'un membre spécifique pour un mois donné
 */
export async function getMemberDiscordStats(
  monthKey: string,
  discordId: string
): Promise<StatbotMember | null> {
  const stats = await loadDiscordStats(monthKey);
  if (!stats) {
    return null;
  }

  const member = stats.members.find(m => m.discordId === discordId);
  return member || null;
}

