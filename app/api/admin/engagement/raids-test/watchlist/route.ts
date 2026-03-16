import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getRaidTestWatchlistSnapshot } from '@/lib/raidEventsubTest';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const data = await getRaidTestWatchlistSnapshot();
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    console.error('[admin/engagement/raids-test/watchlist] GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

