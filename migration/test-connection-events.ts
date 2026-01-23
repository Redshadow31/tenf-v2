import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { eventRepository } from '../lib/repositories';

async function main() {
  console.log('🔍 Test de connexion pour les routes événements...\n');

  try {
    // Test 1: Vérifier la connexion à Supabase
    console.log('1️⃣ Test de connexion à Supabase...');
    const allEvents = await eventRepository.findAll();
    console.log(`✅ Connexion OK - ${allEvents.length} événement(s) trouvé(s)\n`);

    // Test 2: Vérifier findPublished
    console.log('2️⃣ Test findPublished()...');
    const publishedEvents = await eventRepository.findPublished();
    console.log(`✅ findPublished OK - ${publishedEvents.length} événement(s) publié(s)\n`);

    // Test 3: Vérifier getRegistrations (si un événement existe)
    if (allEvents.length > 0) {
      const firstEvent = allEvents[0];
      console.log(`3️⃣ Test getRegistrations() pour l'événement "${firstEvent.id}"...`);
      const registrations = await eventRepository.getRegistrations(firstEvent.id);
      console.log(`✅ getRegistrations OK - ${registrations.length} inscription(s)\n`);

      // Test 4: Vérifier getPresences (nécessite la table event_presences)
      console.log(`4️⃣ Test getPresences() pour l'événement "${firstEvent.id}"...`);
      try {
        const presences = await eventRepository.getPresences(firstEvent.id);
        console.log(`✅ getPresences OK - ${presences.length} présence(s)\n`);
        console.log('✅ La table event_presences existe et fonctionne !\n');
      } catch (error: any) {
        console.log(`❌ Erreur getPresences: ${error.message}\n`);
        console.log('⚠️  La table event_presences n\'existe probablement pas encore.');
        console.log('⚠️  Appliquez la migration SQL 0004_low_silver_surfer.sql dans Supabase.\n');
      }
    } else {
      console.log('⚠️  Aucun événement trouvé. Créez un événement pour tester les autres méthodes.\n');
    }

    console.log('✨ Tests terminés !\n');
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

main();
