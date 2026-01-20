import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { loadPromos, grantAccess, addLog, loadSettings } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Valide un mot de passe promo et accorde l'accès
 * Body: { password: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Lire les cookies directement côté serveur
    const cookieStore = cookies();
    const userId = cookieStore.get('discord_user_id')?.value;
    const username = cookieStore.get('discord_username')?.value;
    const avatar = cookieStore.get('discord_avatar')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Vous devez être connecté avec Discord' },
        { status: 401 }
      );
    }
    
    const user = {
      id: userId,
      username: username || 'Unknown',
      avatar: avatar || null,
    };

    // Vérifier si Academy est activée
    const settings = await loadSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: 'TENF Academy n\'est pas activée' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe requis' },
        { status: 400 }
      );
    }

    // Charger les promos actives
    const promos = await loadPromos();
    const activePromos = promos.filter(p => p.isActive);

    // Vérifier le mot de passe pour chaque promo active
    let matchedPromo = null;
    for (const promo of activePromos) {
      try {
        const passwordMatch = await bcrypt.compare(password, promo.password);
        if (passwordMatch) {
          matchedPromo = promo;
          break;
        }
      } catch (error) {
        // Si le mot de passe n'est pas hashé (ancien format), comparer directement
        if (promo.password === password) {
          matchedPromo = promo;
          break;
        }
      }
    }

    if (!matchedPromo) {
      return NextResponse.json(
        { success: false, error: 'Mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Accorder l'accès
    await grantAccess({
      userId: user.id,
      promoId: matchedPromo.id,
      role: 'participant',
      accessType: 'password',
    });

    // Logger l'accès
    await addLog({
      userId: user.id,
      promoId: matchedPromo.id,
      action: 'access',
      accessType: 'password',
      metadata: {
        username: user.username,
        promoName: matchedPromo.name,
      },
    });

    return NextResponse.json({
      success: true,
      promoId: matchedPromo.id,
      promoName: matchedPromo.name,
    });
  } catch (error) {
    console.error('[Academy Validate Password API] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
