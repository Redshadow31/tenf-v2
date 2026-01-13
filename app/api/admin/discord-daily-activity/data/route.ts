import { NextRequest, NextResponse } from 'next/server';
import { loadDiscordDailyActivity } from '@/lib/discordDailyActivityStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données d'activité Discord quotidiennes
 */
export async function GET(request: NextRequest) {
  try {
    const storage = await loadDiscordDailyActivity();

    return NextResponse.json({
      success: true,
      data: storage.data || [],
    });
  } catch (error) {
    console.error('[API Discord Daily Activity Data] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

