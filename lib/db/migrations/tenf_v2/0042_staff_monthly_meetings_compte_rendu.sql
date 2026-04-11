-- Compte-rendu optionnel (ex. généré hors plateforme puis collé ici)

alter table public.staff_monthly_meetings
  add column if not exists compte_rendu text not null default '';
