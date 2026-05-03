-- TENF v2 - 0050
-- Message libre du membre sur une demande de formation (modal côté espace membre)

alter table public.formation_requests
  add column if not exists member_message text;

comment on column public.formation_requests.member_message is 'Contexte ou idée décrite par le membre lors de la demande';
