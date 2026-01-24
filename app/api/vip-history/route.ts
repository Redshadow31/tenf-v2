import { NextRequest, NextResponse } from 'next/server';
import { loadVipHistory, getVipHistoryByMonth, getConsecutiveVipMonths, getVipBadgeText, addVipEntry, saveVipHistory } from '@/lib/vipHistory';
import { getCurrentAdmin } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère l'historique des VIP
 */
export async function GET(request: NextRequest) {
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

/**
 * POST - Ajoute une entrée VIP pour un mois donné
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.discordId, "write")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { login, month } = body;

    if (!login || !month) {
      return NextResponse.json(
        { error: "login et month sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    addVipEntry(login, month);

    return NextResponse.json({
      success: true,
      message: `VIP ajouté pour ${login} au mois ${month}`,
    });
  } catch (error) {
    console.error('Error adding VIP entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une entrée VIP pour un mois donné
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasPermission(admin.discordId, "write")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { login, month } = body;

    if (!login || !month) {
      return NextResponse.json(
        { error: "login et month sont requis" },
        { status: 400 }
      );
    }

    // Valider le format du mois
    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json(
        { error: "Format de mois invalide (attendu: YYYY-MM)" },
        { status: 400 }
      );
    }

    const history = loadVipHistory();
    const loginLower = login.toLowerCase();
    const filteredHistory = history.filter(
      (entry) => !(entry.login.toLowerCase() === loginLower && entry.month === month)
    );

    saveVipHistory(filteredHistory);

    return NextResponse.json({
      success: true,
      message: `VIP retiré pour ${login} au mois ${month}`,
    });
  } catch (error) {
    console.error('Error removing VIP entry:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

