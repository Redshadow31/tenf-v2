import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAccess, loadAccesses, loadPromos } from '@/lib/academyStorage';
import { getFormResponse, saveFormResponse } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const validFormTypes = ['auto-evaluation-debut', 'retour-post-live', 'feedback-autre-live', 'auto-evaluation-fin', 'evaluation-academy'] as const;

/**
 * GET - Récupère les données d'un formulaire pour l'utilisateur
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; formType: string } }
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

    // Vérifier que le type de formulaire est valide
    if (!validFormTypes.includes(params.formType as any)) {
      return NextResponse.json(
        { error: 'Type de formulaire invalide' },
        { status: 400 }
      );
    }

    const formResponse = await getFormResponse(
      params.id,
      userId,
      params.formType as any
    );

    return NextResponse.json({ 
      formData: formResponse?.formData || null,
      submittedAt: formResponse?.submittedAt || null,
    });
  } catch (error) {
    console.error('[Academy Form API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Sauvegarde les données d'un formulaire
 * Body: { formData: Record<string, any> }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; formType: string } }
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

    // Vérifier que le type de formulaire est valide
    if (!validFormTypes.includes(params.formType as any)) {
      return NextResponse.json(
        { error: 'Type de formulaire invalide' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { formData } = body;

    if (!formData || typeof formData !== 'object') {
      return NextResponse.json(
        { error: 'formData est requis' },
        { status: 400 }
      );
    }

    const response = await saveFormResponse(
      params.id,
      userId,
      params.formType as any,
      formData
    );

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('[Academy Form API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
