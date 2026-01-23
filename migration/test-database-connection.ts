// Test de connexion directe à la base de données PostgreSQL

import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL n\'est pas défini');
  process.exit(1);
}

console.log('🔍 Test de connexion à la base de données...\n');
console.log('Connection string:', databaseUrl.replace(/:[^:@]+@/, ':****@')); // Masquer le mot de passe

async function testConnection() {
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL n\'est pas défini');
    process.exit(1);
  }
  
  try {
    const sql = postgres(databaseUrl, {
      max: 1,
      connection: {
        application_name: 'tenf-migration-test',
      },
    });

    const result = await sql`SELECT version(), current_database(), current_user`;
    
    console.log('✅ Connexion réussie !\n');
    console.log('Informations de connexion :');
    console.log('- Base de données:', result[0].current_database);
    console.log('- Utilisateur:', result[0].current_user);
    console.log('- Version PostgreSQL:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);
    
    await sql.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('\n💡 Vérifiez :');
    console.error('   1. Que DATABASE_URL est correct dans .env.local');
    console.error('   2. Que le mot de passe de la base de données est correct');
    console.error('   3. Que votre IP n\'est pas bloquée par les Network Restrictions de Supabase');
    console.error('   4. Que la connection string utilise le bon format (pooler ou direct)');
    process.exit(1);
  }
}

testConnection();
