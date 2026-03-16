import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { syncRaidTestDeclarationsSnapshot } from '@/lib/raidEventsubTest';

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Acces refuse' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const daysRaw = Number.parseInt(String(body?.days ?? '30'), 10);
    const days = Number.isFinite(daysRaw) ? Math.min(120, Math.max(1, daysRaw)) : 30;
    const runId = body?.runId ? String(body.runId) : undefined;

    const result = await syncRaidTestDeclarationsSnapshot({ runId, days });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin/engagement/raids-test/declarations/sync] POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

