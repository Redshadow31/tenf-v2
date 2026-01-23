// Script pour mettre à jour SUPABASE_SERVICE_ROLE_KEY dans .env.local

import fs from 'fs';
import path from 'path';

const envLocalPath = path.join(process.cwd(), '.env.local');

const newServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdnY3B3YWV4aG91Z29tZm5uc29iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTEyMDY5OCwiZXhwIjoyMDg0Njk2Njk4fQ.qHFrSExnyPbEj4ZUrCL3DvB7_cWzTvBdaLsYuh1nNY8';

console.log('📝 Mise à jour de SUPABASE_SERVICE_ROLE_KEY dans .env.local...\n');

if (!fs.existsSync(envLocalPath)) {
  console.error('❌ Fichier .env.local non trouvé');
  process.exit(1);
}

let content = fs.readFileSync(envLocalPath, 'utf-8');

// Remplacer la ligne SUPABASE_SERVICE_ROLE_KEY
const regex = /^SUPABASE_SERVICE_ROLE_KEY=.*$/m;
if (regex.test(content)) {
  content = content.replace(regex, `SUPABASE_SERVICE_ROLE_KEY=${newServiceRoleKey}`);
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY mis à jour');
} else {
  // Si la variable n'existe pas, l'ajouter
  if (!content.endsWith('\n')) {
    content += '\n';
  }
  content += `SUPABASE_SERVICE_ROLE_KEY=${newServiceRoleKey}\n`;
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY ajouté');
}

// Écrire le fichier mis à jour
fs.writeFileSync(envLocalPath, content, 'utf-8');

console.log('\n✅ Clé mise à jour !');
console.log('🚀 Vous pouvez maintenant tester :');
console.log('   npx tsx migration/test-service-role-key.ts');
console.log('   puis');
console.log('   npx tsx migration/import-to-supabase.ts');
