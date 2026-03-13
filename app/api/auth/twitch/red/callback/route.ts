import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAdmin } from '@/lib/requireAdmin';
import { saveTwitchOAuthTokens } from '@/lib/twitchOAuth';

export const dynamic = 'force-dynamic';
const TWITCH_OAUTH_STATE_COOKIE = "twitch_red_oauth_state";

/**
 * GET - Callback OAuth Twitch pour Red
 * Reçoit le code d'autorisation et échange contre un access_token
 */
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.redirect(
        new URL('/auth/login?error=unauthorized', request.url).toString()
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(TWITCH_OAUTH_STATE_COOKIE)?.value;

    const clearStateCookie = (response: NextResponse) => {
      response.cookies.set(TWITCH_OAUTH_STATE_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 0,
        path: "/",
      });
      return response;
    };

    if (error) {
      const response = NextResponse.redirect(
        new URL('/admin/follow/red?error=oauth_error', request.url).toString()
      );
      return clearStateCookie(response);
    }

    if (!code) {
      const response = NextResponse.redirect(
        new URL('/admin/follow/red?error=no_code', request.url).toString()
      );
      return clearStateCookie(response);
    }

    if (!state || !expectedState || state !== expectedState) {
      const response = NextResponse.redirect(
        new URL('/admin/follow/red?error=invalid_state', request.url).toString()
      );
      return clearStateCookie(response);
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const redirectUri = process.env.NEXT_PUBLIC_BASE_URL 
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/twitch/red/callback`
      : process.env.NEXTAUTH_URL 
      ? `${process.env.NEXTAUTH_URL}/api/auth/twitch/red/callback`
      : null;

    if (!clientId || !clientSecret || !redirectUri) {
      const response = NextResponse.redirect(
        new URL('/admin/follow/red?error=config_error', request.url).toString()
      );
      return clearStateCookie(response);
    }

    // Échanger le code contre un access_token
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const response = NextResponse.redirect(
        new URL('/admin/follow/red?error=token_exchange_failed', request.url).toString()
      );
      return clearStateCookie(response);
    }

    const tokenData = await tokenResponse.json();
    
    // Sauvegarder les tokens pour Red
    await saveTwitchOAuthTokens('red', {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      scope: tokenData.scope,
    });

    // Rediriger vers la page de suivi follow avec un message de succès
    const response = NextResponse.redirect(
      new URL('/admin/follow/red?success=twitch_connected', request.url).toString()
    );
    return clearStateCookie(response);
  } catch (error) {
    const response = NextResponse.redirect(
      new URL('/admin/follow/red?error=internal_error', request.url).toString()
    );
    response.cookies.set(TWITCH_OAUTH_STATE_COOKIE, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });
    return response;
  }
}

