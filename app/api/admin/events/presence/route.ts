import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requirePermission } from '@/lib/requireAdmin';
import { eventRepository, evaluationRepository, spotlightRepository } from '@/lib/repositories';

// Helper pour obtenir le monthKey au format YYYY-MM
function getMonthKey(year: number, month: number): string {
  const m = String(month).padStart(2, '0');
  return `${year}-${m}`;
}

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
      const presences = await eventRepository.getPresences(eventIdParam);
      const registrations = await eventRepository.getRegistrations(eventIdParam);
      
      return NextResponse.json({
        eventId: eventIdParam,
        presences: presences || [],
        registrations: registrations.map(reg => ({
          id: reg.id,
          eventId: reg.eventId,
          twitchLogin: reg.twitchLogin,
          displayName: reg.displayName,
          discordId: reg.discordId,
          discordUsername: reg.discordUsername,
          notes: reg.notes,
          registeredAt: reg.registeredAt.toISOString(),
        })) || [],
      });
    }

    if (monthParam) {
      // Récupérer tous les événements du mois et leurs présences
      const monthMatch = monthParam.match(/^(\d{4})-(\d{2})$/);
      if (!monthMatch) {
        return NextResponse.json({ error: "Format de mois invalide (attendu: YYYY-MM)" }, { status: 400 });
      }

      // Récupérer tous les événements du mois (limite élevée)
      const allEvents = await eventRepository.findAll(1000, 0);
      const monthEvents = allEvents.filter(event => {
        const eventDate = event.date;
        const eventYear = eventDate.getFullYear();
        const eventMonth = String(eventDate.getMonth() + 1).padStart(2, '0');
        return `${eventYear}-${eventMonth}` === monthParam;
      });

      // Charger les présences pour chaque événement
      const eventsWithPresences = await Promise.all(
        monthEvents.map(async (event) => {
          try {
            const presences = await eventRepository.getPresences(event.id);
            const registrations = await eventRepository.getRegistrations(event.id);
            
            console.log(`[API Event Presence] Événement ${event.id} (${event.title}): ${presences.length} présences, ${registrations.length} inscriptions`);
            
            return {
              id: event.id,
              title: event.title,
              description: event.description,
              image: event.image,
              date: event.date.toISOString(),
              category: event.category,
              location: event.location,
              invitedMembers: event.invitedMembers,
              isPublished: event.isPublished,
              createdAt: event.createdAt.toISOString(),
              createdBy: event.createdBy,
              updatedAt: event.updatedAt?.toISOString(),
              presences: presences || [],
              registrations: (registrations || []).map(reg => {
                try {
                  return {
                    id: reg.id,
                    eventId: reg.eventId,
                    twitchLogin: reg.twitchLogin,
                    displayName: reg.displayName,
                    discordId: reg.discordId,
                    discordUsername: reg.discordUsername,
                    notes: reg.notes,
                    registeredAt: reg.registeredAt instanceof Date 
                      ? reg.registeredAt.toISOString() 
                      : (typeof reg.registeredAt === 'string' 
                          ? reg.registeredAt 
                          : new Date(reg.registeredAt).toISOString()),
                  };
                } catch (regError) {
                  console.error(`[API Event Presence] Erreur mapping inscription ${reg.id}:`, regError);
                  return null;
                }
              }).filter((reg: any) => reg !== null) || [],
            };
          } catch (eventError) {
            console.error(`[API Event Presence] Erreur chargement événement ${event.id}:`, eventError);
            // Retourner l'événement avec des listes vides plutôt que de faire échouer toute la requête
            return {
              id: event.id,
              title: event.title,
              description: event.description,
              image: event.image,
              date: event.date.toISOString(),
              category: event.category,
              location: event.location,
              invitedMembers: event.invitedMembers,
              isPublished: event.isPublished,
              createdAt: event.createdAt.toISOString(),
              createdBy: event.createdBy,
              updatedAt: event.updatedAt?.toISOString(),
              presences: [],
              registrations: [],
            };
          }
        })
      );

      const response = NextResponse.json({
        month: monthParam,
        events: eventsWithPresences,
      });
      
      // Ajouter des headers de cache pour améliorer les performances
      response.headers.set(
        'Cache-Control',
        'private, s-maxage=30, stale-while-revalidate=60'
      );
      
      return response;
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
    const event = await eventRepository.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Charger les inscriptions pour vérifier si le membre était inscrit
    const registrations = await eventRepository.getRegistrations(eventId);
    const isRegistered = registrations.some(
      r => r.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
    );

    // Ajouter ou mettre à jour la présence
    const presence = await eventRepository.upsertPresence({
      eventId,
      twitchLogin: member.twitchLogin,
      displayName: member.displayName || member.twitchLogin,
      discordId: member.discordId,
      discordUsername: member.discordUsername,
      isRegistered,
      present,
      note,
      validatedBy: admin.discordId,
      addedManually: !isRegistered,
    });

    // Si l'événement est de type Spotlight, synchroniser avec les présences Spotlight
    if (event.category === "Spotlight") {
      try {
        const eventDate = event.date;
        const monthKey = getMonthKey(eventDate.getFullYear(), eventDate.getMonth() + 1);
        const monthEvaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Trouver les spotlights du mois dans les évaluations
        const allSpotlights = monthEvaluations.flatMap(evaluation => evaluation.spotlightEvaluations || []);
        
        // Trouver le spotlight correspondant (le plus proche de la date de l'événement)
        const eventTime = eventDate.getTime();
        let matchingSpotlight = allSpotlights.find(spotlight => {
          const spotlightDate = new Date(spotlight.date);
          const timeDiff = Math.abs(spotlightDate.getTime() - eventTime);
          // Accepter un écart de moins de 3 heures (10800000 ms)
          return timeDiff < 3 * 60 * 60 * 1000;
        });

        // Si aucun spotlight trouvé, chercher celui du même jour
        if (!matchingSpotlight) {
          const eventDay = eventDate.toISOString().split('T')[0];
          matchingSpotlight = allSpotlights.find(spotlight => {
            const spotlightDay = new Date(spotlight.date).toISOString().split('T')[0];
            return spotlightDay === eventDay;
          });
        }

        if (matchingSpotlight) {
          // Mettre à jour la présence dans le spotlight
          const memberIndex = matchingSpotlight.members.findIndex(
            (m: any) => m.twitchLogin.toLowerCase() === member.twitchLogin.toLowerCase()
          );

          if (memberIndex !== -1) {
            // Mettre à jour la présence existante
            matchingSpotlight.members[memberIndex].present = present;
          } else {
            // Ajouter le membre s'il n'existe pas
            matchingSpotlight.members.push({
              twitchLogin: member.twitchLogin,
              present: present,
            });
          }

          // Trouver l'évaluation correspondante et mettre à jour (break après le premier match, donc pas de N+1)
          const evalDataToUpdate = monthEvaluations.find(evalData => {
            if (evalData.spotlightEvaluations) {
              const spotlightIndex = evalData.spotlightEvaluations.findIndex(s => s.id === matchingSpotlight.id);
              return spotlightIndex !== -1;
            }
            return false;
          });
          
          if (evalDataToUpdate && evalDataToUpdate.spotlightEvaluations) {
            const spotlightIndex = evalDataToUpdate.spotlightEvaluations.findIndex(s => s.id === matchingSpotlight.id);
            if (spotlightIndex !== -1) {
              evalDataToUpdate.spotlightEvaluations[spotlightIndex] = matchingSpotlight;
              await evaluationRepository.upsert(evalDataToUpdate);
            }
          }
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la synchronisation Spotlight échoue
        console.error('[API Event Presence] Erreur synchronisation Spotlight:', error);
      }
    }

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
    const success = await eventRepository.updatePresenceNote(eventId, twitchLogin, note, admin.discordId);

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

    // Vérifier que l'événement existe pour connaître sa catégorie
    const event = await eventRepository.findById(eventId);

    // Supprimer la présence
    await eventRepository.removePresence(eventId, twitchLogin);
    const success = true;

    if (!success) {
      return NextResponse.json(
        { error: "Présence non trouvée" },
        { status: 404 }
      );
    }

    // Si l'événement est de type Spotlight, supprimer aussi la présence Spotlight
    if (event && event.category === "Spotlight") {
      try {
        const eventDate = event.date;
        const monthKey = getMonthKey(eventDate.getFullYear(), eventDate.getMonth() + 1);
        const monthEvaluations = await evaluationRepository.findByMonth(monthKey);
        
        // Trouver les spotlights du mois dans les évaluations
        const allSpotlights = monthEvaluations.flatMap(evaluation => evaluation.spotlightEvaluations || []);
        
        // Trouver le spotlight correspondant
        const eventTime = eventDate.getTime();
        let matchingSpotlight = allSpotlights.find(spotlight => {
          const spotlightDate = new Date(spotlight.date);
          const timeDiff = Math.abs(spotlightDate.getTime() - eventTime);
          return timeDiff < 3 * 60 * 60 * 1000;
        });

        if (!matchingSpotlight) {
          const eventDay = eventDate.toISOString().split('T')[0];
          matchingSpotlight = allSpotlights.find(spotlight => {
            const spotlightDay = new Date(spotlight.date).toISOString().split('T')[0];
            return spotlightDay === eventDay;
          });
        }

        if (matchingSpotlight) {
          // Supprimer le membre du spotlight
          matchingSpotlight.members = matchingSpotlight.members.filter(
            (m: any) => m.twitchLogin.toLowerCase() !== twitchLogin.toLowerCase()
          );

          // Trouver l'évaluation correspondante et mettre à jour (break après le premier match, donc pas de N+1)
          const evalDataToUpdate = monthEvaluations.find(evalData => {
            if (evalData.spotlightEvaluations) {
              const spotlightIndex = evalData.spotlightEvaluations.findIndex(s => s.id === matchingSpotlight.id);
              return spotlightIndex !== -1;
            }
            return false;
          });
          
          if (evalDataToUpdate && evalDataToUpdate.spotlightEvaluations) {
            const spotlightIndex = evalDataToUpdate.spotlightEvaluations.findIndex(s => s.id === matchingSpotlight.id);
            if (spotlightIndex !== -1) {
              evalDataToUpdate.spotlightEvaluations[spotlightIndex] = matchingSpotlight;
              await evaluationRepository.upsert(evalDataToUpdate);
            }
          }
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la synchronisation Spotlight échoue
        console.error('[API Event Presence] Erreur synchronisation Spotlight (DELETE):', error);
      }
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
    const newEvent = await eventRepository.create({
      title,
      description: description || '',
      date: eventDate,
      category: category as any,
      location,
      isPublished: false, // Non publié car c'est un événement passé ajouté rétrospectivement
      createdBy: admin.discordId,
    });

    return NextResponse.json({
      success: true,
      message: "Événement créé avec succès",
      event: {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description,
        image: newEvent.image,
        date: newEvent.date.toISOString(),
        category: newEvent.category,
        location: newEvent.location,
        invitedMembers: newEvent.invitedMembers,
        isPublished: newEvent.isPublished,
        createdAt: newEvent.createdAt.toISOString(),
        createdBy: newEvent.createdBy,
        updatedAt: newEvent.updatedAt?.toISOString(),
      },
    });
  } catch (error) {
    console.error('[API Event Presence] Erreur PATCH:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 }
    );
  }
}


