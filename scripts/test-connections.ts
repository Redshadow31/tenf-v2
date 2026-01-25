/**
 * Script de test des connexions aux services
 * Vérifie Supabase, Netlify Blobs, et Upstash Redis
 */

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
    console.error('❌ Erreur Netlify Blobs:', error instanceof Error ? error.message : String(error));
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
  };
  
  console.log('\n📊 Résumé:');
  console.log(`   Supabase: ${results.supabase ? '✅' : '❌'}`);
  console.log(`   Netlify Blobs: ${results.netlifyBlobs ? '✅' : '❌'}`);
  console.log(`   Upstash Redis: ${results.upstashRedis ? '✅' : '⚠️  (optionnel)'}`);
  console.log(`   EventRepository: ${results.eventRepository ? '✅' : '❌'}`);
  
  const allCritical = results.supabase && results.netlifyBlobs && results.eventRepository;
  if (allCritical) {
    console.log('\n✅ Toutes les connexions critiques fonctionnent');
  } else {
    console.log('\n❌ Certaines connexions critiques échouent');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
