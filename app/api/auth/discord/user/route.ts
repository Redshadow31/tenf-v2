import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/requireUser';

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const userId = user?.discordId;
  const username = user?.username;
  const avatar = user?.avatar;

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

