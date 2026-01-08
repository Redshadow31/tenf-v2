import { NextRequest, NextResponse } from 'next/server';
import { getDiscordUser } from '@/lib/discord';
import { getEvent, registerForEvent } from '@/lib/eventStorage';
import { findMemberByIdentifier, loadMemberDataFromStorage } from '@/lib/memberData';

/**
 * POST - Inscription à un événement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await request.json();
    const { notes } = body;
    
    // Vérifier que l'événement existe et est publié
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }
    
    if (!event.isPublished) {
      return NextResponse.json(
        { error: 'Cet événement n\'est pas disponible' },
        { status: 403 }
      );
    }
    
    // Récupérer l'utilisateur Discord connecté
    const discordUser = await getDiscordUser();
    if (!discordUser) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour vous inscrire' },
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
    
    // S'inscrire à l'événement
    const registration = await registerForEvent(eventId, {
      twitchLogin: member.twitchLogin,
      displayName: member.displayName || member.twitchLogin,
      discordId: member.discordId,
      discordUsername: member.discordUsername,
      notes: notes || undefined,
    });
    
    return NextResponse.json({ 
      registration,
      success: true,
      message: 'Inscription réussie !' 
    });
  } catch (error) {
    console.error('[Event Registration API] Erreur POST:', error);
    
    if (error instanceof Error && error.message.includes('déjà inscrit')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

