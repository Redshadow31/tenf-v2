import { NextResponse } from 'next/server';
import { loadVipHistory, getVipHistoryByMonth, getConsecutiveVipMonths, getVipBadgeText } from '@/lib/vipHistory';

/**
 * GET - Récupère l'historique des VIP
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const login = searchParams.get('login');

    if (action === 'badge' && login) {
      // Récupérer le badge VIP pour un membre spécifique
      const badge = getVipBadgeText(login);
      const months = getConsecutiveVipMonths(login);
      return NextResponse.json({
        badge,
        months,
        login: login.toLowerCase(),
      });
    }

    if (action === 'by-month') {
      // Récupérer l'historique organisé par mois
      const byMonth = getVipHistoryByMonth();
      return NextResponse.json({ byMonth });
    }

    // Par défaut, retourner l'historique complet
    const history = loadVipHistory();
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching VIP history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

