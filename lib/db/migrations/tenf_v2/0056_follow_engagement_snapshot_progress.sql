-- TENF v2 - 0056
-- Progression temps reel du snapshot follow engagement.
-- progress_total : nombre de membres/chaines actives a calculer (appels Twitch).
-- progress_done  : nombre deja calcule. Permet d'afficher une barre de progression
--                  pendant que la Netlify Background Function tourne.

alter table public.follow_engagement_snapshots
  add column if not exists progress_done integer not null default 0;

alter table public.follow_engagement_snapshots
  add column if not exists progress_total integer not null default 0;
