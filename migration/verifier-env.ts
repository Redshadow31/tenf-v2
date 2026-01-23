// Script pour vérifier que toutes les variables d'environnement sont configurées

import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config({ path: '.env.local' });

console.log('🔍 Vérification des variables d\'environnement...\n');

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
  'DATABASE_URL': process.env.DATABASE_URL,
};

let allPresent = true;
const missing: string[] = [];

console.log('Variables requises :\n');

for (const [key, value] of Object.entries(requiredVars)) {
  if (value) {
    const displayValue = key.includes('KEY') || key === 'DATABASE_URL' 
      ? value.substring(0, 20) + '...' 
      : value;
    console.log(`✅ ${key} = ${displayValue}`);
  } else {
    console.log(`❌ ${key} = MANQUANT`);
    missing.push(key);
    allPresent = false;
  }
}

console.log('\n' + '='.repeat(60) + '\n');

if (allPresent) {
  console.log('✅ Toutes les variables sont configurées !');
  console.log('\n🚀 Vous pouvez maintenant :');
  console.log('   1. Générer les migrations : npm run db:generate');
  console.log('   2. Appliquer les migrations : npm run db:migrate');
  console.log('   3. Tester la connexion : npx tsx migration/test-connection.ts');
} else {
  console.log('❌ Variables manquantes :', missing.join(', '));
  console.log('\n📝 Pour ajouter les variables manquantes :');
  console.log('   1. Ouvrir le fichier .env.local à la racine du projet');
  console.log('   2. Ajouter les variables suivantes :\n');
  
  missing.forEach(key => {
    let example = '';
    switch(key) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        example = 'https://ggcpwaexhougomfnnsob.supabase.co';
        break;
      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        example = 'sb_publishable_TC-xB59hf4FEewC8kdFaCQ_3NqsJxc7';
        break;
      case 'SUPABASE_SERVICE_ROLE_KEY':
        example = 'sb_secret_pt1XELVAoYCbc-WM7Jfdjg_W1adRP20';
        break;
      case 'DATABASE_URL':
        example = 'postgresql://postgres.ggcpwaexhougomfnnsob:DpDAkhQCrsJrsWXl@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';
        break;
    }
    console.log(`   ${key}=${example}`);
  });
  
  console.log('\n💡 Voir migration/prochaines-etapes.md pour plus de détails');
}

process.exit(allPresent ? 0 : 1);
