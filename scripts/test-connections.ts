/**
 * Script de test des connexions aux services
 * Vérifie Supabase, Netlify Blobs, et Upstash Redis
 * 
 * Note: Ce script nécessite les variables d'environnement configurées.
 * En local, assurez-vous d'avoir un fichier .env.local avec les variables nécessaires.
 * Sur Netlify, les variables sont automatiquement chargées.
 */

// Charger les variables d'environnement depuis .env.local si disponible
import { config } from 'dotenv';
import { resolve } from 'path';

// Essayer de charger .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const result = config({ path: envPath });
  if (result.error) {
    // Vérifier si c'est une erreur "fichier non trouvé" (acceptable) ou une autre erreur
    const errorMessage = result.error.message || '';
    if (!errorMessage.includes('ENOENT') && !errorMessage.includes('not found')) {
      console.warn('⚠️  Erreur chargement .env.local:', errorMessage);
    }
  } else {
    console.log('✅ Variables d\'environnement chargées depuis .env.local');
  }
} catch (e) {
  // Ignorer si le fichier n'existe pas
  console.warn('⚠️  Fichier .env.local non trouvé - les variables d\'environnement doivent être configurées');
}

import { getSupabaseAdmin } from '@/lib/db/supabase';
import { getRedisClient } from '@/lib/cache';
import { getBlobStore } from '@/lib/memberData';
import { eventRepository } from '@/lib/repositories';

async function testSupabase() {
  console.log('\n🔍 Test Supabase...');
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('events').select('id').limit(1);
    
    if (error) {
      console.error('❌ Erreur Supabase:', error.message);
      return false;
    }
    
    console.log('✅ Supabase: Connexion OK');
    console.log(`   Événements trouvés: ${data?.length || 0}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur Supabase:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testNetlifyBlobs() {
  console.log('\n🔍 Test Netlify Blobs...');
  try {
    // Vérifier si on est dans l'environnement Netlify
    const isNetlify = process.env.NETLIFY === 'true' || process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
    
    if (!isNetlify) {
      console.warn('⚠️  Netlify Blobs: Non testable en local (nécessite l\'environnement Netlify)');
      console.warn('   Pour tester, exécutez ce script sur Netlify ou dans un environnement Netlify');
      return null; // null = non testable, pas une erreur
    }
    
    const store = getBlobStore('tenf-members');
    const testKey = 'test-connection';
    await store.set(testKey, JSON.stringify({ test: true, timestamp: Date.now() }));
    const data = await store.get(testKey, { type: 'text' });
    await store.delete(testKey);
    
    if (data) {
      console.log('✅ Netlify Blobs: Connexion OK');
      return true;
    } else {
      console.error('❌ Netlify Blobs: Pas de données récupérées');
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('Not in Netlify environment')) {
      console.warn('⚠️  Netlify Blobs: Non testable en local (nécessite l\'environnement Netlify)');
      return null; // null = non testable, pas une erreur
    }
    console.error('❌ Erreur Netlify Blobs:', errorMessage);
    return false;
  }
}

async function testUpstashRedis() {
  console.log('\n🔍 Test Upstash Redis...');
  try {
    const redis = getRedisClient();
    if (!redis) {
      console.warn('⚠️  Redis: Non configuré (variables d\'environnement manquantes)');
      return false;
    }
    
    const testKey = 'test:connection';
    await redis.set(testKey, 'test');
    const value = await redis.get(testKey);
    await redis.del(testKey);
    
    if (value === 'test') {
      console.log('✅ Upstash Redis: Connexion OK');
      return true;
    } else {
      console.error('❌ Upstash Redis: Valeur incorrecte');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur Upstash Redis:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

async function testEventRepository() {
  console.log('\n🔍 Test EventRepository...');
  try {
    const events = await eventRepository.findAll(10, 0);
    console.log(`✅ EventRepository: ${events.length} événements récupérés`);
    return true;
  } catch (error) {
    console.error('❌ Erreur EventRepository:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

async function main() {
  console.log('🧪 Test des connexions aux services\n');
  
  const results = {
    supabase: await testSupabase(),
    netlifyBlobs: await testNetlifyBlobs(),
    upstashRedis: await testUpstashRedis(),
    eventRepository: await testEventRepository(),
  } as {
    supabase: boolean;
    netlifyBlobs: boolean | null;
    upstashRedis: boolean;
    eventRepository: boolean;
  };
  
  console.log('\n📊 Résumé:');
  console.log(`   Supabase: ${results.supabase ? '✅' : '❌'}`);
  console.log(`   Netlify Blobs: ${results.netlifyBlobs === null ? '⚠️  (non testable en local)' : (results.netlifyBlobs ? '✅' : '❌')}`);
  console.log(`   Upstash Redis: ${results.upstashRedis ? '✅' : '⚠️  (optionnel)'}`);
  console.log(`   EventRepository: ${results.eventRepository ? '✅' : '❌'}`);
  
  // Netlify Blobs peut être null (non testable en local), ce n'est pas une erreur
  const allCritical = results.supabase && results.eventRepository && (results.netlifyBlobs !== false);
  if (allCritical) {
    console.log('\n✅ Toutes les connexions critiques fonctionnent');
    if (results.netlifyBlobs === null) {
      console.log('   Note: Netlify Blobs ne peut être testé que sur Netlify');
    }
  } else {
    console.log('\n❌ Certaines connexions critiques échouent');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
