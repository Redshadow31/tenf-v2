import { NextRequest, NextResponse } from 'next/server';
import { loadAccesses, loadPromos } from '@/lib/academyStorage';
import { requireUser } from '@/lib/requireUser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère la promo active de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await requireUser();
    const userId = sessionUser?.discordId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const accesses = await loadAccesses();
    const userAccesses = accesses.filter(a => a.userId === userId);
    
    if (userAccesses.length === 0) {
      return NextResponse.json({ promo: null });
    }

    const promos = await loadPromos();
    const activePromo = promos.find(p => p.isActive && userAccesses.some(a => a.promoId === p.id));

    return NextResponse.json({
      promo: activePromo || null,
      accesses: userAccesses,
    });
  } catch (error) {
    console.error('[Academy My Promo API] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
