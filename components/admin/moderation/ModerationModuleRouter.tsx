import { notFound } from "next/navigation";
import ModerationWipPage from "@/components/admin/moderation/ModerationWipPage";
import {
  MODERATION_BASE,
  buildModerationGroupHref,
  buildModerationHref,
  findModule,
  getGroupsForView,
  type ModerationView,
} from "@/lib/moderation/moderationTree";

import StaffAnnouncementsAdminPage from "@/components/admin/StaffAnnouncementsAdminPage";
import CharteValidationsPage from "@/app/admin/moderation/[group]/[module]/CharteValidationsPage";
import MonthlyExercisesAssignationsPage from "@/app/admin/moderation/[group]/[module]/MonthlyExercisesAssignationsPage";
import CharteModerationPage from "@/app/admin/moderation/staff/[group]/[module]/CharteModerationPage";
import StaffMeetingCrInboxPage from "@/app/admin/moderation/staff/[group]/[module]/StaffMeetingCrInboxPage";
import StaffMonthlyExercisesPage from "@/app/admin/moderation/staff/[group]/[module]/StaffMonthlyExercisesPage";
import StaffQuestionnaireModeratorClient from "@/components/admin/moderation/questionnaire/StaffQuestionnaireModeratorClient";
import StaffQuestionnairesAdminClient from "@/components/admin/moderation/questionnaire/StaffQuestionnairesAdminClient";

type Props = {
  view: ModerationView;
  groupSlug: string;
  moduleSlug: string;
};

/**
 * Dispatcher central pour les modules de modération.
 * - Si le module est `active`, renvoie le composant métier correspondant.
 * - Sinon, renvoie un `ModerationWipPage` standardisé.
 *
 * AVANTAGES
 * - Un seul endroit pour mapper slug → composant.
 * - Plus de "Module prêt pour l'intégration métier".
 * - Tous les modules récupèrent automatiquement un fallback propre.
 */
export default function ModerationModuleRouter({ view, groupSlug, moduleSlug }: Props) {
  const found = findModule(groupSlug, moduleSlug);
  if (!found) notFound();

  const { group, module } = found;

  // Vérifie que la persona accepte la vue demandée
  const visibleGroups = getGroupsForView(view);
  const visibleGroup = visibleGroups.find((g) => g.slug === group.slug);
  const visibleModule = visibleGroup?.modules.find((m) => m.slug === module.slug);
  if (!visibleModule) {
    notFound();
  }

  // ---- Modules actifs ----
  if (group.slug === "info" && module.slug === "annonces-staff") {
    return <StaffAnnouncementsAdminPage />;
  }
  if (group.slug === "info" && module.slug === "charte") {
    return <CharteModerationPage />;
  }
  if (group.slug === "info" && module.slug === "validation-charte") {
    // Validation = même page que la charte (action en bas de la charte)
    return <CharteModerationPage />;
  }
  if (group.slug === "info" && module.slug === "comptes-rendus-reunions") {
    return <StaffMeetingCrInboxPage />;
  }
  if (group.slug === "petits-travaux" && module.slug === "questionnaire-posture") {
    return <StaffQuestionnaireModeratorClient />;
  }
  if (group.slug === "petits-travaux" && module.slug === "questionnaires-posture") {
    return <StaffQuestionnairesAdminClient />;
  }
  if (group.slug === "petits-travaux" && module.slug === "exercices-mensuels") {
    return <StaffMonthlyExercisesPage />;
  }
  if (group.slug === "info" && module.slug === "charte-validations") {
    return <CharteValidationsPage />;
  }
  if (group.slug === "petits-travaux" && module.slug === "assignations") {
    return <MonthlyExercisesAssignationsPage />;
  }

  // ---- Modules WIP / placeholder ----
  const backHref = view === "admin" ? MODERATION_BASE : `${MODERATION_BASE}/staff`;
  const groupHref = buildModerationGroupHref(view, group.slug);
  const altView: ModerationView = view === "admin" ? "staff" : "admin";
  const altVisible = getGroupsForView(altView)
    .find((g) => g.slug === group.slug)
    ?.modules.find((m) => m.slug === module.slug);
  const altHref = altVisible ? buildModerationHref(altView, group.slug, module.slug) : undefined;

  return (
    <ModerationWipPage
      breadcrumb={[
        { label: "Admin", href: "/admin" },
        { label: "Modération", href: MODERATION_BASE },
        {
          label: view === "admin" ? "Vue admin" : "Vue modérateur",
          href: backHref,
        },
        { label: group.label, href: groupHref },
        { label: module.label },
      ]}
      module={module}
      backHref={groupHref}
      backLabel={`Retour à ${group.label}`}
      altViewHref={altHref}
      altViewLabel={altHref ? "Voir dans l'autre vue" : undefined}
    />
  );
}
