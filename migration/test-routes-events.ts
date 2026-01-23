import 'dotenv/config';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  status: 'success' | 'error';
  code?: number;
  message?: string;
  error?: any;
}

async function runTest(name: string, url: string, method: string = 'GET', body?: any, headers?: Record<string, string>): Promise<TestResult> {
  console.log(`🧪 Test ${method} ${url}...`);
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({})); // Try to parse JSON, fallback to empty object
    
    if (response.ok) {
      return { name, status: 'success', code: response.status, message: 'OK' };
    } else {
      return { name, status: 'error', code: response.status, message: data.error || 'Erreur inconnue', error: data };
    }
  } catch (error: any) {
    return { name, status: 'error', message: error.message, error };
  }
}

async function main() {
  console.log('🚀 Démarrage des tests des routes Événements migrées...');
  console.log(`\n📍 Base URL: ${BASE_URL}\n`);

  console.log('⚠️  Note: Les routes événements nécessitent une authentification.');
  console.log('⚠️  Pour des tests complets, configurez un token d\'authentification.\n');

  const results: TestResult[] = [];

  // --- Tests GET (sans authentification pour voir les 401/403) ---
  
  // Test 1: GET /api/admin/events/registrations (admin uniquement)
  results.push(await runTest('GET /api/admin/events/registrations', `${BASE_URL}/api/admin/events/registrations`));
  
  // Test 2: GET /api/admin/events/presence?eventId=test (admin uniquement)
  results.push(await runTest('GET /api/admin/events/presence?eventId=test', `${BASE_URL}/api/admin/events/presence?eventId=test`));
  
  // Test 3: GET /api/admin/events/presence?month=2024-01 (admin uniquement)
  results.push(await runTest('GET /api/admin/events/presence?month=2024-01', `${BASE_URL}/api/admin/events/presence?month=2024-01`));
  
  // Test 4: GET /api/events (public - devrait fonctionner)
  results.push(await runTest('GET /api/events', `${BASE_URL}/api/events`));

  // --- Affichage des résultats ---
  console.log('\n============================================================');
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('============================================================');

  let successCount = 0;
  let errorCount = 0;

  results.forEach((result, index) => {
    const statusIcon = result.status === 'success' ? '✅' : '❌';
    const statusColor = result.status === 'success' ? '\x1b[32m' : '\x1b[31m'; // Green or Red
    const resetColor = '\x1b[0m';

    console.log(`\n${statusIcon} Test ${index + 1}: ${result.name}`);
    console.log(`   Status: ${statusColor}${result.status}${resetColor}`);
    console.log(`   Code: ${result.code || 'N/A'}`);
    console.log(`   Message: ${result.message || 'N/A'}`);
    if (result.error) {
      console.log(`   Erreur: ${JSON.stringify(result.error, null, 2)}`);
    }

    if (result.status === 'success') {
      successCount++;
    } else {
      errorCount++;
    }
  });

  console.log('\n============================================================');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total: ${results.length}`);
  console.log('============================================================');

  console.log('\n💡 Note: Les erreurs 401/403 sont normales sans authentification.');
  console.log('💡 Pour des tests complets, configurez un token d\'authentification admin.\n');
  console.log('💡 Les routes POST/PUT/DELETE nécessitent une authentification complète.\n');

  console.log('✨ Tests terminés !\n');

  if (errorCount > 0 && successCount === 0) {
    // Si toutes les routes ont échoué, c'est probablement un problème de connexion
    console.log('⚠️  Tous les tests ont échoué. Vérifiez que le serveur est démarré.');
    process.exit(1);
  }
}

main();
