import { NextResponse } from 'next/server';
import { getTwitchUsers } from '@/lib/twitch';

/**
 * Récupère les informations Twitch pour une liste de logins
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const logins = searchParams.get('logins')?.split(',') ?? [];

  if (logins.length === 0) {
    return NextResponse.json(
      { error: 'No logins provided' },
      { status: 400 }
    );
  }

  try {
    const users = await getTwitchUsers(logins);
    
    // Formater les utilisateurs pour correspondre au format attendu
    const formattedUsers = users.map(user => ({
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
    }));
    
    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error('Error fetching Twitch users:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

