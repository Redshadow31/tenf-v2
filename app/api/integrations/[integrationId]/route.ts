import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getIntegration, updateIntegration, deleteIntegration } from '@/lib/integrationStorage';

/**
 * GET - Récupère une intégration spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    const integration = await getIntegration(integrationId);
    
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier si l'utilisateur est admin ou si l'intégration est publiée
    const admin = await getCurrentAdmin();
    const isAdmin = admin && hasAdminDashboardAccess(admin.discordId);
    
    if (!integration.isPublished && !isAdmin) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ integration });
  } catch (error) {
    console.error('[Integration API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour une intégration (admin uniquement)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { integrationId } = params;
    const body = await request.json();
    
    const updatedIntegration = await updateIntegration(integrationId, body);
    
    if (!updatedIntegration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ integration: updatedIntegration, success: true });
  } catch (error) {
    console.error('[Integration API] Erreur PUT:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une intégration (admin uniquement)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.discordId)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const { integrationId } = params;
    const deleted = await deleteIntegration(integrationId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Integration API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

