import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIntegration, registerForIntegration } from '@/lib/integrationStorage';
import { findMemberByIdentifier, loadMemberDataFromStorage } from '@/lib/memberData';

/**
 * POST - Inscription à une intégration
 * Accepte deux modes :
 * 1. Utilisateur connecté Discord (inscription automatique avec données de la base)
 * 2. Formulaire libre (pour personnes non encore membres du système)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { integrationId: string } }
) {
  try {
    const { integrationId } = params;
    const body = await request.json();
    
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
    
    // Récupérer l'utilisateur Discord connecté depuis les cookies (optionnel)
    const cookieStore = cookies();
    const discordUserId = cookieStore.get('discord_user_id')?.value;
    const discordUsername = cookieStore.get('discord_username')?.value;
    
    // Fonction pour extraire le pseudo Twitch d'un lien de chaîne
    const extractTwitchLogin = (url: string): string | null => {
      if (!url) return null;
      const patterns = [
        /twitch\.tv\/([a-zA-Z0-9_]+)/i,
        /^([a-zA-Z0-9_]+)$/, // Juste le pseudo
      ];
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1].toLowerCase();
        }
      }
      return null;
    };

    // Validation des champs requis (même pour les utilisateurs connectés)
    const { 
      discordUsername: formDiscordUsername, 
      twitchChannelUrl,
      parrain,
      notes 
    } = body;
    
    // Validation des champs obligatoires
    if (!formDiscordUsername) {
      return NextResponse.json(
        { error: 'Le pseudo Discord est requis' },
        { status: 400 }
      );
    }
    
    if (!twitchChannelUrl) {
      return NextResponse.json(
        { error: 'Le lien de chaîne Twitch est requis' },
        { status: 400 }
      );
    }
    
    if (!parrain) {
      return NextResponse.json(
        { error: 'Le parrain TENF est requis' },
        { status: 400 }
      );
    }
    
    // Extraire le pseudo Twitch du lien
    const twitchLogin = extractTwitchLogin(twitchChannelUrl);
    if (!twitchLogin) {
      return NextResponse.json(
        { error: 'Format de lien Twitch invalide. Utilisez un lien du type https://www.twitch.tv/pseudo ou juste le pseudo' },
        { status: 400 }
      );
    }
    
    // Normaliser le lien Twitch
    const normalizedTwitchUrl = twitchChannelUrl.startsWith('http') 
      ? twitchChannelUrl 
      : `https://www.twitch.tv/${twitchLogin}`;
    
    // S'inscrire avec les données du formulaire (même si connecté Discord, on utilise les données du formulaire)
    const registration = await registerForIntegration(integrationId, {
      twitchLogin: twitchLogin,
      twitchChannelUrl: normalizedTwitchUrl,
      displayName: formDiscordUsername, // Pseudo Discord
      discordId: discordUserId || undefined,
      discordUsername: formDiscordUsername,
      parrain: parrain,
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

