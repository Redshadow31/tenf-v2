/**
 * Script de test pour vérifier la configuration Redis
 * Usage: tsx scripts/test-redis.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement depuis .env.local
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

import { cacheSet, cacheGet, cacheDelete, getRedisClient } from '../lib/cache';

async function testRedis() {
  console.log('🧪 Test de la configuration Redis...\n');

  // Vérifier que le client Redis peut être créé
  const client = getRedisClient();
  if (!client) {
    console.error('❌ Redis non configuré !');
    console.error('   Veuillez configurer UPSTASH_REDIS_REST_URL et UPSTASH_REDIS_REST_TOKEN');
    console.error('   Voir: migration/CONFIGURATION_UPSTASH_REDIS.md');
    process.exit(1);
  }

  console.log('✅ Client Redis initialisé\n');

  // Test 1: Set
  console.log('📝 Test 1: Set...');
  try {
    await cacheSet('test:key', { message: 'Hello Redis!', timestamp: Date.now() }, 60);
    console.log('✅ Cache set réussi\n');
  } catch (error) {
    console.error('❌ Erreur lors du set:', error);
    process.exit(1);
  }

  // Test 2: Get
  console.log('📖 Test 2: Get...');
  try {
    const value = await cacheGet<{ message: string; timestamp: number }>('test:key');
    if (value && value.message === 'Hello Redis!') {
      console.log('✅ Cache get réussi:', value);
      console.log('   Timestamp:', new Date(value.timestamp).toISOString(), '\n');
    } else {
      console.error('❌ Valeur incorrecte:', value);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors du get:', error);
    process.exit(1);
  }

  // Test 3: Delete
  console.log('🗑️  Test 3: Delete...');
  try {
    await cacheDelete('test:key');
    const deleted = await cacheGet('test:key');
    if (deleted === null) {
      console.log('✅ Cache delete réussi\n');
    } else {
      console.error('❌ La clé n\'a pas été supprimée');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur lors du delete:', error);
    process.exit(1);
  }

  // Test 4: Types complexes
  console.log('🔧 Test 4: Types complexes...');
  try {
    const complexData = {
      members: [
        { twitchLogin: 'test1', displayName: 'Test 1' },
        { twitchLogin: 'test2', displayName: 'Test 2' },
      ],
      count: 2,
      timestamp: Date.now(),
    };
    await cacheSet('test:complex', complexData, 60);
    const retrieved = await cacheGet<typeof complexData>('test:complex');
    if (retrieved && retrieved.members.length === 2 && retrieved.count === 2) {
      console.log('✅ Types complexes fonctionnent\n');
      await cacheDelete('test:complex');
    } else {
      console.error('❌ Types complexes incorrects');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Erreur avec les types complexes:', error);
    process.exit(1);
  }

  console.log('🎉 Tous les tests Redis sont passés !');
  console.log('   Redis est correctement configuré et fonctionne.\n');
}

testRedis().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
