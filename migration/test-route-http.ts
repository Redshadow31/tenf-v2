// Script pour tester la route /api/members/public via HTTP (simulation d'une requête réelle)

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

console.log('🧪 Test HTTP de la route /api/members/public\n');

async function testHttpRoute() {
  try {
    // Note: Ce script nécessite que le serveur Next.js soit en cours d'exécution
    // Pour tester, lancez d'abord: npm run dev
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/members/public`;

    console.log(`📡 Test de la route: ${url}\n`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📋 Headers:`);
    console.log(`   - Cache-Control: ${response.headers.get('Cache-Control') || 'N/A'}`);
    console.log(`   - Content-Type: ${response.headers.get('Content-Type') || 'N/A'}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`\n❌ Erreur HTTP: ${errorText}`);
      process.exit(1);
    }

    const data = await response.json();

    console.log(`\n✅ Réponse reçue:`);
    console.log(`   - Nombre de membres: ${data.members?.length || 0}`);
    console.log(`   - Total: ${data.total || 0}`);

    if (data.members && data.members.length > 0) {
      console.log(`\n📋 Aperçu des 5 premiers membres:`);
      data.members.slice(0, 5).forEach((member: any, index: number) => {
        console.log(`   ${index + 1}. ${member.displayName} (${member.twitchLogin})`);
        console.log(`      - Rôle: ${member.role}`);
        console.log(`      - VIP: ${member.isVip ? 'Oui' : 'Non'}`);
        console.log(`      - Badge VIP: ${member.vipBadge || 'N/A'}`);
        console.log(`      - Avatar: ${member.avatar ? '✅' : '❌'}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test HTTP réussi ! La route fonctionne correctement.');
    console.log('='.repeat(60));

  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Erreur de connexion:');
      console.error('   Le serveur Next.js n\'est pas en cours d\'exécution.');
      console.error('   Lancez d\'abord: npm run dev');
      console.error('   Puis relancez ce test.');
    } else {
      console.error('\n❌ Erreur lors du test HTTP:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    process.exit(1);
  }
}

testHttpRoute();
