-- TENF v2 - 0028
-- Backoffice content source for /upa-event landing page

create table if not exists public.upa_event_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  general jsonb not null default '{}'::jsonb,
  social_proof jsonb not null default '{}'::jsonb,
  timeline jsonb not null default '[]'::jsonb,
  editorial_sections jsonb not null default '[]'::jsonb,
  staff jsonb not null default '[]'::jsonb,
  faq jsonb not null default '[]'::jsonb,
  official_links jsonb not null default '[]'::jsonb,
  partner_communities jsonb not null default '[]'::jsonb,
  cta jsonb not null default '{}'::jsonb,
  display_settings jsonb not null default '{}'::jsonb,
  status_messages jsonb not null default '{}'::jsonb,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_upa_event_pages_slug
  on public.upa_event_pages (slug);

create index if not exists idx_upa_event_pages_updated_at
  on public.upa_event_pages (updated_at desc);

insert into public.upa_event_pages (slug)
values ('upa-event')
on conflict (slug) do nothing;
