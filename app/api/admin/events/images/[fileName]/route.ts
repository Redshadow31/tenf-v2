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

    // Déterminer le Content-Type depuis l'extension du fichier
    let contentType = 'image/jpeg'; // Par défaut
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'webp':
        contentType = 'image/webp';
        break;
      case 'svg':
        contentType = 'image/svg+xml';
        break;
      default:
        contentType = 'image/jpeg';
    }
    
    // Essayer de récupérer le Content-Type depuis les métadonnées si disponible
    try {
      const metadata = await store.getMetadata(fileName);
      if (metadata?.metadata) {
        const customMetadata = metadata.metadata as Record<string, any>;
        if (customMetadata.contentType) {
          contentType = customMetadata.contentType;
        }
      }
    } catch (error) {
      // Si on ne peut pas récupérer les métadonnées, utiliser le type déterminé par l'extension
      console.warn('[Event Image API] Impossible de récupérer les métadonnées:', error);
    }

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

