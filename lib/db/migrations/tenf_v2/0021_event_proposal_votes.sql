-- TENF v2 - 0021
-- Votes sur les propositions d'evenements communautaires

create table if not exists public.event_proposal_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.event_proposals(id) on delete cascade,
  voter_discord_id text not null,
  voter_twitch_login text,
  created_at timestamptz not null default now()
);

create unique index if not exists event_proposal_votes_unique_vote_idx
  on public.event_proposal_votes (proposal_id, voter_discord_id);

create index if not exists idx_event_proposal_votes_proposal_id
  on public.event_proposal_votes (proposal_id);
