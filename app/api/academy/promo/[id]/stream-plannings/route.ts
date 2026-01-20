import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAccess, loadAccesses, loadPromos } from '@/lib/academyStorage';
import { 
  getStreamPlanningsByUser, 
  createStreamPlanning, 
  deleteStreamPlanning 
} from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les plannings de stream de l'utilisateur pour une promo
 */
export async function GET(
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

    const plannings = await getStreamPlanningsByUser(params.id, userId);
    return NextResponse.json({ plannings });
  } catch (error) {
    console.error('[Academy Stream Planning API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée un nouveau planning de stream
 * Body: { name: string, date: string, time: string, approximateDuration: string }
 */
export async function POST(
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
    const { name, date, time, approximateDuration } = body;

    if (!name || !date || !time || !approximateDuration) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    const planning = await createStreamPlanning(
      params.id,
      userId,
      name,
      date,
      time,
      approximateDuration
    );

    return NextResponse.json({ success: true, planning });
  } catch (error) {
    console.error('[Academy Stream Planning API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime un planning de stream
 * Query: ?planningId=xxx
 */
export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const planningId = searchParams.get('planningId');

    if (!planningId) {
      return NextResponse.json(
        { error: 'planningId est requis' },
        { status: 400 }
      );
    }

    await deleteStreamPlanning(planningId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Academy Stream Planning API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
