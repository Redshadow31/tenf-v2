import { NextRequest, NextResponse } from 'next/server';
import { getDiscordUser } from '@/lib/discord';
import { getEvent, unregisterFromEvent } from '@/lib/eventStorage';
import { findMemberByIdentifier, loadMemberDataFromStorage } from '@/lib/memberData';

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
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer l'utilisateur Discord connecté
    const discordUser = await getDiscordUser();
    if (!discordUser) {
      return NextResponse.json(
        { error: 'Vous devez être connecté' },
        { status: 401 }
      );
    }
    
    // Charger les données depuis le stockage
    await loadMemberDataFromStorage();
    
    // Récupérer les données du membre depuis la base par Discord ID
    const member = findMemberByIdentifier({ discordId: discordUser.id });
    if (!member) {
      return NextResponse.json(
        { error: 'Membre non trouvé dans la base de données' },
        { status: 404 }
      );
    }
    
    // Se désinscrire de l'événement
    const unregistered = await unregisterFromEvent(eventId, member.twitchLogin);
    
    if (!unregistered) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas inscrit à cet événement' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Désinscription réussie' 
    });
  } catch (error) {
    console.error('[Event Unregistration API] Erreur DELETE:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

