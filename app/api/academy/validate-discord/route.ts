import { NextRequest, NextResponse } from 'next/server';
import { getDiscordUser } from '@/lib/discord';
import { grantAccess, addLog, loadSettings, loadPromos } from '@/lib/academyStorage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST - Valide les rôles Discord et accorde l'accès
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getDiscordUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Vous devez être connecté avec Discord' },
        { status: 401 }
      );
    }

    // Vérifier si Academy est activée
    const settings = await loadSettings();
    if (!settings.enabled) {
      return NextResponse.json(
        { success: false, error: 'TENF Academy n\'est pas activée' },
        { status: 403 }
      );
    }

    // Récupérer les rôles Discord de l'utilisateur
    // Pour l'instant, on vérifie via l'API user/role pour voir si c'est staff/admin
    try {
      const roleResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/user/role`, {
        headers: {
          'Cookie': request.headers.get('cookie') || '',
        },
      });

      if (roleResponse.ok) {
        const roleData = await roleResponse.json();
        
        // Si l'utilisateur est staff/admin, lui accorder l'accès
        if (roleData.hasAdminAccess) {
          // Trouver ou créer une promo pour le staff
          const promos = await loadPromos();
          let staffPromo = promos.find(p => p.isActive);
          
          // Si aucune promo active, créer une promo par défaut pour le staff
          if (!staffPromo) {
            // On ne crée pas de promo ici, on retourne juste une erreur
            return NextResponse.json(
              { success: false, error: 'Aucune promo active disponible' },
              { status: 404 }
            );
          }

          // Accorder l'accès avec le rôle approprié
          await grantAccess({
            userId: user.id,
            promoId: staffPromo.id,
            role: 'admin', // Staff = admin Academy
            accessType: 'discord',
            accessedBy: user.id,
          });

          // Logger l'accès
          await addLog({
            userId: user.id,
            promoId: staffPromo.id,
            action: 'access',
            accessType: 'discord',
            metadata: {
              username: user.username,
              role: 'admin',
            },
          });

          return NextResponse.json({
            success: true,
            promoId: staffPromo.id,
            promoName: staffPromo.name,
          });
        }
      }
    } catch (error) {
      console.error('Erreur vérification rôles:', error);
    }

    // Vérifier les rôles Discord autorisés (si défini dans settings)
    // Cette partie nécessiterait une vérification des rôles Discord du serveur
    // Pour l'instant, on vérifie juste si l'utilisateur est admin/staff

    return NextResponse.json(
      { success: false, error: 'Vous n\'avez pas les rôles Discord nécessaires pour accéder à TENF Academy' },
      { status: 403 }
    );
  } catch (error) {
    console.error('[Academy Validate Discord API] Erreur:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
