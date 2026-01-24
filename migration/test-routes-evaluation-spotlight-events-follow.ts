/**
 * Script de test pour vérifier les routes Spotlight, Events et Follow
 * utilisées par /admin/evaluation/d
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
  method: 'GET';
  expectedFields?: string[];
  description: string;
}

const routes: RouteTest[] = [
  {
    name: 'Spotlight Points (/5)',
    url: `${BASE_URL}/api/evaluations/spotlights/points?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['points', 'month', 'success'],
    description: 'Calcule les points Spotlight basés sur les présences aux spotlights',
  },
  {
    name: 'Events Presence (/2)',
    url: `${BASE_URL}/api/admin/events/presence?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['events', 'month'],
    description: 'Récupère les événements et leurs présences pour le mois',
  },
  {
    name: 'Follow Points (/5)',
    url: `${BASE_URL}/api/evaluations/follow/points?month=${TEST_MONTH}`,
    method: 'GET',
    expectedFields: ['points', 'month', 'success'],
    description: 'Calcule les points Follow basés sur les validations de follow',
  },
];

async function testRoute(route: RouteTest): Promise<{ success: boolean; error?: string; data?: any; stats?: any }> {
  try {
    const response = await fetch(route.url, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${data.error || 'Unknown error'}`,
        data,
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

    // Calculer des statistiques selon le type de route
    let stats: any = {};
    
    if (route.name.includes('Spotlight')) {
      const points = data.points || {};
      const pointsArray = Object.values(points) as number[];
      stats = {
        totalMembers: Object.keys(points).length,
        membersWithPoints: pointsArray.filter(p => p > 0).length,
        maxPoints: pointsArray.length > 0 ? Math.max(...pointsArray) : 0,
        minPoints: pointsArray.length > 0 ? Math.min(...pointsArray) : 0,
        avgPoints: pointsArray.length > 0 ? (pointsArray.reduce((a, b) => a + b, 0) / pointsArray.length).toFixed(2) : 0,
      };
    } else if (route.name.includes('Events')) {
      const events = data.events || [];
      const totalPresences = events.reduce((sum: number, event: any) => {
        return sum + (event.presences?.filter((p: any) => p.present).length || 0);
      }, 0);
      const uniqueMembers = new Set<string>();
      events.forEach((event: any) => {
        event.presences?.forEach((p: any) => {
          if (p.present && p.twitchLogin) {
            uniqueMembers.add(p.twitchLogin.toLowerCase());
          }
        });
      });
      stats = {
        totalEvents: events.length,
        totalPresences,
        uniqueMembers: uniqueMembers.size,
        avgPresencesPerEvent: events.length > 0 ? (totalPresences / events.length).toFixed(2) : 0,
      };
    } else if (route.name.includes('Follow')) {
      const points = data.points || {};
      const pointsArray = Object.values(points) as number[];
      stats = {
        totalMembers: Object.keys(points).length,
        membersWithPoints: pointsArray.filter(p => p > 0).length,
        maxPoints: pointsArray.length > 0 ? Math.max(...pointsArray) : 0,
        minPoints: pointsArray.length > 0 ? Math.min(...pointsArray) : 0,
        avgPoints: pointsArray.length > 0 ? (pointsArray.reduce((a, b) => a + b, 0) / pointsArray.length).toFixed(2) : 0,
      };
    }

    return { success: true, data, stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🧪 Test des routes Spotlight, Events et Follow\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Mois testé: ${TEST_MONTH}\n`);

  const results: Array<{ route: string; success: boolean; error?: string; stats?: any }> = [];

  for (const route of routes) {
    console.log(`📡 Test: ${route.name}`);
    console.log(`   Description: ${route.description}`);
    console.log(`   URL: ${route.url}`);
    
    const result = await testRoute(route);

    if (result.success) {
      console.log(`   ✅ Succès`);
      if (result.stats) {
        console.log(`   📊 Statistiques:`);
        Object.entries(result.stats).forEach(([key, value]) => {
          console.log(`      - ${key}: ${value}`);
        });
      }
      results.push({ route: route.name, success: true, stats: result.stats });
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
      console.log(`✅ ${result.route} - OK`);
      if (result.stats) {
        const statsStr = Object.entries(result.stats)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        console.log(`   Stats: ${statsStr}`);
      }
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
