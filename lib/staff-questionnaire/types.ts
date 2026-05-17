export const STAFF_QUESTIONNAIRE_TEMPLATE_SLUG = "posture-staff-cm-tenf-v1";

export type StaffQuestionnaireQuestionType =
  | "TEXT_LONG"
  | "TEXT_SHORT"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "SCALE_1_5"
  | "THREE_FIELDS";

export type StaffQuestionnaireSubmissionStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "ADMIN_REVIEW"
  | "INTERNAL_ANALYSIS_DONE"
  | "MEMBER_SUMMARY_READY"
  | "MEMBER_SUMMARY_PUBLISHED"
  | "OBJECTIVES_DEFINED"
  | "FINAL_REVIEW_DONE";

export type StaffQuestionnaireObjectiveStatus = "TODO" | "IN_PROGRESS" | "DONE" | "PAUSED";

export type StaffQuestionnaireFinalDecision =
  | "VALIDATED"
  | "EXTENDED_TRAINING"
  | "BINOME"
  | "OBSERVATION"
  | "SUPPORT_TENF"
  | "PAUSE_RECOMMENDED"
  | "REFERENT_POTENTIAL";

export type QuestionnaireQuestionDef = {
  key: string;
  number: number;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  type: StaffQuestionnaireQuestionType;
  options?: string[] | { id: string; label: string }[];
  scaleLabels?: Record<string, string>;
  threeFieldLabels?: string[];
  helpText?: string;
  required?: boolean;
  complementLabel?: string;
  analysisHints?: string[];
};

export type AnswerPayload = {
  questionKey: string;
  answerText?: string | null;
  answerJson?: Record<string, unknown> | null;
};

export type SubmissionConsents = {
  understoodPurpose: boolean;
  sincereAnswers: boolean;
  authorizedAccess: boolean;
};

export type AdminReviewPayload = {
  internalAnalysisText?: string | null;
  memberSummaryText?: string | null;
  behavioralProfile?: string | null;
  functioningMode?: string | null;
  supportNeeds?: string | null;
  vigilancePoints?: string | null;
  communicationStyle?: string | null;
  autonomyLevel?: string | null;
  conflictRelation?: string | null;
  authorityRelation?: string | null;
  emotionalManagement?: string | null;
  recommendedMissions?: string | null;
  adminNotes?: string | null;
};

export type ObjectivePayload = {
  id?: string;
  title: string;
  description?: string | null;
  monthIndex?: number | null;
  status?: StaffQuestionnaireObjectiveStatus;
};

export type FinalReviewPayload = {
  finalReviewText: string;
  decision: StaffQuestionnaireFinalDecision;
};
