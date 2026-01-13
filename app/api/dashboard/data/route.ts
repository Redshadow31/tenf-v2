import { NextResponse } from 'next/server';
import { loadDashboardData } from '@/lib/dashboardDataStorage';
import { loadDiscordDailyActivity } from '@/lib/discordDailyActivityStorage';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les données publiques du dashboard (sans authentification)
 */
export async function GET() {
  try {
    const data = await loadDashboardData();
    const discordDailyActivity = await loadDiscordDailyActivity();

    // Retourner uniquement les données nécessaires pour le dashboard public
    return NextResponse.json({
      success: true,
      data: {
        twitchActivity: data.twitchActivity,
        discordGrowth: data.discordGrowth,
        discordDailyActivity: discordDailyActivity.data || [],
        spotlightProgression: data.spotlightProgression,
        vocalRanking: data.vocalRanking,
        textRanking: data.textRanking,
      },
    });
  } catch (error) {
    console.error('[API Dashboard Public Data] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


