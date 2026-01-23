import { NextRequest, NextResponse } from 'next/server';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { eventRepository } from '@/lib/repositories';
import { logAction, prepareAuditValues } from '@/lib/admin/logger';

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
      const admin = await requireSectionAccess('/admin/events/planification');
      if (!admin) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
      }
      isAdmin = true;
    }
    
    // Récupérer les événements depuis Supabase
    const events = isAdmin 
      ? await eventRepository.findAll()
      : await eventRepository.findPublished();
    
    // Convertir les dates en ISO string pour compatibilité avec le frontend
    const formattedEvents = events.map(event => ({
      ...event,
      date: event.date instanceof Date ? event.date.toISOString() : event.date,
      createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
      updatedAt: event.updatedAt ? (event.updatedAt instanceof Date ? event.updatedAt.toISOString() : event.updatedAt) : undefined,
    }));
    
    // Trier par date (plus récent en premier)
    formattedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json({ events: formattedEvents });
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
    const admin = await requireSectionAccess('/admin/events/planification');
    if (!admin) {
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
    
    // Générer un ID unique pour l'événement
    const eventId = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newEvent = await eventRepository.create({
      id: eventId,
      title,
      description: description || '',
      image,
      date: new Date(date),
      category,
      location,
      invitedMembers: invitedMembers || [],
      isPublished: isPublished ?? false,
      createdBy: admin.discordId,
      createdAt: new Date(),
    });
    
    // Convertir les dates en ISO string pour compatibilité
    const formattedEvent = {
      ...newEvent,
      date: newEvent.date instanceof Date ? newEvent.date.toISOString() : newEvent.date,
      createdAt: newEvent.createdAt instanceof Date ? newEvent.createdAt.toISOString() : newEvent.createdAt,
      updatedAt: newEvent.updatedAt ? (newEvent.updatedAt instanceof Date ? newEvent.updatedAt.toISOString() : newEvent.updatedAt) : undefined,
    };
    
    // Logger l'action avec before/after optimisés
    const { previousValue, newValue } = prepareAuditValues(undefined, formattedEvent);
    await logAction({
      action: "event.create",
      resourceType: "event",
      resourceId: newEvent.id,
      previousValue,
      newValue,
      metadata: { sourcePage: "/admin/events" },
    });
    
    return NextResponse.json({ event: formattedEvent, success: true });
  } catch (error) {
    console.error('[Events API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

