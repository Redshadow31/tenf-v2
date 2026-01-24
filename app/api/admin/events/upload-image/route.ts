import { NextRequest, NextResponse } from 'next/server';
import { requireSectionAccess } from '@/lib/requireAdmin';
import { supabaseAdmin } from '@/lib/db/supabase';

/**
 * POST - Upload une image pour un événement
 */
export async function POST(request: NextRequest) {
  try {
    // Authentification NextAuth + accès à la section events requis
    const admin = await requireSectionAccess('/admin/events/planification');
    
    if (!admin) {
      return NextResponse.json({ error: 'Non authentifié ou accès refusé' }, { status: 403 });
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

    // Convertir le fichier en Blob
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `event-${timestamp}-${randomStr}.${extension}`;

    // Upload vers Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('events-images')
      .upload(fileName, blob, {
        contentType: file.type,
        upsert: true,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          uploadedBy: admin.discordId,
        },
      });

    if (error) {
      console.error('[Event Image Upload] Erreur Supabase:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'upload', details: error.message },
        { status: 500 }
      );
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('events-images')
      .getPublicUrl(fileName);

    // Retourner l'URL publique Supabase (ou l'URL de la route API pour compatibilité)
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

