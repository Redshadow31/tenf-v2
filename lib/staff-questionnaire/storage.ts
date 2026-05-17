import { supabaseAdmin } from "@/lib/db/supabase";
import type {
  AdminReviewPayload,
  AnswerPayload,
  FinalReviewPayload,
  ObjectivePayload,
  StaffQuestionnaireFinalDecision,
  StaffQuestionnaireSubmissionStatus,
  SubmissionConsents,
} from "./types";
import { ensureStaffQuestionnaireTemplateSeeded } from "./seed";

const MOD_STAFF_ROLES = [
  "Modérateur",
  "Modérateur en formation",
  "Modérateur en Découverte",
  "Modérateur en Accompagnement",
  "Modérateur en Autonomie",
  "Modérateur en activité réduite",
  "Modérateur en pause",
  "Modérateur Junior",
  "Mentor",
  "Admin",
  "Admin Coordinateur",
  "Admin Adjoint",
  "Soutien TENF",
];

export type DbQuestion = {
  id: string;
  questionKey: string;
  questionNumber: number;
  sectionKey: string;
  sectionTitle: string;
  label: string;
  helpText: string | null;
  type: string;
  options: Record<string, unknown> | null;
  isRequired: boolean;
};

export type DbSubmission = {
  id: string;
  templateId: string;
  memberId: string;
  status: StaffQuestionnaireSubmissionStatus;
  consents: SubmissionConsents;
  startedAt: string;
  submittedAt: string | null;
  updatedAt: string;
  memberSummaryPublishedAt: string | null;
};

function mapQuestion(row: Record<string, unknown>): DbQuestion {
  const opts = (row.options as Record<string, unknown> | null) ?? {};
  return {
    id: row.id as string,
    questionKey: row.question_key as string,
    questionNumber: row.question_number as number,
    sectionKey: row.section_key as string,
    sectionTitle: row.section_title as string,
    label: row.label as string,
    helpText: (row.help_text as string) ?? null,
    type: row.type as string,
    options: opts,
    isRequired: Boolean(row.is_required),
  };
}

function mapSubmission(row: Record<string, unknown>): DbSubmission {
  return {
    id: row.id as string,
    templateId: row.template_id as string,
    memberId: row.member_id as string,
    status: row.status as StaffQuestionnaireSubmissionStatus,
    consents: (row.consents as SubmissionConsents) ?? {
      understoodPurpose: false,
      sincereAnswers: false,
      authorizedAccess: false,
    },
    startedAt: row.started_at as string,
    submittedAt: (row.submitted_at as string) ?? null,
    updatedAt: row.updated_at as string,
    memberSummaryPublishedAt: (row.member_summary_published_at as string) ?? null,
  };
}

export async function getMemberIdByDiscordId(discordId: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string) ?? null;
}

