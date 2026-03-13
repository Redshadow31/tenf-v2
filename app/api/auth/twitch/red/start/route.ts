import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { requireAdmin } from '@/lib/requireAdmin';

const TWITCH_OAUTH_STATE_COOKIE = "twitch_red_oauth_state";
const TWITCH_OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60; // 10 minutes

/**
 * GET - Démarre le flux OAuth Twitch pour Red
 * Redirige vers l'URL d'autorisation Twitch
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

    // Générer un state cryptographiquement fort pour la protection CSRF.
    const state = crypto.randomBytes(32).toString('base64url');
    
    const authUrl = new URL('https://id.twitch.tv/oauth2/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'user:read:follows');
    authUrl.searchParams.set('state', state);

    // Rediriger et stocker le state en cookie HttpOnly à durée courte.
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set(TWITCH_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TWITCH_OAUTH_STATE_MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch (error) {
    console.error('[Twitch OAuth Start] Erreur:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

