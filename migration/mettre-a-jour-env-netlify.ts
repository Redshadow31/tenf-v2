// Script pour mettre à jour les variables Netlify dans .env.local avec les vraies valeurs

import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(process.cwd(), '.env.local');

// Valeurs réelles
const values = {
  'NETLIFY_SITE_ID': '5c064630-52ef-48f8-9cbf-a42135423c02',
  'NETLIFY_AUTH_TOKEN': 'nfp_ZgeNSM3M41ZZyzDrtkZn1QzCQSEpJkGX9c72',
};

console.log('📝 Mise à jour des variables Netlify dans .env.local...\n');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

let content = fs.readFileSync(envLocalPath, 'utf-8');
let updated = 0;

// Mettre à jour chaque variable
for (const [key, value] of Object.entries(values)) {
  // Chercher la ligne avec cette variable
  const regex = new RegExp(`^${key}=.*$`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
    console.log(`✅ ${key} mis à jour`);
    updated++;
  } else {
    // Si la variable n'existe pas, l'ajouter
    if (!content.endsWith('\n')) {
      content += '\n';
    }
    content += `${key}=${value}\n`;
    console.log(`✅ ${key} ajouté`);
    updated++;
  }
}

// Écrire le fichier mis à jour
fs.writeFileSync(envLocalPath, content, 'utf-8');

console.log(`\n✅ ${updated} variable(s) mise(s) à jour dans .env.local`);
console.log('\n🚀 Vous pouvez maintenant exécuter :');
console.log('   npx tsx migration/export-from-blobs.ts');
