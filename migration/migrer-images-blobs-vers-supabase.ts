/**
 * Script pour migrer les images d'événements depuis Netlify Blobs vers Supabase Storage
 * 
 * ⚠️ IMPORTANT : Ce script nécessite l'accès à Netlify Blobs
 * Il faut être dans un environnement Netlify ou avoir les variables d'environnement configurées
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { getStore } from '@netlify/blobs';
import { supabaseAdmin } from '../lib/db/supabase';
import { eventRepository } from '../lib/repositories';

interface MigrationResult {
  fileName: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

async function migrateImagesFromBlobs() {
  console.log('🔄 Migration des images depuis Netlify Blobs vers Supabase Storage...\n');

  try {
    // 1. Vérifier que Netlify Blobs est disponible
    let blobStore;
    try {
      // Essayer d'abord avec la méthode standard
      blobStore = getStore('tenf-events-images');
    } catch (error: any) {
      // Si ça échoue, essayer avec les variables d'environnement explicites
      const siteID = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
      const token = process.env.NETLIFY_AUTH_TOKEN || process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_PERSONAL_ACCESS_TOKEN;
      
      if (siteID && token) {
        try {
          blobStore = getStore({
            name: 'tenf-events-images',
            siteID,
            token,
          });
          console.log('✅ Connexion à Netlify Blobs réussie avec variables explicites\n');
        } catch (configError: any) {
          console.error('❌ Impossible d\'accéder à Netlify Blobs:', configError.message);
          console.log('\n💡 Solutions:');
          console.log('   1. Configurer NETLIFY_SITE_ID et NETLIFY_AUTH_TOKEN dans .env.local');
          console.log('   2. Exécuter ce script dans un environnement Netlify');
          console.log('   3. Ou migrer manuellement les images via le dashboard Supabase\n');
          return;
        }
      } else {
        console.error('❌ Impossible d\'accéder à Netlify Blobs:', error.message);
        console.log('\n💡 Variables d\'environnement manquantes:');
        if (!siteID) console.log('   - NETLIFY_SITE_ID ou SITE_ID');
        if (!token) console.log('   - NETLIFY_AUTH_TOKEN, NETLIFY_BLOBS_TOKEN ou NETLIFY_PERSONAL_ACCESS_TOKEN');
        console.log('\n💡 Solutions:');
        console.log('   1. Ajouter ces variables dans .env.local');
        console.log('   2. Ou migrer manuellement les images via le dashboard Supabase');
        console.log('   3. Ou uploader les images directement dans Supabase Storage\n');
        return;
      }
    }

    // 2. Lister toutes les images dans Netlify Blobs
    console.log('📋 Liste des images dans Netlify Blobs...');
    const list = await blobStore.list();
    console.log(`   ${list.blobs.length} image(s) trouvée(s)\n`);

    if (list.blobs.length === 0) {
      console.log('✅ Aucune image à migrer.\n');
      return;
    }

    // 3. Récupérer tous les événements pour mapper les URLs
    const events = await eventRepository.findAll(1000, 0);
    const eventsWithImages = events.filter(e => e.image);
    
    console.log(`📊 ${eventsWithImages.length} événement(s) avec image(s) dans la DB\n`);

    const results: MigrationResult[] = [];
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 4. Migrer chaque image
    for (const blob of list.blobs) {
      const fileName = blob.key;
      
      try {
        // Vérifier si l'image existe déjà dans Supabase Storage
        const { error: checkError } = await supabaseAdmin.storage
          .from('events-images')
          .download(fileName);

        if (!checkError) {
          console.log(`⏭️  ${fileName}: Déjà présente dans Supabase Storage, ignorée`);
          results.push({ fileName, status: 'skipped' });
          skippedCount++;
          continue;
        }

        // Récupérer l'image depuis Netlify Blobs
        console.log(`📥 Téléchargement ${fileName} depuis Netlify Blobs...`);
        const imageData = await blobStore.get(fileName, { type: 'blob' });

        if (!imageData) {
          console.log(`⚠️  ${fileName}: Données non trouvées dans Blobs`);
          results.push({ fileName, status: 'error', error: 'Données non trouvées' });
          errorCount++;
          continue;
        }

        // Déterminer le Content-Type
        const extension = fileName.split('.').pop()?.toLowerCase();
        let contentType = 'image/jpeg';
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
        }

        // Upload vers Supabase Storage
        console.log(`📤 Upload ${fileName} vers Supabase Storage...`);
        const { data, error } = await supabaseAdmin.storage
          .from('events-images')
          .upload(fileName, imageData, {
            contentType,
            upsert: true, // Écraser si existe déjà
            metadata: {
              originalName: fileName,
              migratedFrom: 'netlify-blobs',
              migratedAt: new Date().toISOString(),
            },
          });

        if (error) {
          console.error(`❌ ${fileName}: Erreur upload - ${error.message}`);
          results.push({ fileName, status: 'error', error: error.message });
          errorCount++;
        } else {
          console.log(`✅ ${fileName}: Migré avec succès`);
          results.push({ fileName, status: 'success' });
          successCount++;
        }
      } catch (error: any) {
        console.error(`❌ ${fileName}: Erreur - ${error.message}`);
        results.push({ fileName, status: 'error', error: error.message });
        errorCount++;
      }
    }

    // 5. Mettre à jour les URLs dans la base de données
    console.log('\n📝 Mise à jour des URLs dans la base de données...');
    
    let updatedCount = 0;
    for (const event of eventsWithImages) {
      if (!event.image) continue;

      // Vérifier si l'URL doit être mise à jour
      let needsUpdate = false;
      let newUrl = event.image;

      // Si l'URL pointe vers Netlify Blobs ou un format incorrect
      if (event.image.includes('blobs') || event.image.includes('netlify') || !event.image.startsWith('/api/admin/events/images/')) {
        // Extraire le fileName
        let fileName: string | undefined;
        if (event.image.includes('/')) {
          fileName = event.image.split('/').pop();
        }

        if (fileName) {
          // Vérifier que l'image existe maintenant dans Supabase Storage
          const { error: checkError } = await supabaseAdmin.storage
            .from('events-images')
            .download(fileName);

          if (!checkError) {
            newUrl = `/api/admin/events/images/${fileName}`;
            needsUpdate = true;
          }
        }
      }

      if (needsUpdate) {
        try {
          await eventRepository.update(event.id, {
            image: newUrl,
            updatedAt: new Date(),
          });
          console.log(`✅ ${event.title}: URL mise à jour - ${newUrl}`);
          updatedCount++;
        } catch (error: any) {
          console.error(`❌ ${event.title}: Erreur mise à jour URL - ${error.message}`);
        }
      }
    }

    // Résumé final
    console.log('\n============================================================');
    console.log('📊 RÉSUMÉ DE LA MIGRATION');
    console.log('============================================================');
    console.log(`✅ Images migrées: ${successCount}`);
    console.log(`⏭️  Images ignorées (déjà présentes): ${skippedCount}`);
    console.log(`❌ Erreurs: ${errorCount}`);
    console.log(`📝 URLs mises à jour: ${updatedCount}`);
    console.log('============================================================\n');

    if (errorCount > 0) {
      console.log('❌ ERREURS DÉTAILLÉES:\n');
      results
        .filter(r => r.status === 'error')
        .forEach(r => {
          console.log(`   ${r.fileName}: ${r.error}`);
        });
      console.log('');
    }

    return results;
  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message);
    throw error;
  }
}

// Exécuter le script
migrateImagesFromBlobs()
  .then(() => {
    console.log('✨ Migration terminée !\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });
