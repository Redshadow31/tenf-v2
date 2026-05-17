-- TENF v2 - 0051
-- Demandes de partenariat soumises depuis la page publique /partenariats
-- (modale 3 étapes : règlement → formulaire → confirmation).
--
-- Sécurité :
--  - les visiteurs (anon) peuvent uniquement INSERT (créer une demande)
--  - aucune lecture publique des demandes ni des notes internes
--  - les opérations admin (read / update / notes) passent par la clé
--    service_role côté API Next.js (bypass RLS), elle-même protégée
--    par `requireSectionAccess('/admin/partenariats')`.

create table if not exists public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status text not null default 'new' check (
    status in ('new', 'in_review', 'accepted', 'refused', 'archived')
  ),

  -- Bloc "Informations générales"
  project_name text not null,
  partnership_type text not null check (
    partnership_type in (
      'inter_serveurs',
      'evenementiel',
      'caritatif',
      'visibilite',
      'autre'
    )
  ),
  project_description text not null,
  discord_link text,
  twitch_link text,
  website_link text,
  social_links text,

  -- Bloc "Responsables"
  contact_name text not null,
  contact_role text,
  contact_email text not null,
  contact_discord text,
  other_contact text,

  -- Bloc "Détails de la demande"
  partnership_goal text not null,
  partner_offers text not null,
  partner_expectations text not null,
  desired_duration text check (
    desired_duration is null
    or desired_duration in ('ponctuel', '30_jours', '3_mois', 'long_terme', 'a_definir')
  ),
  desired_date text,
  target_audience text,
  estimated_members text,

  -- Bloc "Cadre et sécurité" (5 cases Oui/Non obligatoires)
  independence_accepted boolean not null,
  no_recruitment_accepted boolean not null,
  confidentiality_accepted boolean not null,
  observation_accepted boolean not null,
  interruption_accepted boolean not null,

  -- Message complémentaire
  additional_message text,

  -- Consentement final (cases obligatoires)
  representative_confirmed boolean not null,
  data_usage_accepted boolean not null,

  -- Métadonnées techniques
  submitted_ip text,
  submitted_user_agent text
);

create index if not exists idx_partnership_requests_status
  on public.partnership_requests (status);

create index if not exists idx_partnership_requests_created_at
  on public.partnership_requests (created_at desc);

create index if not exists idx_partnership_requests_type
  on public.partnership_requests (partnership_type);

-- Table des notes internes admin associées à une demande.
-- Ces notes ne doivent JAMAIS être renvoyées côté visiteur.
create table if not exists public.partnership_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.partnership_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  author text not null,
  note text not null
);

create index if not exists idx_partnership_request_notes_request_id
  on public.partnership_request_notes (request_id, created_at desc);

-- Trigger : maintient `updated_at` à jour à chaque modification d'une demande.
create or replace function public.partnership_requests_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_partnership_requests_updated_at on public.partnership_requests;
create trigger trg_partnership_requests_updated_at
  before update on public.partnership_requests
  for each row execute function public.partnership_requests_set_updated_at();

-- Row Level Security
alter table public.partnership_requests enable row level security;
alter table public.partnership_request_notes enable row level security;

-- Politique : un visiteur (rôle anon) peut UNIQUEMENT insérer une demande
-- depuis la page publique /partenariats. Le status, les notes et tout
-- le reste sont posés serveur-side ; le visiteur ne peut pas forger ces
-- valeurs via la clé anon car aucune politique SELECT/UPDATE/DELETE
-- n'autorise anon ici.
drop policy if exists "partnership_requests_anon_insert" on public.partnership_requests;
create policy "partnership_requests_anon_insert"
  on public.partnership_requests
  for insert
  to anon
  with check (true);

-- Idem pour `authenticated` : un utilisateur connecté côté Supabase
-- (non-admin) ne doit avoir aucun accès aux demandes. On ne crée donc
-- aucune policy pour ce rôle ; toutes les routes admin passent par
-- service_role côté serveur Next.js, déjà gardé par
-- `requireSectionAccess('/admin/partenariats')`.

-- Défense en profondeur : on retire tous les droits directs sur les
-- deux tables aux rôles non privilégiés, en plus du RLS. La RLS suffit
-- normalement, mais le revoke explicite ferme aussi les futurs cas
-- (ex. si quelqu'un désactivait RLS par erreur).
revoke all on public.partnership_requests from anon;
revoke all on public.partnership_request_notes from anon, authenticated;

-- On redonne uniquement ce qui est strictement nécessaire à anon :
-- la capacité d'invoquer un INSERT (couvert par la policy RLS ci-dessus).
grant insert on public.partnership_requests to anon;

-- service_role conserve TOUS les droits par défaut (super-utilisateur
-- Supabase) — c'est lui qui sert les routes admin via supabaseAdmin.
