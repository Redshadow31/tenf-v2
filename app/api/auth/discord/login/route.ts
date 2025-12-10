import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const clientId = process.env.DISCORD_CLIENT_ID;
  
  // Utiliser l'URL de la requête pour construire le redirect_uri si DISCORD_REDIRECT_URI n'est pas défini
  // IMPORTANT: Le redirect_uri doit être EXACTEMENT le même que celui utilisé dans le callback
  const requestUrl = new URL(request.url);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || requestUrl.origin;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${baseUrl}/api/auth/discord/callback`;
  
  // Log pour débogage
  console.log('Login - Redirect URI:', redirectUri);
  console.log('Login - Base URL:', baseUrl);
  
  if (!clientId) {
    return NextResponse.json(
      { error: 'Discord Client ID not configured' },
      { status: 500 }
    );
  }

  // Scopes Discord OAuth2
  const scopes = ['identify', 'email', 'guilds'].join(' ');
  
  // Générer un state pour la sécurité (CSRF protection)
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Stocker le state dans un cookie sécurisé
  const response = NextResponse.redirect(
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`
  );
  
  // Stocker le state dans un cookie httpOnly
  // Utiliser 'none' pour sameSite en production pour permettre les redirections depuis Discord
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: isProduction, // Requis avec sameSite: 'none'
    sameSite: isProduction ? 'none' : 'lax', // 'none' permet les redirections cross-site
    maxAge: 600, // 10 minutes
    path: '/',
  });
  
  // Log pour débogage
  console.log('Login - State stored:', state);
  console.log('Login - Base URL:', baseUrl);
  console.log('Login - Redirect URI:', redirectUri);

  return response;
}

