// Script de debug pour analyser l'erreur de connexion en détail

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL n\'est pas défini');
  process.exit(1);
}

console.log('🔍 Analyse détaillée de l\'erreur de connexion...\n');

// Analyser la connection string
const url = new URL(databaseUrl);
console.log('📋 Détails de la connection string :');
console.log('- Protocole:', url.protocol);
console.log('- Host:', url.hostname);
console.log('- Port:', url.port);
console.log('- Database:', url.pathname.replace('/', ''));
console.log('- Username:', url.username);
console.log('- Password:', url.password ? '***' + url.password.slice(-4) : 'NON DÉFINI');
console.log('');

// Tester différentes variantes de connection string
const variants = [
  {
    name: 'Format actuel (pooler)',
    url: databaseUrl,
  },
  {
    name: 'Format direct (port 5432)',
    url: databaseUrl.replace(':6543', ':5432').replace('pooler.supabase.com', 'supabase.co').replace('postgres.', 'postgres@db.'),
  },
  {
    name: 'Format pooler avec pgbouncer',
    url: databaseUrl + '?pgbouncer=true',
  },
];

async function testVariants() {
  for (const variant of variants) {
    console.log(`\n🧪 Test: ${variant.name}`);
    console.log(`   URL: ${variant.url.replace(/:[^:@]+@/, ':****@')}`);
    
    try {
      const sql = postgres(variant.url, {
        max: 1,
        connection: {
          application_name: 'tenf-debug',
        },
        connect_timeout: 5,
      });

      const result = await sql`SELECT version(), current_database(), current_user`;
      console.log(`   ✅ SUCCÈS !`);
      console.log(`   - Database: ${result[0].current_database}`);
      console.log(`   - User: ${result[0].current_user}`);
      await sql.end();
      
      console.log(`\n🎉 Cette connection string fonctionne :`);
      console.log(variant.url);
      process.exit(0);
    } catch (error: any) {
      console.log(`   ❌ ÉCHEC`);
      console.log(`   - Code: ${error.code || 'N/A'}`);
      console.log(`   - Message: ${error.message}`);
      if (error.severity) {
        console.log(`   - Severity: ${error.severity}`);
      }
      if (error.severity_local) {
        console.log(`   - Severity Local: ${error.severity_local}`);
      }
    }
  }
}

testVariants().then(() => {
  console.log('\n❌ Aucune variante de connection string n\'a fonctionné.');
  console.log('\n💡 Solutions possibles :');
  console.log('   1. Vérifier le mot de passe dans Supabase Dashboard');
  console.log('   2. Réinitialiser le mot de passe de la base de données');
  console.log('   3. Vérifier les Network Restrictions dans Supabase');
  console.log('   4. Utiliser le SQL Editor de Supabase pour appliquer les migrations manuellement');
});

console.log('\n❌ Aucune variante de connection string n\'a fonctionné.');
console.log('\n💡 Solutions possibles :');
console.log('   1. Vérifier le mot de passe dans Supabase Dashboard');
console.log('   2. Réinitialiser le mot de passe de la base de données');
console.log('   3. Vérifier les Network Restrictions dans Supabase');
console.log('   4. Utiliser le SQL Editor de Supabase pour appliquer les migrations manuellement');
