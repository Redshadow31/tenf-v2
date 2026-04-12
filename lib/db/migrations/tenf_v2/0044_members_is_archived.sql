-- TENF v2 - 0044
-- Membres encore présents sur le serveur mais "inactifs" côté site : distinguer l'archivage (hors suivi raids EventSub).

alter table public.members
  add column if not exists is_archived boolean not null default false;

comment on column public.members.is_archived is 'Membre retiré du suivi communautaire (hors EventSub raids, etc.). Distinct de is_active (communauté inactive).';

create index if not exists idx_members_is_archived_false
  on public.members (is_archived)
  where is_archived = false;
