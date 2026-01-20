import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { loadAccesses, grantAccess, addLog, getPromo } from '@/lib/academyStorage';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les accès d'une promo
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

    const accesses = await loadAccesses();
    const promoAccesses = accesses.filter(a => a.promoId === params.id);
    
    return NextResponse.json({ accesses: promoAccesses });
  } catch (error) {
    console.error('[Admin Academy Promo Accesses API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajoute un accès à une promo
 * Body: { userId: string, role: 'participant' | 'mentor' | 'admin', accessType: 'password' | 'discord' }
 */
export async function POST(
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

    // Vérifier que la promo existe
    const promo = await getPromo(params.id);
    if (!promo) {
      return NextResponse.json(
        { error: 'Promo non trouvée' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { userId, role, accessType } = body;

    if (!userId || !role || !accessType) {
      return NextResponse.json(
        { error: 'userId, role et accessType sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'accès existe déjà
    const accesses = await loadAccesses();
    const existingAccess = accesses.find(
      a => a.userId === userId && a.promoId === params.id
    );

    if (existingAccess) {
      return NextResponse.json(
        { error: 'L\'utilisateur a déjà accès à cette promo' },
        { status: 409 }
      );
    }

    // Accorder l'accès
    const cookieStore = cookies();
    const adminId = cookieStore.get('discord_user_id')?.value || admin.discordId;
    
    const newAccess = await grantAccess({
      userId,
      promoId: params.id,
      role,
      accessType,
      accessedBy: adminId,
    });

    // Logger l'accès
    await addLog({
      userId,
      promoId: params.id,
      action: 'access_granted',
      accessType,
      metadata: {
        grantedBy: adminId,
        role,
        promoName: promo.name,
      },
    });

    return NextResponse.json({ success: true, access: newAccess });
  } catch (error) {
    console.error('[Admin Academy Promo Accesses API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
