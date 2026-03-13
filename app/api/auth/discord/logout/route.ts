import { NextResponse } from 'next/server';

export async function POST() {
  // Route legacy conservée en no-op pour compatibilité de clients existants.
  // La déconnexion effective passe par /api/auth/signout (NextAuth).
  return NextResponse.json({ success: true });
}

