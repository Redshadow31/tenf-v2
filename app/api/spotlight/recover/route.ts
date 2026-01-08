import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadSectionAData, getMonthKey } from '@/lib/evaluationStorage';

/**
 * POST - Recherche un spotlight perdu par streamer dans tous les mois disponibles
 * Body: { streamerTwitchLogin: string }
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { streamerTwitchLogin } = body;

    if (!streamerTwitchLogin) {
      return NextResponse.json(
        { error: 'streamerTwitchLogin requis' },
        { status: 400 }
      );
    }

    const searchLogin = streamerTwitchLogin.toLowerCase();
    const now = new Date();
    const foundSpotlights: Array<{
      spotlightId: string;
      month: string;
      date: string;
      streamerTwitchLogin: string;
    }> = [];

    // Chercher dans les 36 derniers mois (3 ans)
    for (let i = 0; i < 36; i++) {
      const checkDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = getMonthKey(checkDate.getFullYear(), checkDate.getMonth() + 1);
      
      const data = await loadSectionAData(monthKey);
      if (data && data.spotlights) {
        const matching = data.spotlights.filter(
          s => s.streamerTwitchLogin.toLowerCase() === searchLogin
        );
        
        for (const spotlight of matching) {
          foundSpotlights.push({
            spotlightId: spotlight.id,
            month: monthKey,
            date: spotlight.date,
            streamerTwitchLogin: spotlight.streamerTwitchLogin,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      streamerTwitchLogin,
      found: foundSpotlights.length,
      spotlights: foundSpotlights,
    });
  } catch (error) {
    console.error('[Spotlight Recover API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

