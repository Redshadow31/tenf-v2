## Checklist post-migration TENF v2

### 1) Execution SQL
- Executer `0001_extensions.sql` -> `0013_rls_v1.sql` dans l'ordre.
- Verifier qu'aucune erreur SQL n'apparait dans Supabase SQL Editor.

### 2) Verifications structure
- Confirmer la presence des tables du domaine membres/integration/events/spotlight/staff.
- Verifier les index critiques (`idx_spotlights_starts_at`, `idx_staff_applications_status`, `idx_monthly_evaluations_month`).
- Verifier que RLS est active sur les tables cibles.

### 3) Controles backfill
- `member_profiles` contient une ligne par membre.
- `member_roles` contient les roles historiques principaux.
- `community_events` et `event_registrations` ont ete repris depuis l'ancien schema (si colonnes compatibles).
- `spotlight_attendance` et `spotlight_metrics` ont des donnees si les anciennes tables existaient.

### 4) Verification applicative
- Ouvrir pages admin: integration, events recap, spotlight analytics, staff.
- Verifier les API routes qui lisent/écrivent en base (pas d'erreur 500).
- Tester creation d'un event, inscription, validation presence, et lecture recap.

### 5) Securite
- Tester lecture publique des membres actifs et events publies avec la cle `anon`.
- Verifier que l'ecriture est impossible en `anon`.
- Verifier que les operations serveur (service role) fonctionnent encore.

### 6) Go-live
- Faire un export backup avant switch production.
- Faire un smoke test complet apres deploiement.
- Surveiller `structured_logs`, `admin_actions` et `sync_logs` les 24h suivantes.
