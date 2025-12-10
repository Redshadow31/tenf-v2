import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/discord/callback`;
  
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
  response.cookies.set('discord_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600, // 10 minutes
  });

  return response;
}

