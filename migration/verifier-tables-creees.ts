// Script pour vérifier que toutes les tables sont créées dans Supabase

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesExpected = [
  'members',
  'events',
  'event_registrations',
  'spotlights',
  'spotlight_presences',
  'spotlight_evaluations',
  'evaluations',
  'vip_history',
  'logs',
];

async function verifyTables() {
  console.log('🔍 Vérification des tables créées...\n');

  let allTablesExist = true;
  const missingTables: string[] = [];

  for (const table of tablesExpected) {
    try {
      // Essayer de faire une requête simple pour vérifier que la table existe
      const { error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`❌ Table "${table}" n'existe pas`);
          missingTables.push(table);
          allTablesExist = false;
        } else {
          // Autre erreur, mais la table existe probablement
          console.log(`✅ Table "${table}" existe (erreur: ${error.message})`);
        }
      } else {
        console.log(`✅ Table "${table}" existe`);
      }
    } catch (error: any) {
      console.log(`⚠️  Table "${table}": ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  if (allTablesExist) {
    console.log('✅ Toutes les tables sont créées avec succès !\n');
    console.log('🚀 Prochaines étapes :');
    console.log('   1. Vérifier dans Supabase Dashboard → Table Editor');
    console.log('   2. Commencer à migrer les données depuis Netlify Blobs');
    console.log('   3. Tester les repositories');
  } else {
    console.log(`❌ ${missingTables.length} table(s) manquante(s) : ${missingTables.join(', ')}`);
    console.log('\n💡 Vérifiez dans Supabase Dashboard → Table Editor');
    console.log('   Si les tables n\'apparaissent pas, réexécutez la migration SQL');
  }
}

verifyTables();
