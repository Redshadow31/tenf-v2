// Client Drizzle ORM pour Supabase PostgreSQL
// Utilisé pour les migrations et les requêtes serveur avec type-safety

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not set. Please add it to your .env.local file.\n' +
    'Format: postgresql://postgres.[PROJECT]:[PASSWORD]@[HOST]:6543/postgres'
  );
}

// Client PostgreSQL pour les migrations et requêtes serveur
const queryClient = postgres(process.env.DATABASE_URL, {
  max: 1, // Limiter à 1 connexion pour éviter les problèmes de pool
});

// Client Drizzle avec le schéma
export const db = drizzle(queryClient, { schema });

// Exporter le schéma pour utilisation dans les repositories
export { schema };
