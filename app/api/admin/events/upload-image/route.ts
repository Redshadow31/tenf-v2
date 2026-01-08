import { NextRequest, NextResponse } from 'next/server';
import { getCurrentAdmin, hasAdminDashboardAccess } from '@/lib/admin';
import { getStore } from '@netlify/blobs';

/**
 * POST - Upload une image pour un événement
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || !hasAdminDashboardAccess(admin.id)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'L\'image ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `event-${timestamp}-${randomStr}.${extension}`;

    // Stocker dans Netlify Blobs
    const store = getStore('tenf-events-images');
    await store.set(fileName, arrayBuffer, {
      metadata: {
        contentType: file.type,
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadedBy: admin.id,
      },
    });

    // Retourner l'URL de l'image (on utilisera une route API pour servir l'image)
    const imageUrl = `/api/admin/events/images/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl,
      fileName,
    });
  } catch (error) {
    console.error('[Event Image Upload API] Erreur POST:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

