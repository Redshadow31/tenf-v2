import { NextResponse } from 'next/server';
import { requireSectionAccessAny } from '@/lib/requireAdmin';
import { RAIDS_EVENTSUB_SECTION_HREFS } from '@/lib/admin/raidsFiabiliteRbac';
import { logAction } from '@/lib/admin/logger';
import { syncRaidTestEventSubSubscriptions } from '@/lib/raidEventsubTest';

function explainSyncError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Erreur inconnue';
  const lower = message.toLowerCase();

  if (lower.includes('raid_test_runs') || lower.includes('does not exist') || lower.includes('could not find the table')) {
    return `Tables test manquantes. Applique la migration 0036 puis redeploie. Détail: ${message}`;
  }
  if (lower.includes('twitch_eventsub_test_secret') || lower.includes('twitch_eventsub_secret')) {
    return `Secret EventSub manquant. Configure TWITCH_EVENTSUB_TEST_SECRET (ou TWITCH_EVENTSUB_SECRET). Détail: ${message}`;
  }
  if (lower.includes('twitch_app_client_id')) {
    return `TWITCH_APP_CLIENT_ID manquant/invalide pour la sync EventSub test. Détail: ${message}`;
  }

  return message;
}

export async function POST() {
  try {
    const admin = await requireSectionAccessAny(RAIDS_EVENTSUB_SECTION_HREFS);
    if (!admin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const result = await syncRaidTestEventSubSubscriptions();
    void logAction({
      action: 'raids.eventsub.sync',
      resourceType: 'raid_test_eventsub',
      resourceId: 'sync',
      newValue: { success: true, ...result },
      metadata: {
        sourcePage: '/admin/communaute/engagement/raids-eventsub',
        actorDiscordId: admin.discordId,
        actorUsername: admin.username,
      },
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/engagement/raids-test/sync] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: explainSyncError(error),
      },
      { status: 500 }
    );
  }
}

