import { NextRequest, NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';

/**
 * GET - Récupère une image d'événement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { fileName: string } }
) {
  try {
    const { fileName } = params;

    if (!fileName) {
      return NextResponse.json(
        { error: 'Nom de fichier requis' },
        { status: 400 }
      );
    }

    // Récupérer l'image depuis Netlify Blobs
    const store = getStore('tenf-events-images');
    const image = await store.get(fileName, { type: 'blob' });

    if (!image) {
      return NextResponse.json(
        { error: 'Image non trouvée' },
        { status: 404 }
      );
    }

    // Récupérer les métadonnées pour le Content-Type
    const metadata = await store.getMetadata(fileName);
    const contentType = metadata?.contentType || 'image/jpeg';

    // Retourner l'image
    return new NextResponse(image, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[Event Image API] Erreur GET:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

