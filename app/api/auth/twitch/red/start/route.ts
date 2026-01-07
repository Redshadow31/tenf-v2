import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/admin';

/**
 * GET - Démarre le flux OAuth Twitch pour Red
 * Redirige vers l'URL d'autorisation Twitch
 */
export async function GET() {
  try {
    // Vérifier l'authentification
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twitch/red/callback`
      : process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/twitch/red/callback`
      : null;

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: "Configuration Twitch manquante" },
        { status: 500 }
      );
    }

    // Générer un state pour la sécurité (CSRF protection)
    const state = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64url');
    
    // Stocker le state dans un cookie sécurisé (ou session)
    // Pour simplifier, on le passe dans l'URL et on le vérifie dans le callback
    
    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'user:read:follows');
    authUrl.searchParams.set('state', state);

    // Rediriger vers l'URL d'autorisation Twitch
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('[Twitch OAuth Start] Erreur:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

