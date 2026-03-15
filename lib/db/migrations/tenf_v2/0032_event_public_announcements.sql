-- TENF v2 - 0032
-- Annonces publiques génériques par catégorie d'événement

create table if not exists public.event_category_public_announcements (
  id uuid primary key default gen_random_uuid(),
  category text not null unique,
  title text not null,
  description text not null default '',
  image text,
  cta_label text,
  cta_url text,
  is_active boolean not null default true,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_event_category_public_announcements_active
  on public.event_category_public_announcements (is_active);

insert into public.event_category_public_announcements (
  category,
  title,
  description,
  is_active
)
values (
  'Soirée Film',
  'Soirée Film communautaire',
  'Connecte-toi avec un profil actif TENF pour découvrir la programmation complète des soirées film.',
  true
)
on conflict (category) do nothing;
