import { NextRequest, NextResponse } from 'next/server';
import { syncRaidTestEventSubSubscriptions } from '@/lib/raidEventsubTest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function explainSyncError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  const lower = message.toLowerCase();

  if (lower.includes('raid_test_runs') || lower.includes('does not exist') || lower.includes('could not find the table')) {
    return `Tables test manquantes. Applique la migration 0036. Détail: ${message}`;
  }
  if (lower.includes('twitch_eventsub_test_secret') || lower.includes('twitch_eventsub_secret')) {
    return `Secret EventSub manquant. Configure TWITCH_EVENTSUB_TEST_SECRET (ou TWITCH_EVENTSUB_SECRET). Détail: ${message}`;
  }
  if (lower.includes('twitch_app_client_id')) {
    return `TWITCH_APP_CLIENT_ID manquant/invalide pour la sync EventSub test. Détail: ${message}`;
  }

  return message;
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.RAID_EVENTSUB_TEST_CRON_SECRET;
  if (expectedSecret) {
    const provided = request.headers.get('x-cron-secret');
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  try {
    const result = await syncRaidTestEventSubSubscriptions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[internal/raids-test/eventsub/sync] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: explainSyncError(error),
      },
      { status: 500 }
    );
  }
}

