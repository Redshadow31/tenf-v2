/**
 * Script de test pour vérifier toutes les routes utilisées par /admin/evaluation/d
 * Usage: tsx migration/test-routes-evaluation-d.ts
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_MONTH = '2025-12'; // Décembre 2025

interface RouteTest {
  name: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT';
  body?: any;
  expectedFields?: string[];
}

const routes: RouteTest[] = [
  {
    name: '/api/admin/members',
    url: `${BASE_URL}/api/admin/members`,
    method: 'GET',
    expectedFields: ['members'],
  },
  {
    name: '/api/evaluations/spotlights/points',
    url: `${BASE_URL}/api/evaluations/spotlights/points?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['points', 'month'],
  },
  {
    name: '/api/spotlight/presence/monthly',
    url: `${BASE_URL}/api/spotlight/presence/monthly?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['totalSpotlights', 'members', 'month'],
  },
  {
    name: '/api/evaluations/raids/points',
    url: `${BASE_URL}/api/evaluations/raids/points?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['points', 'month'],
  },
  {
    name: '/api/evaluations/discord/points',
    url: `${BASE_URL}/api/evaluations/discord/points?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['points', 'month'],
  },
  {
    name: '/api/admin/events/presence',
    url: `${BASE_URL}/api/admin/events/presence?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['events', 'month'],
  },
  {
    name: '/api/evaluations/follow/points',
    url: `${BASE_URL}/api/evaluations/follow/points`,
    method: 'GET',
    expectedFields: ['points', 'month'],
  },
  {
    name: '/api/evaluations/bonus',
    url: `${BASE_URL}/api/evaluations/bonus?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['bonuses', 'month'],
  },
];

async function testRoute(route: RouteTest): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const options: RequestInit = {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (route.body) {
      options.body = JSON.stringify(route.body);
    }

    const response = await fetch(route.url, options);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
      };
    }

    // Vérifier les champs attendus
    if (route.expectedFields) {
      const missingFields = route.expectedFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        return {
          success: false,
          error: `Champs manquants: ${missingFields.join(', ')}`,
          data,
        };
      }
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🧪 Test des routes utilisées par /admin/evaluation/d\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Mois testé: ${TEST_MONTH}\n`);

  const results: Array<{ route: string; success: boolean; error?: string; dataSize?: number }> = [];

  for (const route of routes) {
    console.log(`📡 Test: ${route.name}...`);
    const result = await testRoute(route);

    if (result.success) {
      // Calculer la taille des données
      let dataSize = 0;
      if (result.data) {
        if (Array.isArray(result.data)) {
          dataSize = result.data.length;
        } else if (typeof result.data === 'object') {
          // Compter les clés principales
          if (result.data.points && typeof result.data.points === 'object') {
            dataSize = Object.keys(result.data.points).length;
          } else if (result.data.members && Array.isArray(result.data.members)) {
            dataSize = result.data.members.length;
          } else if (result.data.events && Array.isArray(result.data.events)) {
            dataSize = result.data.events.length;
          } else if (result.data.bonuses && typeof result.data.bonuses === 'object') {
            dataSize = Object.keys(result.data.bonuses).length;
          }
        }
      }

      console.log(`   ✅ Succès (${dataSize > 0 ? `${dataSize} éléments` : 'données présentes'})`);
      results.push({ route: route.name, success: true, dataSize });
    } else {
      console.log(`   ❌ Erreur: ${result.error}`);
      results.push({ route: route.name, success: false, error: result.error });
    }
    console.log('');
  }

  // Résumé
  console.log('📊 Résumé des tests:\n');
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  results.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.route} - OK${result.dataSize ? ` (${result.dataSize} éléments)` : ''}`);
    } else {
      console.log(`❌ ${result.route} - ${result.error}`);
    }
  });

  console.log(`\n📈 Résultat: ${successCount}/${routes.length} routes fonctionnent`);
  
  if (failCount > 0) {
    console.log(`⚠️  ${failCount} route(s) en erreur`);
    process.exit(1);
  } else {
    console.log('🎉 Toutes les routes fonctionnent correctement !');
  }
}

runTests().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
