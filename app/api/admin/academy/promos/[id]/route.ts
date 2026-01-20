import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getPromo } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère une promo par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    const promo = await getPromo(params.id);
    
    if (!promo) {
      return NextResponse.json(
        { error: 'Promo non trouvée' },
        { status: 404 }
      );
    }

    // Ne pas renvoyer le mot de passe hashé
    const { password, ...promoWithoutPassword } = promo;
    return NextResponse.json({ promo: promoWithoutPassword });
  } catch (error) {
    console.error('[Admin Academy Promo API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
