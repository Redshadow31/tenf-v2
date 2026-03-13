// Script pour ajouter automatiquement les variables Supabase dans .env.local

import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(process.cwd(), '.env.local');

// Variables à ajouter
const variablesToAdd = {
  'NEXT_PUBLIC_SUPABASE_URL': 'https://ggcpwaexhougomfnnsob.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'sb_publishable_EXAMPLE_PLACEHOLDER',
  'SUPABASE_SERVICE_ROLE_KEY': 'sb_secret_EXAMPLE_PLACEHOLDER',
  'DATABASE_URL': 'postgresql://postgres.[PROJECT_REF]:[DB_PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres',
};

console.log('📝 Ajout des variables Supabase dans .env.local...\n');

// Lire le fichier existant
let existingContent = '';
if (fs.existsSync(envLocalPath)) {
  existingContent = fs.readFileSync(envLocalPath, 'utf-8');
  console.log('✅ Fichier .env.local trouvé');
} else {
  console.log('📄 Création du fichier .env.local');
}

// Vérifier quelles variables existent déjà
const lines = existingContent.split('\n');
const existingVars = new Set<string>();
const newLines: string[] = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const match = trimmed.match(/^([A-Z_]+)=/);
    if (match) {
      existingVars.add(match[1]);
    }
  }
  newLines.push(line);
}

// Ajouter les variables manquantes
let added = 0;
let skipped = 0;

if (!existingContent.endsWith('\n') && existingContent.length > 0) {
  newLines.push('');
}

// Ajouter un commentaire si on ajoute des variables
if (Object.keys(variablesToAdd).some(key => !existingVars.has(key))) {
  newLines.push('# Variables Supabase pour TENF V3');
  newLines.push('# Ajoutées automatiquement par migration/ajouter-variables.ts');
  newLines.push('');
}

for (const [key, value] of Object.entries(variablesToAdd)) {
  if (existingVars.has(key)) {
    console.log(`⏭️  ${key} existe déjà, ignoré`);
    skipped++;
  } else {
    newLines.push(`${key}=${value}`);
    console.log(`✅ ${key} ajouté`);
    added++;
  }
}

// Écrire le fichier
if (added > 0) {
  fs.writeFileSync(envLocalPath, newLines.join('\n'), 'utf-8');
  console.log(`\n✅ ${added} variable(s) ajoutée(s) dans .env.local`);
  if (skipped > 0) {
    console.log(`⏭️  ${skipped} variable(s) déjà présente(s)`);
  }
  console.log('\n🚀 Vous pouvez maintenant exécuter :');
  console.log('   npx tsx migration/verifier-env.ts');
} else {
  console.log('\n✅ Toutes les variables sont déjà présentes !');
}
