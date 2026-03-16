import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { syncRaidTestEventSubSubscriptions } from '@/lib/raidEventsubTest';

export async function POST() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const result = await syncRaidTestEventSubSubscriptions();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/engagement/raids-test/sync] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

