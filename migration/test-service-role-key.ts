// Script pour tester si la clé service_role est correcte

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Test de la clé service_role...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables manquantes');
  process.exit(1);
}

console.log('URL:', supabaseUrl);
console.log('Key:', supabaseServiceKey.substring(0, 20) + '...');
console.log('Key length:', supabaseServiceKey.length);
console.log('Key format:', supabaseServiceKey.startsWith('eyJ') ? 'JWT' : supabaseServiceKey.startsWith('sb_secret_') ? 'Secret' : 'Inconnu');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testKey() {
  try {
    // Test 1: Essayer de lire depuis une table
    const { data, error } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('Invalid API key')) {
        console.error('❌ Clé API invalide !');
        console.error('\n💡 Vérifiez :');
        console.error('   1. Que vous avez copié la clé "service_role" (pas "anon")');
        console.error('   2. Que la clé est complète (pas tronquée)');
        console.error('   3. Que la clé dans .env.local correspond à celle dans Supabase Dashboard');
        return false;
      }
      // Autre erreur (peut être normal si la table est vide)
      console.log('✅ Clé valide (erreur normale:', error.message, ')');
      return true;
    }

    console.log('✅ Clé valide ! La connexion fonctionne.');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

testKey().then((success) => {
  if (!success) {
    console.log('\n📝 Pour corriger :');
    console.log('   1. Aller dans Supabase Dashboard → Settings → API');
    console.log('   2. Copier la clé "service_role" (pas "anon")');
    console.log('   3. Mettre à jour SUPABASE_SERVICE_ROLE_KEY dans .env.local');
    process.exit(1);
  }
});
