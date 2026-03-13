import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/requireAdmin';
import { getTwitchOAuthTokens, isTokenValid } from '@/lib/twitchOAuth';

/**
 * GET - Vérifie le statut de connexion Twitch pour Red
 */
export async function GET() {
  try {
    // Vérifier l'authentification
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const tokens = await getTwitchOAuthTokens('red');
    const isConnected = isTokenValid(tokens);

    return NextResponse.json({
      connected: isConnected,
      expiresAt: tokens?.expires_at || null,
    });
  } catch (error) {
    console.error('[Twitch OAuth Status] Erreur:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

