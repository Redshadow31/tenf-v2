import { NextRequest, NextResponse } from 'next/server';
import { eventRepository, memberRepository } from '@/lib/repositories';
import { requireUser } from '@/lib/requireUser';
import { cacheDelete, cacheKey } from '@/lib/cache';

/**
 * DELETE - Désinscription d'un événement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    
    // Vérifier que l'événement existe
    const event = await eventRepository.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    // P0 sécurité: identité utilisateur basée uniquement sur la session NextAuth.
    const user = await requireUser();
    const discordUserId = user?.discordId;
    
    if (!discordUserId) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }
    
    // Récupérer les données du membre depuis Supabase par Discord ID
    const member = await memberRepository.findByDiscordId(discordUserId);
    if (!member) {
      return NextResponse.json(
        { error: 'Membre non trouvé dans la base de données' },
        { status: 404 }
      );
    }
    
    // Vérifier si le membre est inscrit
    const registration = await eventRepository.getRegistration(eventId, member.twitchLogin);
    if (!registration) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à cet événement' },
        { status: 404 }
      );
    }
    
    // Se désinscrire de l'événement
    await eventRepository.removeRegistration(eventId, member.twitchLogin);

    await cacheDelete(cacheKey('api', 'admin', 'events', 'registrations', 'v1'));
    
    return NextResponse.json({ 
      success: true,
      message: 'Désinscription réussie' 
    });
  } catch (error) {
    console.error('[Event Unregistration API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

