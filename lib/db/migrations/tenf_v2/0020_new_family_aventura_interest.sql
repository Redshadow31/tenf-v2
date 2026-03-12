-- New Family Aventura - collecte d'interet communautaire
-- TODO: appliquer dans Supabase et connecter les autres sous-modules (galeries/settings) a des tables dediees.

create table if not exists public.new_family_aventura_interest (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  pseudo text not null,
  contact text,
  profile_type text not null check (profile_type in ('createur', 'membre', 'autre')),
  quick_response text not null check (quick_response in ('interested', 'more_info', 'maybe', 'not_for_me')),
  interest_reason text,
  conditions_json jsonb not null default '[]'::jsonb,
  comment text,
  source text not null default 'formulaire',
  is_reviewed boolean not null default false,
  admin_note text
);

create index if not exists idx_nfa_interest_created_at on public.new_family_aventura_interest (created_at desc);
create index if not exists idx_nfa_interest_quick_response on public.new_family_aventura_interest (quick_response);
create index if not exists idx_nfa_interest_profile_type on public.new_family_aventura_interest (profile_type);
create index if not exists idx_nfa_interest_is_reviewed on public.new_family_aventura_interest (is_reviewed);

