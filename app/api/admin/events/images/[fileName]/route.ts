import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db/supabase';

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

    // Récupérer l'image depuis Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('events-images')
      .download(fileName);

    if (error || !data) {
      console.error('[Event Image API] Erreur Supabase:', error);
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

    // Convertir Blob en ArrayBuffer pour NextResponse
    const arrayBuffer = await data.arrayBuffer();

    // Retourner l'image
    return new NextResponse(arrayBuffer, {
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

