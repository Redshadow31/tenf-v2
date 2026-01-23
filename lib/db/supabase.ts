// Clients Supabase pour usage côté client et serveur

import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_URL'
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'Missing Supabase environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }
  return key;
}

function getSupabaseServiceKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      'Missing Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  return key;
}

// Client pour usage côté client (browser)
// Utilise la clé anon qui a des restrictions RLS
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey());
  }
  return supabaseClient;
}

// Client pour usage côté serveur (admin)
// Utilise la clé service_role qui bypasse RLS
// ⚠️ NE JAMAIS utiliser côté client !
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      getSupabaseUrl(),
      getSupabaseServiceKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdminClient;
}

// Exports pour compatibilité avec le code existant
// Ces exports sont évalués de manière lazy
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabase()[prop as keyof SupabaseClient];
  },
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
