import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';
import { evaluationRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';
import { getAllBonuses, updateMemberBonus } from '@/lib/evaluationBonusStorage';

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Récupérer les bonus depuis evaluationBonusStorage (Netlify Blobs ou fichiers locaux)
    // Ce système est encore utilisé pour la compatibilité avec l'ancien système
    const bonusesMap = await getAllBonuses(monthKey);

    return NextResponse.json({ success: true, bonuses: bonusesMap, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Bonus GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { month, twitchLogin, timezoneBonusEnabled, moderationBonus } = body;

    if (!month || !twitchLogin) {
      return NextResponse.json({ error: "month et twitchLogin sont requis" }, { status: 400 });
    }

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
    }

    const monthKey = month || getCurrentMonthKey();

    // Mettre à jour les bonus via evaluationBonusStorage (Netlify Blobs ou fichiers locaux)
    const updatedBonus = await updateMemberBonus(
      monthKey,
      twitchLogin.toLowerCase(),
      timezoneBonusEnabled || false,
      moderationBonus || 0,
      admin.discordId
    );

    await logAction({
      action: "evaluation.bonus.update",
      resourceType: "evaluation",
      resourceId: twitchLogin,
      newValue: { month: monthKey, timezoneBonusEnabled, moderationBonus },
      metadata: { sourcePage: "/admin/evaluation/d" },
    });

    return NextResponse.json({ 
      success: true, 
      bonuses: {
        [twitchLogin.toLowerCase()]: updatedBonus
      }
    });
  } catch (error) {
    console.error('[API Evaluations Bonus PUT] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

