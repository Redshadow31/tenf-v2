import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/requireAdmin';
import { loadEvents } from '@/lib/eventStorage';
import { loadEventRegistrations } from '@/lib/eventStorage';
import {
  loadEventPresenceData,
  addOrUpdatePresence,
  removePresence,
  updatePresenceNote,
  EventPresence,
} from '@/lib/eventPresenceStorage';
import { getAllMemberData, loadMemberDataFromStorage } from '@/lib/memberData';
import { createEvent, Event } from '@/lib/eventStorage';

// Forcer l'utilisation du runtime Node.js (nécessaire pour @netlify/blobs)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET - Récupère les présences pour un mois donné ou pour un événement spécifique
 * Query params: ?month=YYYY-MM ou ?eventId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    // Authentification NextAuth + rôle admin requis
    const admin = await requireAdmin();
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou accès refusé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const eventIdParam = searchParams.get('eventId');

    if (eventIdParam) {
      // Récupérer les présences pour un événement spécifique
      const presenceData = await loadEventPresenceData(eventIdParam);
      const registrations = await loadEventRegistrations(eventIdParam);
      
      return NextResponse.json({
        eventId: eventIdParam,
        presences: presenceData?.presences || [],
        registrations: registrations || [],
      });
    }

    if (monthParam) {
      // Récupérer tous les événements du mois et leurs présences
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (!monthMatch) {
        return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
      }

      const events = await loadEvents();
      const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date);
        const eventYear = eventDate.getFullYear();
        const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
        return `${eventYear}-${eventMonth}` === monthParam;
      });

      // Charger les présences pour chaque événement
      const eventsWithPresences = await Promise.all(
        monthEvents.map(async (event) => {
          const presenceData = await loadEventPresenceData(event.id);
          const registrations = await loadEventRegistrations(event.id);
          
          return {
            ...event,
            presences: presenceData?.presences || [],
            registrations: registrations || [],
          };
        })
      );

      return NextResponse.json({
        month: monthParam,
        events: eventsWithPresences,
      });
    }

    return NextResponse.json(
      { error: "month ou eventId requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error('[API Event Presence] Erreur GET:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * POST - Ajoute ou met à jour une présence pour un membre à un événement
 * Body: { eventId: string, member: { twitchLogin, displayName, discordId?, discordUsername? }, present: boolean, note?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, member, present, note } = body;

    if (!eventId || !member || !member.twitchLogin || typeof present !== 'boolean') {
      return NextResponse.json(
        { error: "eventId, member (avec twitchLogin) et present sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe
    const events = await loadEvents();
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Charger les inscriptions pour vérifier si le membre était inscrit
    await loadMemberDataFromStorage();
    const registrations = await loadEventRegistrations(eventId);
    const isRegistered = registrations.some(
      r => r.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
    );

    // Ajouter ou mettre à jour la présence
    const presence = await addOrUpdatePresence(
      eventId,
      {
        twitchLogin: member.twitchLogin,
        displayName: member.displayName || member.twitchLogin,
        discordId: member.discordId,
        discordUsername: member.discordUsername,
        isRegistered,
      },
      present,
      note,
      admin.discordId
    );

    return NextResponse.json({
      success: true,
      message: present ? "Présence enregistrée avec succès" : "Présence mise à jour avec succès",
      presence,
    });
  } catch (error) {
    console.error('[API Event Presence] Erreur POST:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PUT - Met à jour la note d'une présence
 * Body: { eventId: string, twitchLogin: string, note: string | undefined }
 */
export async function PUT(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, twitchLogin, note } = body;

    if (!eventId || !twitchLogin) {
      return NextResponse.json(
        { error: "eventId et twitchLogin sont requis" },
        { status: 400 }
      );
    }

    // Mettre à jour la note
    const success = await updatePresenceNote(eventId, twitchLogin, note, admin.discordId);

    if (!success) {
      return NextResponse.json(
        { error: "Présence non trouvée pour ce membre" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Note mise à jour avec succès",
    });
  } catch (error) {
    console.error('[API Event Presence] Erreur PUT:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Supprime une présence
 * Query params: ?eventId=xxx&twitchLogin=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const twitchLogin = searchParams.get('twitchLogin');

    if (!eventId || !twitchLogin) {
      return NextResponse.json(
        { error: "eventId et twitchLogin sont requis" },
        { status: 400 }
      );
    }

    // Supprimer la présence
    const success = await removePresence(eventId, twitchLogin);

    if (!success) {
      return NextResponse.json(
        { error: "Présence non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Présence supprimée avec succès",
    });
  } catch (error) {
    console.error('[API Event Presence] Erreur DELETE:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Crée un événement précédent non enregistré
 * Body: { title: string, date: string, category: string, description?: string, location?: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authentification NextAuth + permission write
    const admin = await requirePermission("write");
    
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié ou permissions insuffisantes" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, date, category, description, location } = body;

    if (!title || !date || !category) {
      return NextResponse.json(
        { error: "title, date et category sont requis" },
        { status: 400 }
      );
    }

    // Valider le format de la date
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      return NextResponse.json(
        { error: "Format de date invalide" },
        { status: 400 }
      );
    }

    // Créer l'événement (non publié par défaut pour un événement passé)
    const newEvent = await createEvent({
      title,
      description: description || '',
      date: eventDate.toISOString(),
      category,
      location,
      isPublished: false, // Non publié car c'est un événement passé ajouté rétrospectivement
      createdBy: admin.discordId,
    });

    return NextResponse.json({
      success: true,
      message: "Événement créé avec succès",
      event: newEvent,
    });
  } catch (error) {
    console.error('[API Event Presence] Erreur PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


