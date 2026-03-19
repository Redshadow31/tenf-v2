import { NextResponse } from 'next/server';
import { loadDashboardData } from '@/lib/dashboardDataStorage';
import { loadDiscordDailyActivity } from '@/lib/discordDailyActivityStorage';
import { cacheGet, cacheSet, cacheKey } from '@/lib/cache';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const DASHBOARD_PUBLIC_TTL_SECONDS = 120;

/**
 * GET - Récupère les données publiques du dashboard (sans authentification)
 */
export async function GET() {
  try {
    const cacheKeyStr = cacheKey('api', 'dashboard', 'data', 'public', 'v2');
    const cached = await cacheGet<any>(cacheKeyStr);
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = await loadDashboardData();
    const discordDailyActivity = await loadDiscordDailyActivity();

    // Retourner uniquement les données nécessaires pour le dashboard public
    const payload = {
      success: true,
      data: {
        twitchActivity: data.twitchActivity,
        discordGrowth: data.discordGrowth,
        discordDailyActivity: discordDailyActivity.data || [],
        spotlightProgression: data.spotlightProgression,
        vocalRanking: data.vocalRanking,
        textRanking: data.textRanking,
      },
    };

    await cacheSet(cacheKeyStr, payload, DASHBOARD_PUBLIC_TTL_SECONDS);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('[API Dashboard Public Data] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}


