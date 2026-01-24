/**
 * Script de test pour vérifier la route /api/members/public
 * utilisée par la page Discord
 */

import dotenv from 'dotenv';
import { resolve } from 'path';

// Charger les variables d'environnement
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function testRoute() {
  try {
    console.log('🧪 Test de la route /api/members/public\n');
    console.log(`Base URL: ${BASE_URL}\n`);

    const response = await fetch(`${BASE_URL}/api/members/public`, {
      cache: 'no-store',
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erreur:', error);
      return;
    }

    const data = await response.json();
    
    console.log(`✅ Réponse reçue:`);
    console.log(`   - Total membres: ${data.total || data.members?.length || 0}`);
    console.log(`   - Membres dans la réponse: ${data.members?.length || 0}`);

    // Filtrer comme le fait la page Discord
    const filteredMembers = (data.members || [])
      .filter((m: any) => m.isActive !== false && m.discordId);

    console.log(`   - Membres avec Discord ID: ${filteredMembers.length}`);

    if (filteredMembers.length === 0) {
      console.log('\n⚠️  Aucun membre avec Discord ID trouvé !');
      console.log('\nPremiers membres (sans filtre):');
      (data.members || []).slice(0, 5).forEach((m: any, i: number) => {
        console.log(`   ${i + 1}. ${m.displayName || m.twitchLogin} - isActive: ${m.isActive}, discordId: ${m.discordId || 'N/A'}`);
      });
    } else {
      console.log('\n✅ Membres avec Discord ID trouvés:');
      filteredMembers.slice(0, 5).forEach((m: any, i: number) => {
        console.log(`   ${i + 1}. ${m.displayName || m.twitchLogin} (${m.discordId})`);
      });
    }

    // Vérifier la structure des données
    if (data.members && data.members.length > 0) {
      const firstMember = data.members[0];
      console.log('\n📋 Structure du premier membre:');
      console.log(JSON.stringify(firstMember, null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  }
}

testRoute();
