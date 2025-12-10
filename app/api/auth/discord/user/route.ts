import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const userId = cookieStore.get('discord_user_id')?.value;
  const username = cookieStore.get('discord_username')?.value;
  const avatar = cookieStore.get('discord_avatar')?.value;

  if (!userId) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: userId,
      username: username || 'Unknown',
      avatar: avatar || null,
    },
  });
}

