-- TENF v2 - 0052
-- Workflow admin enrichi pour les demandes de partenariat :
--  - nouveau statut "in_meeting" (À discuter en réunion)
--  - motif de décision interne (obligatoire pour accepté / refusé)
--  - date de bilan prévue si accepté
--  - table dédiée `partnership_request_reviews` (évaluation staff)
--
-- Sécurité :
--  - aucune des nouvelles données n'est lisible côté visiteur (RLS bloque
--    anon + authenticated ; service_role bypass via API admin protégée
--    par requireSectionAccess('/admin/partenariats')).
--  - Cette migration ne touche PAS la policy INSERT pour anon, donc les
--    visiteurs peuvent toujours envoyer une demande, mais ne peuvent
--    rien lire des nouvelles colonnes.

-------------------------------------------------------------------------------
-- 1) Élargir le check `status` pour autoriser "in_meeting"
-------------------------------------------------------------------------------
alter table public.partnership_requests
  drop constraint if exists partnership_requests_status_check;

alter table public.partnership_requests
  add constraint partnership_requests_status_check
  check (status in ('new', 'in_review', 'in_meeting', 'accepted', 'refused', 'archived'));

-------------------------------------------------------------------------------
-- 2) Colonnes additionnelles sur partnership_requests
-------------------------------------------------------------------------------
alter table public.partnership_requests
  add column if not exists decision_reason text,
  add column if not exists review_due_date date;

comment on column public.partnership_requests.decision_reason is
  'Motif interne posé par l''admin lors du passage à "accepted" ou "refused". Jamais exposé côté visiteur.';
comment on column public.partnership_requests.review_due_date is
  'Date de bilan prévue (uniquement renseignée si le partenariat est accepté).';

-------------------------------------------------------------------------------
-- 3) Table dédiée pour l'évaluation staff (1:1 avec partnership_requests)
-------------------------------------------------------------------------------
create table if not exists public.partnership_request_reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.partnership_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text,

  -- Notes 1..5
  values_alignment smallint check (values_alignment between 1 and 5),
  members_interest smallint check (members_interest between 1 and 5),
  partner_seriousness smallint check (partner_seriousness between 1 and 5),

  -- Niveaux de risque
  recruitment_risk text check (
    recruitment_risk is null
    or recruitment_risk in ('low', 'medium', 'high')
  ),
  confusion_risk text check (
    confusion_risk is null
    or confusion_risk in ('low', 'medium', 'high')
  ),

  -- Période d'observation requise ?
  observation_needed boolean,

  -- Commentaire interne libre
  comment text
);

create index if not exists idx_partnership_request_reviews_request_id
  on public.partnership_request_reviews (request_id);

-------------------------------------------------------------------------------
-- 4) Trigger : maintenir `updated_at` à chaque update du review
-------------------------------------------------------------------------------
create or replace function public.partnership_request_reviews_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_partnership_request_reviews_updated_at
  on public.partnership_request_reviews;
create trigger trg_partnership_request_reviews_updated_at
  before update on public.partnership_request_reviews
  for each row execute function public.partnership_request_reviews_set_updated_at();

-------------------------------------------------------------------------------
-- 5) RLS + revoke : table totalement invisible aux visiteurs
-------------------------------------------------------------------------------
alter table public.partnership_request_reviews enable row level security;

-- Aucune policy pour anon / authenticated → aucun accès.
-- Seul service_role peut lire / écrire (via les routes admin Next.js).

revoke all on public.partnership_request_reviews from anon, authenticated;

-- service_role bypasse RLS par défaut et conserve ses droits owner.
