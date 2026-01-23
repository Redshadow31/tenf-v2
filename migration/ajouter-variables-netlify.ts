// Script pour ajouter les variables Netlify dans .env.local

import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const envLocalPath = path.join(process.cwd(), '.env.local');

const variablesToAdd = {
  'NETLIFY_SITE_ID': 'votre_netlify_site_id',
  'NETLIFY_AUTH_TOKEN': 'votre_netlify_auth_token',
};

console.log('📝 Ajout des variables Netlify dans .env.local...\n');

// Lire le fichier existant
let existingContent = '';
if (fs.existsSync(envLocalPath)) {
  existingContent = fs.readFileSync(envLocalPath, 'utf-8');
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

if (Object.keys(variablesToAdd).some(key => !existingVars.has(key))) {
  newLines.push('# Variables Netlify (pour migration des données)');
  newLines.push('# NETLIFY_SITE_ID : Trouver dans Netlify Dashboard → Site settings → General');
  newLines.push('# NETLIFY_AUTH_TOKEN : Créer dans Netlify Dashboard → User settings → Applications → Personal access tokens');
  newLines.push('');
}

for (const [key, placeholder] of Object.entries(variablesToAdd)) {
  if (existingVars.has(key)) {
    console.log(`⏭️  ${key} existe déjà`);
    skipped++;
  } else {
    newLines.push(`${key}=${placeholder}`);
    console.log(`✅ ${key} ajouté (à remplir)`);
    added++;
  }
}

// Écrire le fichier
if (added > 0) {
  fs.writeFileSync(envLocalPath, newLines.join('\n'), 'utf-8');
  console.log(`\n✅ ${added} variable(s) ajoutée(s) dans .env.local`);
  console.log('\n📝 Instructions pour remplir les valeurs :');
  console.log('\n1. NETLIFY_SITE_ID :');
  console.log('   - Aller sur Netlify Dashboard');
  console.log('   - Sélectionner votre site');
  console.log('   - Site settings → General');
  console.log('   - Copier le "Site ID"');
  console.log('\n2. NETLIFY_AUTH_TOKEN :');
  console.log('   - Aller sur Netlify Dashboard');
  console.log('   - User settings (icône profil en haut à droite)');
  console.log('   - Applications → Personal access tokens');
  console.log('   - "New access token"');
  console.log('   - Donner un nom (ex: "TENF Migration")');
  console.log('   - Copier le token généré');
  console.log('\n⚠️  Important : Le token ne sera affiché qu\'une seule fois !');
} else {
  console.log('\n✅ Toutes les variables sont déjà présentes !');
}
