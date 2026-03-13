import { NextRequest, NextResponse } from 'next/server';
import { loadDiscordDailyActivity } from '@/lib/discordDailyActivityStorage';
import { requireAdmin } from '@/lib/requireAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données d'activité Discord quotidiennes
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const storage = await loadDiscordDailyActivity();

    return NextResponse.json({
      success: true,
      data: storage.data || [],
    });
  } catch (error) {
    console.error('[API Discord Daily Activity Data] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

