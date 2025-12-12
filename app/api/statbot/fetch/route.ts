import { NextRequest, NextResponse } from 'next/server';

/**
 * POST - Déclenche la récupération des données Statbot
 * Appelle la Netlify Function statbot-fetch
 */
export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://teamnewfamily.netlify.app';
    const functionUrl = `${baseUrl}/.netlify/functions/statbot-fetch`;

    console.log('[Statbot API] Appel de la Netlify Function:', functionUrl);

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Statbot API] Erreur de la Netlify Function:', errorText);
      return NextResponse.json(
        { error: `Erreur lors de l'appel de la fonction: ${response.status} ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Statbot API] Erreur:', error);
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : 'Erreur inconnue'}` },
      { status: 500 }
    );
  }
}

