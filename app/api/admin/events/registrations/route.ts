import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { loadAllRegistrations, loadEvents } from '@/lib/eventStorage';

/**
 * GET - Récupère toutes les inscriptions pour tous les événements (admin uniquement)
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 401 });
    }
    
    const events = await loadEvents();
    const allRegistrations = await loadAllRegistrations();
    
    // Enrichir avec les informations des événements
    const result = events.map(event => ({
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        category: event.category,
        isPublished: event.isPublished,
      },
      registrations: allRegistrations[event.id] || [],
      registrationCount: (allRegistrations[event.id] || []).length,
    }));
    
    return NextResponse.json({ 
      eventsWithRegistrations: result,
      totalEvents: events.length,
      totalRegistrations: Object.values(allRegistrations).reduce((sum, regs) => sum + regs.length, 0),
    });
  } catch (error) {
    console.error('[Admin Events Registrations API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

