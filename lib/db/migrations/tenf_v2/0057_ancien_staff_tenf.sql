-- TENF v2 - 0057
-- Rôle honorifique « Ancien Staff TENF » (enum uniquement — voir 0058 pour la bascule des membres)

ALTER TYPE "public"."member_role" ADD VALUE IF NOT EXISTS 'Ancien Staff TENF';
