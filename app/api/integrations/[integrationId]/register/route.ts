import { NextRequest, NextResponse } from 'next/server';
import { getIntegration, registerForIntegration } from '@/lib/integrationStorage';
import { memberRepository } from '@/lib/repositories';
import { requireUser } from '@/lib/requireUser';

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
    
    // P0 sécurité: utilisateur connecté déterminé uniquement via session serveur.
    const user = await requireUser();
    const discordUserId = user?.discordId;
    const discordUsername = user?.username;
    
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

    // Validation des champs requis
    const { 
      discordUsername: formDiscordUsername, 
      twitchChannelUrl,
      parrain,
      notes 
    } = body;

    // Utilisateur connecté Discord: utiliser directement ses données membre
    if (discordUserId) {
      const member = await memberRepository.findByDiscordId(discordUserId);
      if (!member) {
        return NextResponse.json(
          { error: "Profil introuvable. Créez d'abord votre profil sur /membres/me." },
          { status: 400 }
        );
      }

      const isPlaceholder = member.twitchLogin.startsWith("nouveau_") || member.twitchLogin.startsWith("nouveau-");
      if (isPlaceholder || !member.parrain) {
        return NextResponse.json(
          { error: "Profil incomplet. Complétez d'abord votre profil sur /membres/me." },
          { status: 400 }
        );
      }

      const registration = await registerForIntegration(integrationId, {
        twitchLogin: member.twitchLogin,
        twitchChannelUrl: member.twitchUrl || `https://www.twitch.tv/${member.twitchLogin}`,
        displayName: member.discordUsername || member.displayName || member.twitchLogin,
        discordId: member.discordId || discordUserId,
        discordUsername: member.discordUsername || discordUsername || undefined,
        parrain: member.parrain,
        notes: notes || undefined,
      });

      return NextResponse.json({
        registration,
        success: true,
        message: 'Inscription réussie !'
      });
    }

    // Utilisateur non connecté Discord: formulaire obligatoire
    if (!formDiscordUsername) {
      return NextResponse.json({ error: 'Le pseudo Discord est requis' }, { status: 400 });
    }
    if (!twitchChannelUrl) {
      return NextResponse.json({ error: 'Le lien de chaîne Twitch est requis' }, { status: 400 });
    }
    if (!parrain) {
      return NextResponse.json({ error: 'Le parrain TENF est requis' }, { status: 400 });
    }

    const twitchLogin = extractTwitchLogin(twitchChannelUrl);
    if (!twitchLogin) {
      return NextResponse.json(
        { error: 'Format de lien Twitch invalide. Utilisez un lien du type https://www.twitch.tv/pseudo ou juste le pseudo' },
        { status: 400 }
      );
    }

    const normalizedTwitchUrl = twitchChannelUrl.startsWith('http')
      ? twitchChannelUrl
      : `https://www.twitch.tv/${twitchLogin}`;

    const registration = await registerForIntegration(integrationId, {
      twitchLogin,
      twitchChannelUrl: normalizedTwitchUrl,
      displayName: formDiscordUsername,
      discordId: undefined,
      discordUsername: formDiscordUsername,
      parrain,
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
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

