/**
 * Script de test pour les routes Spotlight migrées vers Supabase
 * 
 * Usage: npx tsx migration/test-routes-spotlight.ts
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface TestResult {
  route: string;
  method: string;
  status: 'success' | 'error' | 'skipped';
  statusCode?: number;
  message?: string;
  error?: string;
}

const results: TestResult[] = [];

async function testRoute(
  route: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any,
  headers?: Record<string, string>
): Promise<TestResult> {
  try {
    const url = `${BASE_URL}${route}`;
    console.log(`\n🧪 Test ${method} ${route}...`);

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));

    const result: TestResult = {
      route,
      method,
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      message: response.ok ? 'OK' : data.error || 'Erreur inconnue',
    };

    if (!response.ok) {
      result.error = JSON.stringify(data);
    }

    return result;
  } catch (error) {
    return {
      route,
      method,
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests des routes Spotlight migrées...\n');
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Note: Ces tests nécessitent une authentification admin
  // Pour des tests complets, il faudrait un token d'authentification valide
  
  console.log('⚠️  Note: Les routes Spotlight nécessitent une authentification admin.');
  console.log('⚠️  Pour des tests complets, configurez un token d\'authentification.\n');

  // Test 1: GET /api/spotlight/active (déjà migré précédemment)
  results.push(await testRoute('/api/spotlight/active', 'GET'));

  // Test 2: GET /api/spotlight/presences (nécessite auth)
  results.push(await testRoute('/api/spotlight/presences', 'GET'));

  // Test 3: GET /api/spotlight/evaluation (nécessite auth)
  results.push(await testRoute('/api/spotlight/evaluation', 'GET'));

  // Test 4: GET /api/spotlight/presence/monthly (nécessite auth)
  results.push(await testRoute('/api/spotlight/presence/monthly', 'GET'));

  // Test 5: GET /api/spotlight/presence/monthly?month=2024-01 (nécessite auth)
  results.push(await testRoute('/api/spotlight/presence/monthly?month=2024-01', 'GET'));

  // Test 6: GET /api/spotlight/evaluations/monthly (nécessite auth)
  results.push(await testRoute('/api/spotlight/evaluations/monthly', 'GET'));

  // Test 7: GET /api/spotlight/progression (nécessite auth)
  results.push(await testRoute('/api/spotlight/progression', 'GET'));

  // Afficher les résultats
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('='.repeat(60));

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : result.status === 'error' ? '❌' : '⏭️';
    console.log(`\n${icon} Test ${index + 1}: ${result.method} ${result.route}`);
    console.log(`   Status: ${result.status}`);
    if (result.statusCode) {
      console.log(`   Code: ${result.statusCode}`);
    }
    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.error) {
      console.log(`   Erreur: ${result.error}`);
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('='.repeat(60));

  // Note sur les tests nécessitant l'authentification
  if (errorCount > 0) {
    console.log('\n💡 Note: Les erreurs 401/403 sont normales sans authentification.');
    console.log('💡 Pour des tests complets, configurez un token d\'authentification admin.');
  }

  return { successCount, errorCount, total: results.length };
}

// Exécuter les tests
runTests()
  .then((stats) => {
    console.log('\n✨ Tests terminés !');
    process.exit(stats.errorCount > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
