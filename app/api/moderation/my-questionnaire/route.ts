import { NextResponse } from "next/server";
import { isNextResponse, requireModeratorQuestionnaireAuth } from "@/lib/staff-questionnaire/api-auth";
import { mapSubmissionToModeratorView, MODERATOR_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import { computeQuestionnaireProgress } from "@/lib/staff-questionnaire/question-utils";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import {
  getAnswersMap,
  getMemberIdByDiscordId,
  getOrCreateSubmission,
  isSubmissionEditable,
  listActiveQuestions,
  repairPhantomLockedSubmissionIfNeeded,
} from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireModeratorQuestionnaireAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const memberId = await getMemberIdByDiscordId(auth.discordId);
    if (!memberId) {
      return NextResponse.json({ error: "Profil membre introuvable" }, { status: 404 });
    }

    const questions = await listActiveQuestions(templateId);
    let submission = await getOrCreateSubmission(memberId, templateId);
    let answers = await getAnswersMap(submission.id);
    submission = await repairPhantomLockedSubmissionIfNeeded(submission, questions, answers);
    if (isSubmissionEditable(submission.status)) {
      answers = await getAnswersMap(submission.id);
    }

    const moderatorView = mapSubmissionToModeratorView(submission.status);
    const statusMeta = MODERATOR_STATUS_LABELS[moderatorView];

    const answersPayload: Record<string, { answerText: string | null; answerJson: Record<string, unknown> | null }> =
      {};
    answers.forEach((v, k) => {
      answersPayload[k] = v;
    });

    const questionLikes = questions.map((q) => ({
      key: q.questionKey,
      number: q.questionNumber,
      type: q.type,
      isRequired: q.isRequired,
      options: q.options,
    }));
    const progressResult = computeQuestionnaireProgress(questionLikes, answersPayload);
    const completedCount = progressResult.completed;

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        moderatorView,
        statusLabel: statusMeta.label,
        statusTone: statusMeta.tone,
        consents: submission.consents,
        startedAt: submission.startedAt,
        submittedAt: submission.submittedAt,
        editable: isSubmissionEditable(submission.status),
        memberSummaryPublishedAt: submission.memberSummaryPublishedAt,
      },
      questions: questions.map((q) => ({
        id: q.id,
        key: q.questionKey,
        number: q.questionNumber,
        sectionKey: q.sectionKey,
        sectionTitle: q.sectionTitle,
        label: q.label,
        helpText: q.helpText,
        type: q.type,
        options: q.options,
        isRequired: q.isRequired,
      })),
      answers: answersPayload,
      progress: {
        completed: completedCount,
        total: questions.length,
      },
    });
  } catch (error) {
    console.error("[my-questionnaire GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
