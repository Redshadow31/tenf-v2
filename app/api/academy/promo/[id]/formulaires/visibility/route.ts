import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAccess, loadAccesses, loadPromos } from '@/lib/academyStorage';
import { updateFormResponseVisibility, loadFormResponses } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT - Met à jour la visibilité d'une auto-évaluation
 * Body: { formResponseId: string, isPublic: boolean }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur a accès à cette promo
    const userHasAccess = await hasAccess(userId);
    if (!userHasAccess) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    const accesses = await loadAccesses();
    const userAccesses = accesses.filter(a => a.userId === userId);
    const promos = await loadPromos();
    const promo = promos.find(p => p.id === params.id && userAccesses.some(a => a.promoId === p.id));

    if (!promo) {
      return NextResponse.json(
        { error: 'Promo non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { formResponseId, isPublic } = body;

    if (!formResponseId || typeof isPublic !== 'boolean') {
      return NextResponse.json(
        { error: 'formResponseId et isPublic sont requis' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire de cette auto-évaluation
    const formResponses = await loadFormResponses();
    const formResponse = formResponses.find(r => r.id === formResponseId);
    
    if (!formResponse || formResponse.userId !== userId || formResponse.promoId !== params.id) {
      return NextResponse.json(
        { error: 'Auto-évaluation non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    // Seules les auto-évaluations peuvent être publiques
    if (!['auto-evaluation-debut', 'auto-evaluation-fin'].includes(formResponse.formType)) {
      return NextResponse.json(
        { error: 'Seules les auto-évaluations peuvent être rendues publiques' },
        { status: 400 }
      );
    }

    await updateFormResponseVisibility(formResponseId, isPublic);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Academy Form Visibility API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
