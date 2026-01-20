import { NextRequest, NextResponse } from 'next/server';
import { loadFormResponses } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère toutes les auto-évaluations publiques
 */
export async function GET(request: NextRequest) {
  try {
    const formResponses = await loadFormResponses();
    
    // Filtrer uniquement les auto-évaluations publiques
    const publicEvaluations = formResponses.filter(
      r => r.isPublic === true && 
      ['auto-evaluation-debut', 'auto-evaluation-fin'].includes(r.formType)
    );

    // Grouper par promoId et userId pour faciliter l'affichage
    const grouped = publicEvaluations.reduce((acc, eval) => {
      const key = `${eval.promoId}-${eval.userId}`;
      if (!acc[key]) {
        acc[key] = {
          promoId: eval.promoId,
          userId: eval.userId,
          evaluations: [],
        };
      }
      acc[key].evaluations.push(eval);
      return acc;
    }, {} as Record<string, { promoId: string; userId: string; evaluations: typeof formResponses }>);

    return NextResponse.json({ 
      evaluations: publicEvaluations,
      grouped: Object.values(grouped),
    });
  } catch (error) {
    console.error('[Academy Public Evaluations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
