import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // Supprimer tous les cookies Discord
  response.cookies.delete('discord_user_id');
  response.cookies.delete('discord_username');
  response.cookies.delete('discord_avatar');
  response.cookies.delete('discord_refresh_token');
  response.cookies.delete('discord_oauth_state');

  return response;
}

