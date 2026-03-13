import { NextRequest, NextResponse } from 'next/server';

/**
 * Route legacy désactivée :
 * l'auth Discord est désormais gérée exclusivement par NextAuth.
 */
export async function GET(request: NextRequest) {
  const redirectUrl = new URL("/api/auth/signin", request.url);
  redirectUrl.searchParams.set("error", "legacy_discord_callback_disabled");
  return NextResponse.redirect(redirectUrl);
}

