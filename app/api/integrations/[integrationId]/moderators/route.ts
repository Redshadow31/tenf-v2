import { NextRequest, NextResponse } from 'next/server';
import { loadModeratorRegistrations } from '@/lib/integrationModeratorsStorage';
import { getIntegration } from '@/lib/integrationStorage';

/**
 * GET - Récupère les inscriptions modérateur pour une intégration
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    
    // Vérifier que l'intégration existe
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    const registrations = await loadModeratorRegistrations(integrationId);
    
    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('[Moderators API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

