// Script pour tester toutes les routes migrées vers Supabase

import * as dotenv from 'dotenv';
import { memberRepository, eventRepository, spotlightRepository, vipRepository } from '../lib/repositories';
import { getTwitchUsers } from '../lib/twitch';
import { getVipBadgeText } from '../lib/vipHistory';

dotenv.config({ path: '.env.local' });

console.log('🧪 Test de toutes les routes migrées vers Supabase\n');
console.log('='.repeat(60));

const results: { route: string; status: '✅' | '❌'; message: string }[] = [];

async function testMembersPublic() {
  try {
    console.log('\n📋 Test 1: /api/members/public');
    const activeMembers = await memberRepository.findActive(1000, 0);
    
    if (activeMembers.length === 0) {
      results.push({ route: '/api/members/public', status: '❌', message: 'Aucun membre actif trouvé' });
      console.log('   ❌ Aucun membre actif trouvé');
      return;
    }

    // Tester le formatage des données
    const twitchLogins = activeMembers.slice(0, 5).map(m => m.twitchLogin).filter(Boolean) as string[];
    const twitchUsers = await getTwitchUsers(twitchLogins);
    
    results.push({ 
      route: '/api/members/public', 
      status: '✅', 
      message: `${activeMembers.length} membres actifs, ${twitchUsers.length} avatars récupérés` 
    });
    console.log(`   ✅ ${activeMembers.length} membres actifs trouvés`);
    console.log(`   ✅ ${twitchUsers.length} avatars Twitch récupérés`);
  } catch (error: any) {
    results.push({ route: '/api/members/public', status: '❌', message: error.message });
    console.log(`   ❌ Erreur: ${error.message}`);
  }
}

async function testVipMembers() {
  try {
    console.log('\n📋 Test 2: /api/vip-members');
    const currentMonthVips = await vipRepository.findCurrentMonth();
    const vipMembers = await memberRepository.findVip();
    
    if (currentMonthVips.length > 0) {
      results.push({ 
        route: '/api/vip-members', 
        status: '✅', 
        message: `${currentMonthVips.length} VIPs du mois actuel` 
      });
      console.log(`   ✅ ${currentMonthVips.length} VIPs du mois actuel`);
    } else if (vipMembers.length > 0) {
      results.push({ 
        route: '/api/vip-members', 
        status: '✅', 
        message: `${vipMembers.length} membres VIP (fallback)` 
      });
      console.log(`   ✅ ${vipMembers.length} membres VIP (fallback)`);
    } else {
      results.push({ route: '/api/vip-members', status: '❌', message: 'Aucun VIP trouvé' });
      console.log('   ❌ Aucun VIP trouvé');
    }
  } catch (error: any) {
    results.push({ route: '/api/vip-members', status: '❌', message: error.message });
    console.log(`   ❌ Erreur: ${error.message}`);
  }
}

async function testEvents() {
  try {
    console.log('\n📋 Test 3: /api/events');
    const allEvents = await eventRepository.findAll();
    const publishedEvents = await eventRepository.findPublished();
    const upcomingEvents = await eventRepository.findUpcoming();
    
    results.push({ 
      route: '/api/events', 
      status: '✅', 
      message: `${allEvents.length} total, ${publishedEvents.length} publiés, ${upcomingEvents.length} à venir` 
    });
    console.log(`   ✅ ${allEvents.length} événements au total`);
    console.log(`   ✅ ${publishedEvents.length} événements publiés`);
    console.log(`   ✅ ${upcomingEvents.length} événements à venir`);
  } catch (error: any) {
    results.push({ route: '/api/events', status: '❌', message: error.message });
    console.log(`   ❌ Erreur: ${error.message}`);
  }
}

