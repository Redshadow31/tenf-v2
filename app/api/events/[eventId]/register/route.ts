import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eventRepository, memberRepository } from '@/lib/repositories';

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
    const event = await eventRepository.findById(eventId);
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
    
    // Récupérer l'utilisateur Discord connecté depuis les cookies
    const cookieStore = cookies();
    const discordUserId = cookieStore.get('discord_user_id')?.value;
    const discordUsername = cookieStore.get('discord_username')?.value;
    const discordAvatar = cookieStore.get('discord_avatar')?.value;
    
    if (!discordUserId) {
      // Debug en développement
      const isDev = process.env.NODE_ENV === 'development';
      const allCookies = cookieStore.getAll();
      const debugInfo = isDev ? {
        hasDiscordUserIdCookie: !!cookieStore.get('discord_user_id'),
        cookieNames: allCookies.map(c => c.name),
        origin: request.headers.get('origin'),
        host: request.headers.get('host'),
        referer: request.headers.get('referer'),
      } : undefined;
      
      console.error('[Event Registration] Utilisateur non connecté', debugInfo);
      
      return NextResponse.json(
        { 
          error: 'Vous devez être connecté pour vous inscrire',
          ...(debugInfo && { debug: debugInfo })
        },
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
    
    // S'inscrire à l'événement
    const registration = await eventRepository.addRegistration({
      eventId,
      twitchLogin: member.twitchLogin,
      displayName: member.displayName || member.twitchLogin,
      discordId: member.discordId,
      discordUsername: member.discordUsername || discordUsername,
      notes: notes || undefined,
      registeredAt: new Date(),
    });
    
    // Convertir au format attendu par le frontend
    const formattedRegistration = {
      id: registration.id,
      eventId: registration.eventId,
      twitchLogin: registration.twitchLogin,
      displayName: registration.displayName,
      discordId: registration.discordId,
      discordUsername: registration.discordUsername,
      notes: registration.notes,
      registeredAt: registration.registeredAt.toISOString(),
    };

    return NextResponse.json({ 
      registration: formattedRegistration,
      success: true,
      message: 'Inscription réussie !' 
    });
  } catch (error) {
    console.error('[Event Registration API] Erreur POST:', error);
    
    if (error instanceof Error && (error.message.includes('déjà inscrit') || error.message.includes('déjà inscrit'))) {
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

