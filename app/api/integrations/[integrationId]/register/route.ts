import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIntegration, registerForIntegration } from '@/lib/integrationStorage';
import { findMemberByIdentifier, loadMemberDataFromStorage } from '@/lib/memberData';

/**
 * POST - Inscription à une intégration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    const body = await request.json();
    const { notes } = body;
    
    // Vérifier que l'intégration existe et est publiée
    const integration = await getIntegration(integrationId);
    if (!integration) {
      return NextResponse.json(
        { error: 'Intégration non trouvée' },
        { status: 404 }
      );
    }
    
    if (!integration.isPublished) {
      return NextResponse.json(
        { error: 'Cette intégration n\'est pas disponible' },
        { status: 403 }
      );
    }
    
    // Récupérer l'utilisateur Discord connecté depuis les cookies
    const cookieStore = cookies();
    const discordUserId = cookieStore.get('discord_user_id')?.value;
    const discordUsername = cookieStore.get('discord_username')?.value;
    const discordAvatar = cookieStore.get('discord_avatar')?.value;
    
    if (!discordUserId) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour vous inscrire' },
        { status: 401 }
      );
    }
    
    // Charger les données depuis le stockage
    await loadMemberDataFromStorage();
    
    // Récupérer les données du membre depuis la base par Discord ID
    const member = findMemberByIdentifier({ discordId: discordUserId });
    if (!member) {
      return NextResponse.json(
        { error: 'Membre non trouvé dans la base de données' },
        { status: 404 }
      );
    }
    
    // S'inscrire à l'intégration
    const registration = await registerForIntegration(integrationId, {
      twitchLogin: member.twitchLogin,
      displayName: member.displayName || member.twitchLogin,
      discordId: member.discordId,
      discordUsername: member.discordUsername || discordUsername,
      notes: notes || undefined,
    });
    
    return NextResponse.json({ 
      registration,
      success: true,
      message: 'Inscription réussie !' 
    });
  } catch (error) {
    console.error('[Integration Registration API] Erreur POST:', error);
    
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

