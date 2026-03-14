-- TENF v2 - 0026
-- Liaison Twitch facultative par utilisateur connecte (Discord -> Twitch OAuth)

create table if not exists public.linked_twitch_accounts (
  id uuid primary key default gen_random_uuid(),
  discord_id text not null unique,
  twitch_user_id text not null unique,
  twitch_login text not null,
  twitch_display_name text,
  twitch_avatar text,
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expiry timestamptz not null,
  scope text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_linked_twitch_accounts_discord_id
  on public.linked_twitch_accounts (discord_id);

create index if not exists idx_linked_twitch_accounts_twitch_user_id
  on public.linked_twitch_accounts (twitch_user_id);

create index if not exists idx_linked_twitch_accounts_token_expiry
  on public.linked_twitch_accounts (token_expiry);
