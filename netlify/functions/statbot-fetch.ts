import { Handler } from '@netlify/functions';
import { fetchStatbotData, filterTENFMembers } from '../../lib/statbot';
import { saveDiscordStats, getMonthKey } from '../../lib/statbotStorage';
import { loadMemberDataFromStorage, getAllMemberData } from '../../lib/memberData';

/**
 * Netlify Function pour récupérer et stocker les données Statbot
 * 
 * Cette fonction peut être appelée :
 * - Manuellement via POST /api/statbot/fetch
 * - Automatiquement via un cron job Netlify
 */
export const handler: Handler = async (event, context) => {
  try {
    const API_KEY = process.env.STATBOT_API_KEY;
    const SERVER_ID = process.env.STATBOT_SERVER_ID;

    if (!API_KEY || !SERVER_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'STATBOT_API_KEY et STATBOT_SERVER_ID doivent être configurés',
        }),
      };
    }

    console.log('[Statbot Fetch] Début de la récupération des données...');

    // Charger les membres TENF pour filtrer
    await loadMemberDataFromStorage();
    const allMembers = getAllMemberData();
    const tenfDiscordIds = allMembers
      .filter(m => m.discordId)
      .map(m => m.discordId!);

    console.log(`[Statbot Fetch] ${tenfDiscordIds.length} membres TENF à filtrer`);

    // Récupérer les données depuis Statbot API
    const statbotData = await fetchStatbotData(SERVER_ID, API_KEY);

    // Filtrer les membres TENF
    const tenfMembers = filterTENFMembers(statbotData, tenfDiscordIds);

    // Calculer les totaux
    const totalMessages = tenfMembers.reduce((sum, m) => sum + m.messages, 0);
    const totalVoiceMinutes = tenfMembers.reduce((sum, m) => sum + m.voiceMinutes, 0);
    const totalVoiceHours = Math.round((totalVoiceMinutes / 60) * 100) / 100;

    // Sauvegarder dans Netlify Blobs
    const monthKey = getMonthKey();
    await saveDiscordStats(monthKey, tenfMembers, totalMessages, totalVoiceHours);

    console.log(`[Statbot Fetch] ✅ Données sauvegardées pour ${monthKey}`);
    console.log(`[Statbot Fetch] - ${tenfMembers.length} membres`);
    console.log(`[Statbot Fetch] - ${totalMessages} messages`);
    console.log(`[Statbot Fetch] - ${totalVoiceHours} heures vocales`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        month: monthKey,
        membersCount: tenfMembers.length,
        totalMessages,
        totalVoiceHours,
        message: 'Données Statbot récupérées et sauvegardées avec succès',
      }),
    };
  } catch (error) {
    console.error('[Statbot Fetch] Erreur:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: `Erreur lors de la récupération des données Statbot: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      }),
    };
  }
};

