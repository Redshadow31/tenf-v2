import { NextRequest, NextResponse } from 'next/server';
import { registerModerator } from '@/lib/integrationModeratorsStorage';
import { getIntegration } from '@/lib/integrationStorage';

const QUOTA_ERRORS: Record<string, string> = {
  ADMIN_SLOT_FULL: 'Un modérateur admin est déjà inscrit sur cette session.',
  STAFF_SLOT_FULL: 'Maximum 2 staff (hors admin et fondateurs) déjà inscrits sur cette session.',
};

/**
 * POST - Inscription modérateur à une intégration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    const body = await request.json();
    
    // Vérifier que l'intégration existe
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    const { pseudo, role, placement, roleKey } = body;
    
    // Validation des champs requis
    if (!pseudo || !role || !placement) {
      return NextResponse.json(
        { error: 'pseudo, role et placement sont requis' },
        { status: 400 }
      );
    }
    
    // Validation du placement
    if (!['Animateur', 'Co-animateur', 'Observateur'].includes(placement)) {
      return NextResponse.json(
        { error: 'placement doit être Animateur, Co-animateur ou Observateur' },
        { status: 400 }
      );
    }
    
    try {
      const registration = await registerModerator(integrationId, {
        pseudo,
        role,
        roleKey: roleKey ?? null,
        placement: placement as "Animateur" | "Co-animateur" | "Observateur",
      });
      
      return NextResponse.json({
        registration,
        success: true,
        message: 'Inscription réussie !'
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'déjà inscrit') {
        return NextResponse.json(
          { error: 'déjà inscrit' },
          { status: 409 }
        );
      }
      if (error instanceof Error && QUOTA_ERRORS[error.message]) {
        return NextResponse.json(
          { error: QUOTA_ERRORS[error.message], code: error.message },
          { status: 403 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('[Moderator Registration API] Erreur POST:', error);
    
    if (error instanceof Error && error.message === 'déjà inscrit') {
      return NextResponse.json(
        { error: 'déjà inscrit' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

