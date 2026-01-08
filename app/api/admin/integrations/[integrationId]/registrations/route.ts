import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getIntegration, loadRegistrations } from '@/lib/integrationStorage';

/**
 * GET - Récupère les inscriptions pour une intégration (admin uniquement)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { integrationId } = params;
    
    // Vérifier que l'intégration existe
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    // Charger les inscriptions
    const registrations = await loadRegistrations(integrationId);
    
    // Trier par date d'inscription (plus récentes en premier)
    registrations.sort((a, b) => {
      return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
    });
    
    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('[Admin Integration Registrations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

