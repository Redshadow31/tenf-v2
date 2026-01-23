import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/requireAdmin';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';
import { evaluationRepository } from '@/lib/repositories';
import { getCurrentMonthKey } from '@/lib/evaluationStorage';

export async function GET(request: NextRequest) {
  try {
    const admin = await requirePermission("read");
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const monthKey = monthParam || getCurrentMonthKey();

    // Récupérer toutes les évaluations du mois depuis Supabase
    const evaluations = await evaluationRepository.findByMonth(monthKey);
    
    // Agréger tous les bonus de toutes les évaluations
    const bonuses: Array<{
      id: string;
      twitchLogin: string;
      points: number;
      reason: string;
      type: 'decalage-horaire' | 'implication-qualitative' | 'conseils-remarquables' | 'autre';
      createdBy: string;
      createdAt: string;
    }> = [];

    evaluations.forEach(eval => {
      if (eval.bonuses && Array.isArray(eval.bonuses)) {
        eval.bonuses.forEach((bonus: any) => {
          bonuses.push({
            ...bonus,
            twitchLogin: eval.twitchLogin, // S'assurer que le twitchLogin est présent
          });
        });
      }
    });

    return NextResponse.json({ success: true, bonuses, month: monthKey });
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
    const { month, twitchLogin, bonus } = body; // bonus peut être un objet avec id, points, reason, type, ou un tableau

    if (!month || !twitchLogin) {
      return NextResponse.json({ error: "month et twitchLogin sont requis" }, { status: 400 });
    }

    if (!month.match(/^\d{4}-\d{2}$/)) {
      return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
    }

    const monthKey = month || getCurrentMonthKey();
    const monthDate = `${monthKey}-01`;

    // Récupérer l'évaluation existante ou en créer une nouvelle
    let evaluation = await evaluationRepository.findByMemberAndMonth(twitchLogin, monthKey);
    
    let bonuses: Array<{
      id: string;
      points: number;
      reason: string;
      type: 'decalage-horaire' | 'implication-qualitative' | 'conseils-remarquables' | 'autre';
      createdBy: string;
      createdAt: string;
    }> = evaluation?.bonuses || [];

    // Si bonus est un objet unique, l'ajouter ou le mettre à jour
    if (bonus && typeof bonus === 'object' && !Array.isArray(bonus)) {
      const bonusId = bonus.id || `bonus-${Date.now()}`;
      const existingIndex = bonuses.findIndex(b => b.id === bonusId);
      
      const bonusEntry = {
        id: bonusId,
        points: Number(bonus.points) || 0,
        reason: bonus.reason || '',
        type: bonus.type || 'autre',
        createdBy: admin.id,
        createdAt: bonus.createdAt || new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        bonuses[existingIndex] = bonusEntry;
      } else {
        bonuses.push(bonusEntry);
      }
    } else if (Array.isArray(bonus)) {
      // Si bonus est un tableau, remplacer tous les bonus
      bonuses = bonus.map((b: any) => ({
        id: b.id || `bonus-${Date.now()}-${Math.random()}`,
        points: Number(b.points) || 0,
        reason: b.reason || '',
        type: b.type || 'autre',
        createdBy: b.createdBy || admin.id,
        createdAt: b.createdAt || new Date().toISOString(),
      }));
    }

    // Mettre à jour ou créer l'évaluation
    await evaluationRepository.upsert({
      month: new Date(monthDate),
      twitchLogin: twitchLogin.toLowerCase(),
      bonuses,
      updatedAt: new Date(),
    });

    await logAction({
      action: "evaluation.bonus.update",
      resourceType: "evaluation",
      resourceId: twitchLogin,
      newValue: { month: monthKey, bonuses },
      metadata: { sourcePage: "/admin/evaluation-mensuelle" },
    });

    return NextResponse.json({ success: true, bonuses });
  } catch (error) {
    console.error('[API Evaluations Bonus PUT] Erreur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

