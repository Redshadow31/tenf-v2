import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadIntegrations, createIntegration, type Integration } from '@/lib/integrationStorage';

/**
 * GET - Liste toutes les intégrations publiées (public) ou toutes (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminParam = searchParams.get('admin') === 'true';
    
    const admin = await getCurrentAdmin();
    const isAdmin = !!(admin && hasAdminDashboardAccess(admin.id));
    
    const allIntegrations = await loadIntegrations();
    
    // Si admin param est true et que l'utilisateur est admin, retourner toutes les intégrations
    // Sinon, retourner uniquement les intégrations publiées
    const integrations = (adminParam && isAdmin)
      ? allIntegrations
      : allIntegrations.filter(i => i.isPublished);
    
    // Trier par date décroissante
    integrations.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json({ integrations });
  } catch (error) {
    console.error('[Integrations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée une nouvelle intégration (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, description, category, date, location, image, isPublished, invitedMembers } = body;
    
    if (!title || !date) {
      return NextResponse.json(
        { error: 'Le titre et la date sont requis' },
        { status: 400 }
      );
    }
    
    const newIntegration = await createIntegration({
      title,
      description: description || '',
      category: category || 'Intégration standard',
      date,
      location: location || undefined,
      image: image || undefined,
      invitedMembers: invitedMembers || undefined,
      isPublished: isPublished ?? false,
    }, admin.id);
    
    return NextResponse.json({
      integration: newIntegration,
      success: true,
    });
  } catch (error) {
    console.error('[Integrations API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

