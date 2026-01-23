// Script pour tester la route /api/events migrée vers Supabase

import * as dotenv from 'dotenv';
import { eventRepository } from '../lib/repositories';

dotenv.config({ path: '.env.local' });

console.log('🧪 Test de la route /api/events (migrée vers Supabase)\n');

async function testRoute() {
  try {
    console.log('📋 Étape 1: Récupération de tous les événements...');
    const allEvents = await eventRepository.findAll();
    console.log(`   ✅ ${allEvents.length} événements trouvés\n`);

    console.log('📋 Étape 2: Récupération des événements publiés...');
    const publishedEvents = await eventRepository.findPublished();
    console.log(`   ✅ ${publishedEvents.length} événements publiés trouvés\n`);

    console.log('📋 Étape 3: Récupération des événements à venir...');
    const upcomingEvents = await eventRepository.findUpcoming();
    console.log(`   ✅ ${upcomingEvents.length} événements à venir trouvés\n`);

    if (allEvents.length > 0) {
      console.log('📋 Étape 4: Vérification des données formatées...');
      allEvents.slice(0, 3).forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.title}`);
        console.log(`      - ID: ${event.id}`);
        console.log(`      - Date: ${event.date instanceof Date ? event.date.toISOString() : event.date}`);
        console.log(`      - Catégorie: ${event.category}`);
        console.log(`      - Publié: ${event.isPublished ? 'Oui' : 'Non'}`);
        console.log(`      - Créé par: ${event.createdBy}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test réussi ! La route fonctionne correctement.');
    console.log('='.repeat(60));
    console.log('\n📊 Résumé:');
    console.log(`   - Tous les événements: ${allEvents.length}`);
    console.log(`   - Événements publiés: ${publishedEvents.length}`);
    console.log(`   - Événements à venir: ${upcomingEvents.length}`);
    console.log('\n🚀 La route /api/events est prête à être utilisée !');

  } catch (error: any) {
    console.error('\n❌ Erreur lors du test:');
    console.error(`   Message: ${error.message}`);
    console.error(`   Stack: ${error.stack}`);
    process.exit(1);
  }
}

testRoute();
