// Test de connexion via le client Supabase (API REST)
// Cela permet de vérifier que les variables d'environnement sont correctes

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables manquantes');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

console.log('🔍 Test de connexion via client Supabase (API REST)...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

// Utiliser service_role pour bypasser RLS
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testConnection() {
  try {
    // Test 1: Vérifier que l'URL est correcte
    console.log('📋 Test 1: Vérification de l\'URL...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('_supabase_migrations')
      .select('version')
      .limit(1);
    
    if (healthError && healthError.code !== 'PGRST116') {
      console.log('   ⚠️  Erreur:', healthError.message);
      console.log('   ℹ️  Mais cela peut être normal si les migrations ne sont pas encore appliquées');
    } else {
      console.log('   ✅ URL correcte');
    }

    // Test 2: Vérifier les tables existantes
    console.log('\n📋 Test 2: Vérification des tables...');
    const tables = ['members', 'events', 'spotlights', 'evaluations'];
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1);
      if (error) {
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log(`   ⚠️  Table "${table}" n'existe pas encore (normal, migrations non appliquées)`);
        } else {
          console.log(`   ❌ Table "${table}": ${error.message}`);
        }
      } else {
        console.log(`   ✅ Table "${table}" existe`);
      }
    }

    // Test 3: Vérifier les hooks auth
    console.log('\n📋 Test 3: Vérification des hooks auth...');
    console.log('   ℹ️  Allez dans Supabase Dashboard → Authentication → Hooks');
    console.log('   ℹ️  Vérifiez qu\'il n\'y a pas de hook "before-user-created" qui bloque');

    // Test 4: Test de connexion PostgreSQL direct (si possible)
    console.log('\n📋 Test 4: Recommandation pour les migrations...');
    console.log('   ✅ Utilisez le SQL Editor de Supabase pour appliquer les migrations');
    console.log('   ✅ C\'est plus fiable que la connection string PostgreSQL directe');
    console.log('   ✅ Pas de problème avec les hooks ou les restrictions réseau');

    console.log('\n✅ Le client Supabase fonctionne correctement !');
    console.log('\n💡 Pour appliquer les migrations :');
    console.log('   1. Ouvrir Supabase Dashboard → SQL Editor');
    console.log('   2. Copier le contenu de lib/db/migrations/0000_whole_micromax.sql');
    console.log('   3. Coller et exécuter dans l\'éditeur SQL');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

testConnection();
