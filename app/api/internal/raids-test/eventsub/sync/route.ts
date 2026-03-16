import { NextRequest, NextResponse } from 'next/server';
import { syncRaidTestEventSubSubscriptions } from '@/lib/raidEventsubTest';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

