// Script pour tester que tous les repositories fonctionnent correctement

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Charger les variables d'environnement AVANT d'importer les repositories
dotenv.config({ path: '.env.local' });

// Vérifier que les variables sont présentes
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  console.error('   Assurez-vous que .env.local contient :');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Créer le client Supabase admin pour les tests
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Importer les repositories après avoir chargé les variables
// Note: Les repositories utilisent supabaseAdmin depuis lib/db/supabase.ts
// mais pour les tests, on peut aussi les créer directement ici si nécessaire
import { memberRepository, eventRepository, spotlightRepository, evaluationRepository, vipRepository } from '../lib/repositories';

console.log('🧪 Test des repositories...\n');

async function testMemberRepository() {
  console.log('📋 Test MemberRepository...');
  
  try {
    // Test 1: Récupérer tous les membres
    const allMembers = await memberRepository.findAll();
    console.log(`   ✅ findAll(): ${allMembers.length} membres trouvés`);

    // Test 2: Récupérer les membres actifs
    const activeMembers = await memberRepository.findActive(10, 0);
    console.log(`   ✅ findActive(): ${activeMembers.length} membres actifs trouvés`);

    // Test 3: Compter les membres actifs
    const count = await memberRepository.countActive();
    console.log(`   ✅ countActive(): ${count} membres actifs`);

    // Test 4: Récupérer un membre par login
    if (activeMembers.length > 0) {
      const member = await memberRepository.findByTwitchLogin(activeMembers[0].twitchLogin);
      if (member) {
        console.log(`   ✅ findByTwitchLogin(): Membre "${member.displayName}" trouvé`);
      }
    }

    // Test 5: Récupérer les VIPs
    const vips = await memberRepository.findVip();
    console.log(`   ✅ findVip(): ${vips.length} VIPs trouvés`);

    console.log('   ✅ MemberRepository fonctionne correctement\n');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

async function testEventRepository() {
  console.log('📋 Test EventRepository...');
  
  try {
    // Test 1: Récupérer tous les événements
    const allEvents = await eventRepository.findAll();
    console.log(`   ✅ findAll(): ${allEvents.length} événements trouvés`);

    // Test 2: Récupérer les événements publiés
    const publishedEvents = await eventRepository.findPublished();
    console.log(`   ✅ findPublished(): ${publishedEvents.length} événements publiés`);

    // Test 3: Récupérer les événements à venir
    const upcomingEvents = await eventRepository.findUpcoming();
    console.log(`   ✅ findUpcoming(): ${upcomingEvents.length} événements à venir`);

    // Test 4: Récupérer un événement par ID
    if (allEvents.length > 0) {
      const event = await eventRepository.findById(allEvents[0].id);
      if (event) {
        console.log(`   ✅ findById(): Événement "${event.title}" trouvé`);
      }
    }

    console.log('   ✅ EventRepository fonctionne correctement\n');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

async function testSpotlightRepository() {
  console.log('📋 Test SpotlightRepository...');
  
  try {
    // Test 1: Récupérer tous les spotlights
    const allSpotlights = await spotlightRepository.findAll();
    console.log(`   ✅ findAll(): ${allSpotlights.length} spotlights trouvés`);

    // Test 2: Récupérer le spotlight actif
    const activeSpotlight = await spotlightRepository.findActive();
    if (activeSpotlight) {
      console.log(`   ✅ findActive(): Spotlight actif trouvé`);
    } else {
      console.log(`   ℹ️  findActive(): Aucun spotlight actif`);
    }

    // Test 3: Récupérer un spotlight par ID
    if (allSpotlights.length > 0) {
      const spotlight = await spotlightRepository.findById(allSpotlights[0].id);
      if (spotlight) {
        console.log(`   ✅ findById(): Spotlight trouvé`);
        
        // Test 4: Récupérer les présences
        const presences = await spotlightRepository.getPresences(spotlight.id);
        console.log(`   ✅ getPresences(): ${presences.length} présences trouvées`);
      }
    }

    console.log('   ✅ SpotlightRepository fonctionne correctement\n');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

async function testEvaluationRepository() {
  console.log('📋 Test EvaluationRepository...');
  
  try {
    // Test 1: Récupérer les évaluations du mois actuel
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const evaluations = await evaluationRepository.findByMonth(currentMonth);
    console.log(`   ✅ findByMonth(): ${evaluations.length} évaluations pour ${currentMonth}`);

    console.log('   ✅ EvaluationRepository fonctionne correctement\n');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

async function testVipRepository() {
  console.log('📋 Test VipRepository...');
  
  try {
    // Test 1: Récupérer les VIPs du mois actuel
    const currentVips = await vipRepository.findCurrentMonth();
    console.log(`   ✅ findCurrentMonth(): ${currentVips.length} VIPs du mois actuel`);

    console.log('   ✅ VipRepository fonctionne correctement\n');
    return true;
  } catch (error: any) {
    console.error(`   ❌ Erreur: ${error.message}\n`);
    return false;
  }
}

async function main() {
  const results = {
    members: await testMemberRepository(),
    events: await testEventRepository(),
    spotlights: await testSpotlightRepository(),
    evaluations: await testEvaluationRepository(),
    vips: await testVipRepository(),
  };

  console.log('='.repeat(60));
  console.log('📊 Résumé des tests :');
  console.log(`   - MemberRepository: ${results.members ? '✅' : '❌'}`);
  console.log(`   - EventRepository: ${results.events ? '✅' : '❌'}`);
  console.log(`   - SpotlightRepository: ${results.spotlights ? '✅' : '❌'}`);
  console.log(`   - EvaluationRepository: ${results.evaluations ? '✅' : '❌'}`);
  console.log(`   - VipRepository: ${results.vips ? '✅' : '❌'}`);
  console.log('='.repeat(60));

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n✅ Tous les repositories fonctionnent correctement !');
    console.log('\n🚀 Vous pouvez maintenant utiliser les repositories dans votre code :');
    console.log('   import { memberRepository } from "@/lib/repositories";');
    console.log('   const members = await memberRepository.findActive();');
  } else {
    console.log('\n⚠️  Certains repositories ont des erreurs');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch((error) => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
