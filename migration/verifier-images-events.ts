/**
 * Script pour vérifier l'état des images d'événements
 * - Vérifie les URLs dans la base de données
 * - Vérifie si les images existent dans Supabase Storage
 * - Identifie les images à migrer depuis Netlify Blobs
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { supabaseAdmin } from '../lib/db/supabase';
import { eventRepository } from '../lib/repositories';

interface ImageStatus {
  eventId: string;
  title: string;
  imageUrl: string;
  status: 'ok' | 'missing' | 'wrong_url' | 'needs_migration';
  fileName?: string;
  existsInStorage?: boolean;
}

async function verifyEventImages() {
  console.log('🔍 Vérification des images d\'événements...\n');

  try {
    // 1. Récupérer tous les événements avec images
    const events = await eventRepository.findAll(1000, 0);
    const eventsWithImages = events.filter(e => e.image);

    console.log(`📊 ${eventsWithImages.length} événement(s) avec image(s)\n`);

    const results: ImageStatus[] = [];

    for (const event of eventsWithImages) {
      const imageUrl = event.image!;
      let status: ImageStatus['status'] = 'ok';
      let fileName: string | undefined;
      let existsInStorage = false;

      // Extraire le fileName de l'URL
      if (imageUrl.includes('/api/admin/events/images/')) {
        fileName = imageUrl.split('/api/admin/events/images/')[1];
      } else if (imageUrl.includes('/')) {
        fileName = imageUrl.split('/').pop();
      }

      // Vérifier si l'URL est correcte
      if (!imageUrl.startsWith('/api/admin/events/images/')) {
        status = 'wrong_url';
        console.log(`⚠️  ${event.title}: URL incorrecte - ${imageUrl}`);
      } else if (fileName) {
        // Vérifier si l'image existe dans Supabase Storage
        try {
          const { data, error } = await supabaseAdmin.storage
            .from('events-images')
            .list(fileName.split('/')[0] || '', {
              limit: 1000,
              search: fileName,
            });

          // Vérifier directement si le fichier existe
          const { error: downloadError } = await supabaseAdmin.storage
            .from('events-images')
            .download(fileName);

          if (downloadError) {
            status = 'missing';
            existsInStorage = false;
            console.log(`❌ ${event.title}: Image manquante - ${fileName}`);
          } else {
            status = 'ok';
            existsInStorage = true;
            console.log(`✅ ${event.title}: Image OK - ${fileName}`);
          }
        } catch (error: any) {
          status = 'needs_migration';
          console.log(`🔄 ${event.title}: Nécessite migration - ${fileName}`);
        }
      } else {
        status = 'wrong_url';
        console.log(`⚠️  ${event.title}: Impossible d'extraire le fileName`);
      }

      results.push({
        eventId: event.id,
        title: event.title,
        imageUrl,
        status,
        fileName,
        existsInStorage,
      });
    }

    // Résumé
    console.log('\n============================================================');
    console.log('📊 RÉSUMÉ');
    console.log('============================================================');
    
    const ok = results.filter(r => r.status === 'ok').length;
    const missing = results.filter(r => r.status === 'missing').length;
    const wrongUrl = results.filter(r => r.status === 'wrong_url').length;
    const needsMigration = results.filter(r => r.status === 'needs_migration').length;

    console.log(`✅ Images OK: ${ok}`);
    console.log(`❌ Images manquantes: ${missing}`);
    console.log(`⚠️  URLs incorrectes: ${wrongUrl}`);
    console.log(`🔄 Nécessitent migration: ${needsMigration}`);
    console.log('============================================================\n');

    // Détails des problèmes
    if (missing > 0 || wrongUrl > 0 || needsMigration > 0) {
      console.log('📋 DÉTAILS DES PROBLÈMES:\n');
      
      results.forEach(result => {
        if (result.status !== 'ok') {
          console.log(`${result.status === 'missing' ? '❌' : result.status === 'wrong_url' ? '⚠️' : '🔄'} ${result.title}`);
          console.log(`   URL: ${result.imageUrl}`);
          console.log(`   FileName: ${result.fileName || 'N/A'}`);
          console.log('');
        }
      });
    }

    return results;
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    throw error;
  }
}

// Exécuter le script
verifyEventImages()
  .then(() => {
    console.log('✨ Vérification terminée !\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
