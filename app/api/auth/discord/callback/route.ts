import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/discord/callback`;

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/auth/login?error=missing_code_or_state', request.url)
    );
  }

  // Vérifier le state (CSRF protection)
  const cookieStore = cookies();
  const storedState = cookieStore.get('discord_oauth_state')?.value;

  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL('/auth/login?error=invalid_state', request.url)
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      new URL('/auth/login?error=server_config_error', request.url)
    );
  }

  try {
    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Discord token error:', errorText);
      return NextResponse.redirect(
        new URL('/auth/login?error=token_exchange_failed', request.url)
      );
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    // Récupérer les informations de l'utilisateur Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('Discord user error:', errorText);
      return NextResponse.redirect(
        new URL('/auth/login?error=user_fetch_failed', request.url)
      );
    }

    const userData: DiscordUser = await userResponse.json();

    // Créer une réponse de redirection
    const response = NextResponse.redirect(new URL('/', request.url));

    // Stocker les informations utilisateur dans des cookies sécurisés
    // En production, vous devriez utiliser des sessions serveur (Redis, DB, etc.)
    response.cookies.set('discord_user_id', userData.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });

    response.cookies.set('discord_username', userData.username, {
      httpOnly: false, // Accessible côté client pour affichage
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    response.cookies.set('discord_avatar', userData.avatar || '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    // Stocker le refresh token de manière sécurisée (httpOnly)
    response.cookies.set('discord_refresh_token', tokenData.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 jours
    });

    // Nettoyer le state cookie
    response.cookies.delete('discord_oauth_state');

    return response;
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return NextResponse.redirect(
      new URL('/auth/login?error=oauth_error', request.url)
    );
  }
}

