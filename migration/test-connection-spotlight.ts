/**
 * Script de test de connexion pour les routes Spotlight
 * Vérifie la connexion à Supabase et les repositories
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testConnection() {
  console.log('🔍 Test de connexion Supabase pour Spotlight...\n');

  try {
    // Test 1: Import des repositories
    console.log('1️⃣ Test import des repositories...');
    const { spotlightRepository, evaluationRepository, memberRepository } = await import('../lib/repositories');
    console.log('✅ Repositories importés avec succès\n');

    // Test 2: Test connexion Supabase - SpotlightRepository
    console.log('2️⃣ Test SpotlightRepository.findActive()...');
    try {
      const activeSpotlight = await spotlightRepository.findActive();
      console.log(`✅ SpotlightRepository.findActive() : ${activeSpotlight ? 'Spotlight actif trouvé' : 'Aucun spotlight actif'}\n`);
    } catch (error) {
      console.error('❌ Erreur SpotlightRepository.findActive():', error);
      if (error instanceof Error) {
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
      }
    }

    // Test 3: Test connexion Supabase - EvaluationRepository
    console.log('3️⃣ Test EvaluationRepository.findByMonth()...');
    try {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const evaluations = await evaluationRepository.findByMonth(monthKey);
      console.log(`✅ EvaluationRepository.findByMonth(${monthKey}) : ${evaluations.length} évaluations trouvées\n`);
    } catch (error) {
      console.error('❌ Erreur EvaluationRepository.findByMonth():', error);
      if (error instanceof Error) {
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
      }
    }

    // Test 4: Test connexion Supabase - MemberRepository
    console.log('4️⃣ Test MemberRepository.findAll()...');
    try {
      const members = await memberRepository.findAll();
      console.log(`✅ MemberRepository.findAll() : ${members.length} membres trouvés\n`);
    } catch (error) {
      console.error('❌ Erreur MemberRepository.findAll():', error);
      if (error instanceof Error) {
        console.error('   Message:', error.message);
        console.error('   Stack:', error.stack);
      }
    }

    // Test 5: Vérification des variables d'environnement
    console.log('5️⃣ Vérification des variables d\'environnement...');
    const requiredVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
    ];

    const missingVars: string[] = [];
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error(`❌ Variables d'environnement manquantes: ${missingVars.join(', ')}\n`);
    } else {
      console.log('✅ Toutes les variables d\'environnement sont configurées\n');
    }

    console.log('✨ Tests de connexion terminés !');
  } catch (error) {
    console.error('\n❌ Erreur générale:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testConnection();
