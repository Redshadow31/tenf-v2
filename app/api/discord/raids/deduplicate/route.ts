import { NextRequest, NextResponse } from 'next/server';
import {
  loadRaidsFaits,
  loadRaidsRecus,
  saveRaidsFaits,
  saveRaidsRecus,
  recalculateAlerts,
  getMonthKey,
  getCurrentMonthKey,
  type RaidFait,
  type RaidRecu,
} from '@/lib/raidStorage';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Déduplique les raids pour un mois : même personne, même date, même heure → une seule entrée conservée.
 * Body: { month: string } (YYYY-MM)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    if (!hasPermission(admin.id, 'write')) {
      return NextResponse.json(
        { error: 'Accès refusé. Permissions insuffisantes.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const month = body.month as string | undefined;

    let monthKey: string;
    if (month && /^(\d{4})-(\d{2})$/.test(month)) {
      const [, year, monthNum] = month.match(/^(\d{4})-(\d{2})$/)!;
      monthKey = getMonthKey(parseInt(year, 10), parseInt(monthNum, 10));
    } else {
      monthKey = getCurrentMonthKey();
    }

    let raidsFaits: RaidFait[] = await loadRaidsFaits(monthKey);
    let raidsRecus: RaidRecu[] = await loadRaidsRecus(monthKey);

    const keyFait = (r: RaidFait) => `${r.raider}|${r.target}|${r.date}`;
    const keyRecu = (r: RaidRecu) => `${r.target}|${r.raider}|${r.date}`;

    const seenFaits = new Set<string>();
    const dedupedFaits: RaidFait[] = [];
    for (const r of raidsFaits) {
      const k = keyFait(r);
      if (seenFaits.has(k)) continue;
      seenFaits.add(k);
      dedupedFaits.push(r);
    }

    const seenRecus = new Set<string>();
    const dedupedRecus: RaidRecu[] = [];
    for (const r of raidsRecus) {
      const k = keyRecu(r);
      if (seenRecus.has(k)) continue;
      seenRecus.add(k);
      dedupedRecus.push(r);
    }

    const removedFaits = raidsFaits.length - dedupedFaits.length;
    const removedRecus = raidsRecus.length - dedupedRecus.length;
    const totalRemoved = removedFaits + removedRecus;

    if (totalRemoved > 0) {
      await saveRaidsFaits(monthKey, dedupedFaits);
      await saveRaidsRecus(monthKey, dedupedRecus);
      await recalculateAlerts(monthKey);
    }

    return NextResponse.json({
      message: totalRemoved > 0 ? 'Doublons supprimés.' : 'Aucun doublon à supprimer.',
      removed: {
        total: totalRemoved,
        raidsFaits: removedFaits,
        raidsRecus: removedRecus,
      },
    });
  } catch (error) {
    console.error('[API Raids Deduplicate] Erreur:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la déduplication.' },
      { status: 500 }
    );
  }
}
