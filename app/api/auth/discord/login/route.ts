import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = requestUrl.searchParams.get("callbackUrl") || "/";
  const nextAuthSignInUrl = new URL("/api/auth/signin/discord", requestUrl.origin);
  nextAuthSignInUrl.searchParams.set("callbackUrl", callbackUrl);
  return NextResponse.redirect(nextAuthSignInUrl);
}

