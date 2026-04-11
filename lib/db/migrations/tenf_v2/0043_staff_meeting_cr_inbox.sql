-- Comptes-rendus de réunion staff envoyés à des destinataires (boîte modération)

create table if not exists public.staff_meeting_cr_inbox (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.staff_monthly_meetings (id) on delete cascade,
  recipient_discord_id text not null,
  body_markdown text not null,
  sent_at timestamptz not null default now(),
  sent_by text,
  read_at timestamptz
);

create index if not exists idx_staff_meeting_cr_inbox_recipient_sent
  on public.staff_meeting_cr_inbox (recipient_discord_id, sent_at desc);

create index if not exists idx_staff_meeting_cr_inbox_meeting
  on public.staff_meeting_cr_inbox (meeting_id);
