import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { loadEvents, createEvent, Event } from '@/lib/eventStorage';

/**
 * GET - Récupère tous les événements publiés (public) ou tous les événements (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminOnly = searchParams.get('admin') === 'true';
    
    // Vérifier si c'est une requête admin
    let isAdmin = false;
    if (adminOnly) {
      const admin = await getCurrentAdmin();
      if (admin) {
        isAdmin = hasAdminDashboardAccess(admin.id);
      }
      if (!isAdmin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
    }
    
    const events = await loadEvents();
    
    // Si admin, retourner tous les événements, sinon seulement les publiés
    const filteredEvents = isAdmin 
      ? events 
      : events.filter(e => e.isPublished);
    
    // Trier par date (plus récent en premier)
    filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({ events: filteredEvents });
  } catch (error) {
    console.error('[Events API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * POST - Crée un nouvel événement (admin uniquement)
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, description, image, date, category, location, invitedMembers, isPublished } = body;
    
    if (!title || !date || !category) {
      return NextResponse.json(
        { error: 'Titre, date et catégorie sont requis' },
        { status: 400 }
      );
    }
    
    const newEvent = await createEvent({
      title,
      description: description || '',
      image,
      date,
      category,
      location,
      invitedMembers: invitedMembers || [],
      isPublished: isPublished ?? false,
      createdBy: admin.id,
    });
    
    // Logger l'action avec before/after optimisés
    const { previousValue, newValue } = prepareAuditValues(undefined, newEvent);
    await logAction({
      action: "event.create",
      resourceType: "event",
      resourceId: newEvent.id,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/events" },
    });
    
    return NextResponse.json({ event: newEvent, success: true });
  } catch (error) {
    console.error('[Events API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

