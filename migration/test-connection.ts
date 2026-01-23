// Script de test pour vérifier la connexion Supabase
// Utilise uniquement le client Supabase (pas besoin de DATABASE_URL pour ce test)

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes !');
  console.error('Assurez-vous d\'avoir NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local');
  process.exit(1);
}

console.log('🔍 Test de connexion Supabase...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Tester une requête simple
    const { data, error } = await supabase
      .from('members')
      .select('count')
      .limit(1);

    if (error) {
      // Si la table n'existe pas encore, c'est normal (on va la créer)
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('✅ Connexion Supabase réussie !');
        console.log('ℹ️  La table "members" n\'existe pas encore (normal, on va la créer)');
        return true;
      }
      throw error;
    }

    console.log('✅ Connexion Supabase réussie !');
    console.log('✅ La table "members" existe déjà');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log('\n✅ Tout est prêt pour continuer la migration !');
    console.log('📝 Prochaine étape : Créer le schéma de base de données');
  } else {
    console.log('\n❌ Vérifiez vos variables d\'environnement');
    process.exit(1);
  }
});
