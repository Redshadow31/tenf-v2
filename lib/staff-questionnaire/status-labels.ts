import type { StaffQuestionnaireSubmissionStatus } from "./types";

export type ModeratorStatusView =
  | "A_REMPLIR"
  | "EN_COURS"
  | "ENVOYE"
  | "ANALYSE_EN_COURS"
  | "SYNTHESE_DISPONIBLE"
  | "OBJECTIFS_DEFINIS"
  | "BILAN_FINAL_DISPONIBLE";

export function mapSubmissionToModeratorView(
  status: StaffQuestionnaireSubmissionStatus,
): ModeratorStatusView {
  switch (status) {
    case "DRAFT":
      return "A_REMPLIR";
    case "IN_PROGRESS":
      return "EN_COURS";
    case "SUBMITTED":
      return "ENVOYE";
    case "ADMIN_REVIEW":
    case "INTERNAL_ANALYSIS_DONE":
    case "MEMBER_SUMMARY_READY":
      return "ANALYSE_EN_COURS";
    case "MEMBER_SUMMARY_PUBLISHED":
      return "SYNTHESE_DISPONIBLE";
    case "OBJECTIVES_DEFINED":
      return "OBJECTIFS_DEFINIS";
    case "FINAL_REVIEW_DONE":
      return "BILAN_FINAL_DISPONIBLE";
    default:
      return "A_REMPLIR";
  }
}

export const MODERATOR_STATUS_LABELS: Record<
  ModeratorStatusView,
  { label: string; tone: "slate" | "amber" | "sky" | "violet" | "emerald" | "indigo" }
> = {
  A_REMPLIR: { label: "À remplir", tone: "slate" },
  EN_COURS: { label: "En cours", tone: "amber" },
  ENVOYE: { label: "Envoyé", tone: "sky" },
  ANALYSE_EN_COURS: { label: "Analyse en cours", tone: "violet" },
  SYNTHESE_DISPONIBLE: { label: "Synthèse disponible", tone: "emerald" },
  OBJECTIFS_DEFINIS: { label: "Objectifs définis", tone: "indigo" },
  BILAN_FINAL_DISPONIBLE: { label: "Bilan final disponible", tone: "emerald" },
};

export const ADMIN_STATUS_LABELS: Record<StaffQuestionnaireSubmissionStatus, string> = {
  DRAFT: "Brouillon",
  IN_PROGRESS: "En cours",
  SUBMITTED: "Soumis",
  ADMIN_REVIEW: "Revue admin",
  INTERNAL_ANALYSIS_DONE: "Analyse interne faite",
  MEMBER_SUMMARY_READY: "Synthèse prête",
  MEMBER_SUMMARY_PUBLISHED: "Synthèse publiée",
  OBJECTIVES_DEFINED: "Objectifs définis",
  FINAL_REVIEW_DONE: "Bilan final",
};