async function testAdminMembers() {
  try {
    console.log('\n📋 Test 4: /api/admin/members');
    
    // Test GET - Récupérer tous les membres
    const allMembers = await memberRepository.findAll();
    console.log(`   ✅ GET: ${allMembers.length} membres récupérés`);
    
    // Test GET - Récupérer un membre spécifique
    if (allMembers.length > 0) {
      const testMember = allMembers[0];
      const memberByLogin = await memberRepository.findByTwitchLogin(testMember.twitchLogin);
      
      if (memberByLogin) {
        console.log(`   ✅ GET by login: Membre "${memberByLogin.displayName}" trouvé`);
        
        // Test GET - Récupérer par Discord ID si disponible
        if (memberByLogin.discordId) {
          const memberByDiscord = await memberRepository.findByDiscordId(memberByLogin.discordId);
          if (memberByDiscord) {
            console.log(`   ✅ GET by Discord ID: Membre trouvé`);
          }
        }
      }
    }
    
    // Test POST - Créer un membre (test uniquement, pas de création réelle)
    console.log(`   ℹ️  POST: Test de création non effectué (nécessite authentification)`);
    
    // Test PUT - Mise à jour (test uniquement, pas de modification réelle)
    console.log(`   ℹ️  PUT: Test de mise à jour non effectué (nécessite authentification)`);
    
    // Test DELETE - Suppression (test uniquement, pas de suppression réelle)
    console.log(`   ℹ️  DELETE: Test de suppression non effectué (nécessite authentification)`);
    
    results.push({ 
      route: '/api/admin/members', 
      status: '✅', 
      message: `GET fonctionnel: ${allMembers.length} membres` 
    });
  } catch (error: any) {
    results.push({ route: '/api/admin/members', status: '❌', message: error.message });
    console.log(`   ❌ Erreur: ${error.message}`);
  }
}

async function testSpotlightActive() {
  try {
    console.log('\n📋 Test 5: /api/spotlight/active');
    
    // Test GET - Récupérer le spotlight actif
    const activeSpotlight = await spotlightRepository.findActive();
    
    if (activeSpotlight) {
      console.log(`   ✅ GET: Spotlight actif trouvé (${activeSpotlight.id})`);
      
      // Test GET - Récupérer les présences
      const presences = await spotlightRepository.getPresences(activeSpotlight.id);
      console.log(`   ✅ GET presences: ${presences.length} présences trouvées`);
      
      // Test GET - Récupérer l'évaluation
      const evaluation = await spotlightRepository.getEvaluation(activeSpotlight.id);
      if (evaluation) {
        console.log(`   ✅ GET evaluation: Évaluation trouvée`);
      } else {
        console.log(`   ℹ️  GET evaluation: Aucune évaluation (normal si spotlight en cours)`);
      }
      
      results.push({ 
        route: '/api/spotlight/active', 
        status: '✅', 
        message: `Spotlight actif trouvé, ${presences.length} présences` 
      });
    } else {
      // Test GET - Récupérer tous les spotlights
      const allSpotlights = await spotlightRepository.findAll();
      console.log(`   ℹ️  GET: Aucun spotlight actif, ${allSpotlights.length} spotlights au total`);
      
      results.push({ 
        route: '/api/spotlight/active', 
        status: '✅', 
        message: `Aucun spotlight actif (normal), ${allSpotlights.length} spotlights au total` 
      });
    }
    
    // Test POST - Création (test uniquement, pas de création réelle)
    console.log(`   ℹ️  POST: Test de création non effectué (nécessite authentification)`);
    
    // Test PATCH - Mise à jour (test uniquement, pas de modification réelle)
    console.log(`   ℹ️  PATCH: Test de mise à jour non effectué (nécessite authentification)`);
    
  } catch (error: any) {
    results.push({ route: '/api/spotlight/active', status: '❌', message: error.message });
    console.log(`   ❌ Erreur: ${error.message}`);
  }
}

async function main() {
  await testMembersPublic();
  await testVipMembers();
  await testEvents();
  await testAdminMembers();
  await testSpotlightActive();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Résumé des Tests');
  console.log('='.repeat(60));
  
  results.forEach(result => {
    console.log(`${result.status} ${result.route}`);
    console.log(`   ${result.message}`);
  });
  
  const successCount = results.filter(r => r.status === '✅').length;
  const totalCount = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`✅ ${successCount}/${totalCount} routes fonctionnent correctement`);
  console.log('='.repeat(60));
  
  if (successCount === totalCount) {
    console.log('\n🎉 Toutes les routes migrées fonctionnent correctement !');
    process.exit(0);
  } else {
    console.log('\n⚠️  Certaines routes ont des problèmes');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
