-- TENF v2 - 0058
-- Bascule des anciens soutiens listés vers le rôle « Ancien Staff TENF »
-- (nécessite 0057 exécuté et commité au préalable)

-- Twitch logins concernés (variantes incluses pour sigurdson)
WITH former_staff AS (
  SELECT id, twitch_login, display_name
  FROM public.members
  WHERE lower(twitch_login) IN (
    'face_bcd',
    'jenny31200',
    'lespydyverse',
    'leviacarpe',
    'livio_on',
    'majormixo',
    'sigurdson',
    'sigurdsonfamily64',
    'mmesigurdson64'
  )
)
UPDATE public.staff_org_chart_entries e
SET
  role_key = 'ANCIEN_STAFF_TENF',
  role_label = 'Ancien Staff TENF',
  status_key = 'REMERCIE',
  status_label = 'Remercié',
  pole_key = NULL,
  pole_label = NULL,
  secondary_poles = '[]'::jsonb,
  bio_short = COALESCE(
    NULLIF(trim(e.bio_short), ''),
    fs.display_name || ' a contribué à TENF en tant qu''ancien membre du staff. Son investissement fait partie de l''histoire de la communauté.'
  ),
  updated_at = now()
FROM former_staff fs
WHERE e.member_id = fs.id
  AND e.role_key = 'SOUTIEN_TENF';

UPDATE public.members m
SET
  role = 'Ancien Staff TENF',
  updated_at = now()
WHERE lower(m.twitch_login) IN (
  'face_bcd',
  'jenny31200',
  'lespydyverse',
  'leviacarpe',
  'livio_on',
  'majormixo',
  'sigurdson',
  'sigurdsonfamily64',
  'mmesigurdson64'
)
AND m.role = 'Soutien TENF';
