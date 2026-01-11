import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, logAction } from '@/lib/adminAuth';
import { hasPermission } from '@/lib/adminRoles';
import { loadEvaluationBonusData, saveEvaluationBonusData, updateMemberBonus, getAllBonuses } from '@/lib/evaluationBonusStorage';
import type { MemberBonus } from '@/lib/evaluationBonusHelpers';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';

export async function GET(request: NextRequest) {
  try {
    const { requirePermission } = await import('@/lib/adminAuth');
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    const bonuses = await getAllBonuses(monthKey);

    return NextResponse.json({ success: true, bonuses, month: monthKey });
  } catch (error) {
    console.error('[API Evaluations Bonus GET] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { requirePermission } = await import('@/lib/adminAuth');
    const admin = await requirePermission("write");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { month, twitchLogin, timezoneBonusEnabled, moderationBonus } = await request.json();

    if (!month || !twitchLogin) {
      return NextResponse.json({ error: "month et twitchLogin sont requis" }, { status: 400 });
    }

    const monthKey = month || getCurrentMonthKey();
    const updatedBonus = await updateMemberBonus(
      monthKey,
      twitchLogin,
      Boolean(timezoneBonusEnabled),
      Number(moderationBonus) || 0,
      admin.id
    );

    await logAction(
      admin,
      'update_evaluation_bonus',
      'evaluation_bonus',
      {
        resourceId: twitchLogin,
        newValue: { month: monthKey, timezoneBonusEnabled, moderationBonus },
      }
    );

    return NextResponse.json({ success: true, bonus: updatedBonus });
  } catch (error) {
    console.error('[API Evaluations Bonus PUT] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