export async function listActiveQuestions(templateId: string): Promise<DbQuestion[]> {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_questions")
    .select("*")
    .eq("template_id", templateId)
    .order("order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => mapQuestion(r as Record<string, unknown>));
}

export async function getOrCreateSubmission(
  memberId: string,
  templateId: string,
): Promise<DbSubmission> {
  const { data: existing, error } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .select("*")
    .eq("member_id", memberId)
    .eq("template_id", templateId)
    .maybeSingle();
  if (error) throw error;
  if (existing) return mapSubmission(existing as Record<string, unknown>);

  const { data: created, error: insertError } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .insert({
      template_id: templateId,
      member_id: memberId,
      status: "DRAFT",
      consents: {},
    })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return mapSubmission(created as Record<string, unknown>);
}

export async function getSubmissionById(submissionId: string): Promise<DbSubmission | null> {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapSubmission(data as Record<string, unknown>) : null;
}

export async function getAnswersMap(
  submissionId: string,
): Promise<Map<string, { answerText: string | null; answerJson: Record<string, unknown> | null }>> {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_answers")
    .select("question_id, answer_text, answer_json, staff_questionnaire_questions(question_key)")
    .eq("submission_id", submissionId);
  if (error) throw error;

  const map = new Map<string, { answerText: string | null; answerJson: Record<string, unknown> | null }>();
  for (const row of data ?? []) {
    const qRaw = row.staff_questionnaire_questions as
      | { question_key: string }
      | { question_key: string }[]
      | null;
    const q = Array.isArray(qRaw) ? qRaw[0] : qRaw;
    if (!q?.question_key) continue;
    map.set(q.question_key, {
      answerText: (row.answer_text as string) ?? null,
      answerJson: (row.answer_json as Record<string, unknown>) ?? null,
    });
  }
  return map;
}

export function isSubmissionEditable(status: StaffQuestionnaireSubmissionStatus): boolean {
  return status === "DRAFT" || status === "IN_PROGRESS";
}

export async function saveSubmissionAnswers(
  submission: DbSubmission,
  questions: DbQuestion[],
  answers: AnswerPayload[],
  consents?: SubmissionConsents,
): Promise<DbSubmission> {
  if (!isSubmissionEditable(submission.status)) {
    throw new Error("SUBMISSION_LOCKED");
  }

  const keyToQuestion = new Map(questions.map((q) => [q.questionKey, q]));
  const upsertRows = answers
    .filter((a) => keyToQuestion.has(a.questionKey))
    .map((a) => {
      const q = keyToQuestion.get(a.questionKey)!;
      return {
        submission_id: submission.id,
        question_id: q.id,
        answer_text: a.answerText ?? null,
        answer_json: a.answerJson ?? null,
      };
    });

  if (upsertRows.length > 0) {
    const { error } = await supabaseAdmin
      .from("staff_questionnaire_answers")
      .upsert(upsertRows, { onConflict: "submission_id,question_id" });
    if (error) throw error;
  }

  const nextStatus: StaffQuestionnaireSubmissionStatus =
    submission.status === "DRAFT" ? "IN_PROGRESS" : submission.status;

  const updatePayload: Record<string, unknown> = { status: nextStatus };
  if (consents) updatePayload.consents = consents;

  const { data, error: updError } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .update(updatePayload)
    .eq("id", submission.id)
    .select("*")
    .single();
  if (updError) throw updError;
  return mapSubmission(data as Record<string, unknown>);
}

export function validateSubmissionComplete(
  questions: DbQuestion[],
  answers: Map<string, { answerText: string | null; answerJson: Record<string, unknown> | null }>,
  consents: SubmissionConsents,
): string[] {
  const missing: string[] = [];
  if (!consents.understoodPurpose || !consents.sincereAnswers || !consents.authorizedAccess) {
    missing.push("consents");
  }
  for (const q of questions) {
    if (!q.isRequired) continue;
    const a = answers.get(q.questionKey);
    if (!a) {
      missing.push(q.questionKey);
      continue;
    }
    if (q.type === "TEXT_LONG" || q.type === "TEXT_SHORT") {
      if (!a.answerText?.trim()) missing.push(q.questionKey);
    } else if (q.type === "THREE_FIELDS") {
      const fields = (a.answerJson?.fields as string[] | undefined) ?? [];
      if (fields.filter((f) => f?.trim()).length < 3) missing.push(q.questionKey);
    } else if (q.type === "SCALE_1_5") {
      if (!a.answerJson?.value) missing.push(q.questionKey);
    } else {
      const selected = a.answerJson?.selected as string[] | undefined;
      const choice = a.answerJson?.choice as string | undefined;
      if (q.type === "SINGLE_CHOICE" && !choice) missing.push(q.questionKey);
      if (q.type === "MULTIPLE_CHOICE" && (!selected || selected.length === 0)) missing.push(q.questionKey);
    }
  }
  return missing;
}

export async function submitQuestionnaire(
  submission: DbSubmission,
  questions: DbQuestion[],
  reviewerMemberId: string | null,
): Promise<DbSubmission> {
  const answers = await getAnswersMap(submission.id);
  const missing = validateSubmissionComplete(questions, answers, submission.consents);
  if (missing.length > 0) throw new Error(`INCOMPLETE:${missing.join(",")}`);

  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .update({
      status: "SUBMITTED",
      submitted_at: new Date().toISOString(),
      reviewed_by_id: reviewerMemberId,
    })
    .eq("id", submission.id)
    .select("*")
    .single();
  if (error) throw error;
  return mapSubmission(data as Record<string, unknown>);
}

/** Compte les réponses enregistrées par soumission (pour suivi admin). */
export async function countAnswersBySubmissionIds(
  submissionIds: string[],
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (submissionIds.length === 0) return map;

  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_answers")
    .select("submission_id")
    .in("submission_id", submissionIds);
  if (error) throw error;

  for (const row of data ?? []) {
    const sid = row.submission_id as string;
    map.set(sid, (map.get(sid) ?? 0) + 1);
  }
  return map;
}

export async function listAdminSubmissions(templateId: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .select(
      `
      *,
      members:member_id ( id, display_name, discord_username, role ),
      staff_questionnaire_admin_reviews ( id, member_summary_text ),
      staff_questionnaire_objectives ( id ),
      staff_questionnaire_final_reviews ( id )
    `,
    )
    .eq("template_id", templateId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAdminReview(submissionId: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_admin_reviews")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertAdminReview(
  submissionId: string,
  reviewerMemberId: string | null,
  payload: AdminReviewPayload,
  statusAfter?: StaffQuestionnaireSubmissionStatus,
): Promise<void> {
  const row = {
    submission_id: submissionId,
    reviewer_id: reviewerMemberId,
    internal_analysis_text: payload.internalAnalysisText ?? null,
    member_summary_text: payload.memberSummaryText ?? null,
    behavioral_profile: payload.behavioralProfile ?? null,
    functioning_mode: payload.functioningMode ?? null,
    support_needs: payload.supportNeeds ?? null,
    vigilance_points: payload.vigilancePoints ?? null,
    communication_style: payload.communicationStyle ?? null,
    autonomy_level: payload.autonomyLevel ?? null,
    conflict_relation: payload.conflictRelation ?? null,
    authority_relation: payload.authorityRelation ?? null,
    emotional_management: payload.emotionalManagement ?? null,
    recommended_missions: payload.recommendedMissions ?? null,
    admin_notes: payload.adminNotes ?? null,
  };

  const { error } = await supabaseAdmin
    .from("staff_questionnaire_admin_reviews")
    .upsert(row, { onConflict: "submission_id" });
  if (error) throw error;

  if (statusAfter) {
    await supabaseAdmin
      .from("staff_questionnaire_submissions")
      .update({ status: statusAfter, reviewed_at: new Date().toISOString() })
      .eq("id", submissionId);
  }
}

export async function publishMemberSummary(submissionId: string): Promise<void> {
  const review = await getAdminReview(submissionId);
  if (!review?.member_summary_text?.trim()) throw new Error("NO_SUMMARY");

  const { error } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .update({
      status: "MEMBER_SUMMARY_PUBLISHED",
      member_summary_published_at: new Date().toISOString(),
    })
    .eq("id", submissionId);
  if (error) throw error;
}

export async function replaceObjectives(
  submissionId: string,
  createdById: string | null,
  objectives: ObjectivePayload[],
): Promise<void> {
  await supabaseAdmin
    .from("staff_questionnaire_objectives")
    .delete()
    .eq("submission_id", submissionId);

  if (objectives.length > 0) {
    const { error } = await supabaseAdmin.from("staff_questionnaire_objectives").insert(
      objectives.map((o) => ({
        submission_id: submissionId,
        created_by_id: createdById,
        title: o.title,
        description: o.description ?? null,
        month_index: o.monthIndex ?? null,
        status: o.status ?? "TODO",
      })),
    );
    if (error) throw error;
  }

  await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .update({ status: "OBJECTIVES_DEFINED" })
    .eq("id", submissionId);
}

export async function getObjectives(submissionId: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_objectives")
    .select("*")
    .eq("submission_id", submissionId)
    .order("month_index", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertFinalReview(
  submissionId: string,
  reviewerMemberId: string | null,
  payload: FinalReviewPayload,
): Promise<void> {
  const { error } = await supabaseAdmin.from("staff_questionnaire_final_reviews").upsert(
    {
      submission_id: submissionId,
      reviewer_id: reviewerMemberId,
      final_review_text: payload.finalReviewText,
      decision: payload.decision,
    },
    { onConflict: "submission_id" },
  );
  if (error) throw error;

  await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .update({ status: "FINAL_REVIEW_DONE" })
    .eq("id", submissionId);
}

export async function getFinalReview(submissionId: string) {
  const { data, error } = await supabaseAdmin
    .from("staff_questionnaire_final_reviews")
    .select("*")
    .eq("submission_id", submissionId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listModeratorMembersForQuestionnaire() {
  const { data, error } = await supabaseAdmin
    .from("members")
    .select("id, display_name, discord_username, role, discord_id")
    .in("role", MOD_STAFF_ROLES)
    .eq("is_active", true)
    .order("display_name");
  if (error) throw error;
  return data ?? [];
}

export async function buildExportRows(templateId: string) {
  const templateIdResolved = templateId || (await ensureStaffQuestionnaireTemplateSeeded());
  const questions = await listActiveQuestions(templateIdResolved);
  const submissions = await listAdminSubmissions(templateIdResolved);

  const rows: Record<string, string>[] = [];
  for (const sub of submissions) {
    const member = sub.members as Record<string, unknown> | null;
    const answers = await getAnswersMap(sub.id as string);
    const review = (sub.staff_questionnaire_admin_reviews as Record<string, unknown>[] | null)?.[0];
    const objectives = (sub.staff_questionnaire_objectives as unknown[]) ?? [];

    for (const q of questions) {
      const a = answers.get(q.questionKey);
      const selected = (a?.answerJson?.selected as string[]) ?? [];
      const choice = (a?.answerJson?.choice as string) ?? "";
      rows.push({
        id_questionnaire: sub.id as string,
        member_id: sub.member_id as string,
        pseudo_discord: String(member?.discord_username ?? member?.display_name ?? ""),
        role_staff: String(member?.role ?? ""),
        statut_questionnaire: sub.status as string,
        date_debut: String(sub.started_at ?? ""),
        date_soumission: String(sub.submitted_at ?? ""),
        question_id: q.questionKey,
        partie: q.sectionTitle,
        question: q.label,
        type_question: q.type,
        reponse_choix: [...selected, choice].filter(Boolean).join(" | "),
        reponse_libre: a?.answerText ?? "",
        analyse_interne: String(review?.internal_analysis_text ?? ""),
        synthese_moderateur: String(review?.member_summary_text ?? ""),
        objectifs_3_mois: String(objectives.length),
        referent: "",
        date_validation: String(sub.member_summary_published_at ?? ""),
      });
    }
  }
  return rows;
}

export async function buildFreeTextExportRows(templateId: string) {
  const templateIdResolved = templateId || (await ensureStaffQuestionnaireTemplateSeeded());
  const questions = await listActiveQuestions(templateIdResolved);
  const textQuestions = questions.filter((q) => q.type === "TEXT_LONG" || q.type === "TEXT_SHORT");
  const submissions = await listAdminSubmissions(templateIdResolved);
  const rows: Record<string, string>[] = [];

  for (const sub of submissions) {
    const member = sub.members as Record<string, unknown> | null;
    const answers = await getAnswersMap(sub.id as string);
    const review = (sub.staff_questionnaire_admin_reviews as Record<string, unknown>[] | null)?.[0];

    for (const q of textQuestions) {
      const a = answers.get(q.questionKey);
      if (!a?.answerText?.trim()) continue;
      rows.push({
        pseudo: String(member?.discord_username ?? member?.display_name ?? ""),
        role: String(member?.role ?? ""),
        question_id: q.questionKey,
        partie: q.sectionTitle,
        question: q.label,
        reponse_libre: a.answerText,
        commentaire_admin: String(review?.admin_notes ?? ""),
        tag_manual: "",
      });
    }
  }
  return rows;
}

export function rowsToCsv(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: string) => {
    const s = String(v ?? "").replace(/"/g, '""');
    return /[",\n\r]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(","))].join(
    "\n",
  );
}
