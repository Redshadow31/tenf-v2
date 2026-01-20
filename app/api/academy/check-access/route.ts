import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { hasAccess, loadAccesses, loadPromos, loadSettings } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Vérifie si l'utilisateur a accès à TENF Academy
 */
export async function GET(request: NextRequest) {
  try {
    // Lire les cookies directement côté serveur
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ hasAccess: false });
    }

    // Vérifier si Academy est activée
    const settings = await loadSettings();
    if (!settings.enabled) {
      return NextResponse.json({ hasAccess: false, reason: 'Academy not enabled' });
    }

    // Vérifier si l'utilisateur a un accès
    const userHasAccess = await hasAccess(userId);
    
    if (!userHasAccess) {
      return NextResponse.json({ hasAccess: false });
    }

    // Trouver la promo active de l'utilisateur
    const accesses = await loadAccesses();
    const userAccesses = accesses.filter(a => a.userId === userId);
    const promos = await loadPromos();
    const activePromo = promos.find(p => p.isActive && userAccesses.some(a => a.promoId === p.id));

    return NextResponse.json({
      hasAccess: true,
      activePromoId: activePromo?.id || null,
    });
  } catch (error) {
    console.error('[Academy Check Access API] Erreur:', error);
    return NextResponse.json(
      { hasAccess: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
