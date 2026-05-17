-- TENF v2 - 0054
-- Questionnaire posture staff / Community Management
-- Accès : service_role via API Next.js (RLS sans policies publiques)

-- Statuts de soumission
create type public.staff_questionnaire_submission_status as enum (
  'DRAFT',
  'IN_PROGRESS',
  'SUBMITTED',
  'ADMIN_REVIEW',
  'INTERNAL_ANALYSIS_DONE',
  'MEMBER_SUMMARY_READY',
  'MEMBER_SUMMARY_PUBLISHED',
  'OBJECTIVES_DEFINED',
  'FINAL_REVIEW_DONE'
);

create type public.staff_questionnaire_question_type as enum (
  'TEXT_LONG',
  'TEXT_SHORT',
  'SINGLE_CHOICE',
  'MULTIPLE_CHOICE',
  'SCALE_1_5',
  'THREE_FIELDS'
);

create type public.staff_questionnaire_objective_status as enum (
  'TODO',
  'IN_PROGRESS',
  'DONE',
  'PAUSED'
);

create type public.staff_questionnaire_final_decision as enum (
  'VALIDATED',
  'EXTENDED_TRAINING',
  'BINOME',
  'OBSERVATION',
  'SUPPORT_TENF',
  'PAUSE_RECOMMENDED',
  'REFERENT_POTENTIAL'
);

-- 1. Templates
create table if not exists public.staff_questionnaire_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  version integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Questions
create table if not exists public.staff_questionnaire_questions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.staff_questionnaire_templates(id) on delete cascade,
  section_key text not null,
  section_title text not null,
  "order" integer not null default 0,
  question_number integer not null,
  question_key text not null,
  label text not null,
  help_text text,
  type public.staff_questionnaire_question_type not null,
  options jsonb,
  is_required boolean not null default true,
  analysis_hints jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, question_key)
);

create index if not exists idx_staff_questionnaire_questions_template
  on public.staff_questionnaire_questions (template_id, "order");

-- 3. Submissions
create table if not exists public.staff_questionnaire_submissions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.staff_questionnaire_templates(id) on delete restrict,
  member_id uuid not null references public.members(id) on delete cascade,
  status public.staff_questionnaire_submission_status not null default 'DRAFT',
  consents jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by_id uuid references public.members(id) on delete set null,
  member_summary_published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, member_id)
);

create index if not exists idx_staff_questionnaire_submissions_status
  on public.staff_questionnaire_submissions (status);

create index if not exists idx_staff_questionnaire_submissions_member
  on public.staff_questionnaire_submissions (member_id);

-- 4. Answers
create table if not exists public.staff_questionnaire_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.staff_questionnaire_submissions(id) on delete cascade,
  question_id uuid not null references public.staff_questionnaire_questions(id) on delete cascade,
  answer_text text,
  answer_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (submission_id, question_id)
);

create index if not exists idx_staff_questionnaire_answers_submission
  on public.staff_questionnaire_answers (submission_id);

-- 5. Admin reviews
create table if not exists public.staff_questionnaire_admin_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.staff_questionnaire_submissions(id) on delete cascade,
  reviewer_id uuid references public.members(id) on delete set null,
  internal_analysis_text text,
  member_summary_text text,
  behavioral_profile text,
  functioning_mode text,
  support_needs text,
  vigilance_points text,
  communication_style text,
  autonomy_level text,
  conflict_relation text,
  authority_relation text,
  emotional_management text,
  recommended_missions text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Objectives (3 months)
create table if not exists public.staff_questionnaire_objectives (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.staff_questionnaire_submissions(id) on delete cascade,
  created_by_id uuid references public.members(id) on delete set null,
  title text not null,
  description text,
  month_index integer check (month_index is null or (month_index >= 1 and month_index <= 3)),
  status public.staff_questionnaire_objective_status not null default 'TODO',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_staff_questionnaire_objectives_submission
  on public.staff_questionnaire_objectives (submission_id);

-- 7. Final reviews
create table if not exists public.staff_questionnaire_final_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null unique references public.staff_questionnaire_submissions(id) on delete cascade,
  reviewer_id uuid references public.members(id) on delete set null,
  final_review_text text not null,
  decision public.staff_questionnaire_final_decision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers
create or replace function public.staff_questionnaire_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_staff_questionnaire_templates_updated_at on public.staff_questionnaire_templates;
create trigger trg_staff_questionnaire_templates_updated_at
  before update on public.staff_questionnaire_templates
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_questions_updated_at on public.staff_questionnaire_questions;
create trigger trg_staff_questionnaire_questions_updated_at
  before update on public.staff_questionnaire_questions
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_submissions_updated_at on public.staff_questionnaire_submissions;
create trigger trg_staff_questionnaire_submissions_updated_at
  before update on public.staff_questionnaire_submissions
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_answers_updated_at on public.staff_questionnaire_answers;
create trigger trg_staff_questionnaire_answers_updated_at
  before update on public.staff_questionnaire_answers
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_admin_reviews_updated_at on public.staff_questionnaire_admin_reviews;
create trigger trg_staff_questionnaire_admin_reviews_updated_at
  before update on public.staff_questionnaire_admin_reviews
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_objectives_updated_at on public.staff_questionnaire_objectives;
create trigger trg_staff_questionnaire_objectives_updated_at
  before update on public.staff_questionnaire_objectives
  for each row execute function public.staff_questionnaire_set_updated_at();

drop trigger if exists trg_staff_questionnaire_final_reviews_updated_at on public.staff_questionnaire_final_reviews;
create trigger trg_staff_questionnaire_final_reviews_updated_at
  before update on public.staff_questionnaire_final_reviews
  for each row execute function public.staff_questionnaire_set_updated_at();

-- RLS : pas d'accès direct anon/authenticated
alter table public.staff_questionnaire_templates enable row level security;
alter table public.staff_questionnaire_questions enable row level security;
alter table public.staff_questionnaire_submissions enable row level security;
alter table public.staff_questionnaire_answers enable row level security;
alter table public.staff_questionnaire_admin_reviews enable row level security;
alter table public.staff_questionnaire_objectives enable row level security;
alter table public.staff_questionnaire_final_reviews enable row level security;

revoke all on public.staff_questionnaire_templates from anon, authenticated;
revoke all on public.staff_questionnaire_questions from anon, authenticated;
revoke all on public.staff_questionnaire_submissions from anon, authenticated;
revoke all on public.staff_questionnaire_answers from anon, authenticated;
revoke all on public.staff_questionnaire_admin_reviews from anon, authenticated;
revoke all on public.staff_questionnaire_objectives from anon, authenticated;
revoke all on public.staff_questionnaire_final_reviews from anon, authenticated;
