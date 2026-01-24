import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import {
  loadIgnoredRaids,
  addIgnoredRaid,
  getMonthKey,
  getCurrentMonthKey,
} from '@/lib/raidStorage';

/**
 * GET - Récupère les raids ignorés pour un mois donné
 * Query params: month (format YYYY-MM, optionnel, défaut: mois en cours)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');

    let monthKey: string;
    if (monthParam) {
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (monthMatch) {
        const year = parseInt(monthMatch[1]);
        const monthNum = parseInt(monthMatch[2]);
        if (monthNum >= 1 && monthNum <= 12) {
          monthKey = getMonthKey(year, monthNum);
        } else {
          return NextResponse.json({ error: 'Mois invalide' }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: 'Format de mois invalide (attendu: YYYY-MM)' }, { status: 400 });
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    const ignored = await loadIgnoredRaids(monthKey);

    return NextResponse.json({
      month: monthKey,
      ignored,
    });
  } catch (error) {
    console.error('[Raids Ignored API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajoute un raid ignoré
 * Body: { month: string, raiderNormalized: string, targetNormalized: string, rawText: string }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { month, raiderNormalized, targetNormalized, rawText } = body;

    if (!month || !raiderNormalized || !targetNormalized) {
      return NextResponse.json(
        { error: 'month, raiderNormalized et targetNormalized sont requis' },
        { status: 400 }
      );
    }

    let monthKey: string;
    const monthMatch = month.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
      const year = parseInt(monthMatch[1]);
      const monthNum = parseInt(monthMatch[2]);
      if (monthNum >= 1 && monthNum <= 12) {
        monthKey = getMonthKey(year, monthNum);
      } else {
        return NextResponse.json({ error: 'Mois invalide' }, { status: 400 });
      }
    } else {
      monthKey = getCurrentMonthKey();
    }

    await addIgnoredRaid(
      monthKey,
      raiderNormalized,
      targetNormalized,
      rawText || '',
      admin.id
    );

    return NextResponse.json({
      success: true,
      message: 'Raid ignoré avec succès',
    });
  } catch (error) {
    console.error('[Raids Ignored API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

