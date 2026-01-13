import { NextRequest, NextResponse } from 'next/server';
import { registerModerator } from '@/lib/integrationModeratorsStorage';
import { getIntegration } from '@/lib/integrationStorage';

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
    
    const { pseudo, role, placement } = body;
    
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
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

