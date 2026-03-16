import type { Handler } from '@netlify/functions';
import { syncRaidTestEventSubSubscriptions } from '../../lib/raidEventsubTest';

/**
 * Scheduled Function Netlify:
 * - synchronise les subscriptions EventSub test en continu
 * - fonctionne meme quand aucune page admin n'est ouverte
 */
export const handler: Handler = async () => {
  try {
    const enabled = String(process.env.RAID_EVENTSUB_TEST_ENABLED || '').toLowerCase() === 'true';
    if (!enabled) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          skipped: true,
          reason: 'RAID_EVENTSUB_TEST_ENABLED=false',
        }),
      };
    }

    const result = await syncRaidTestEventSubSubscriptions();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        source: 'netlify_scheduled_function',
        ...result,
      }),
    };
  } catch (error) {
    console.error('[raids-test-sync] error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }),
    };
  }
};

