import { NextResponse } from "next/server";
import { isNextResponse, requireModeratorQuestionnaireAuth } from "@/lib/staff-questionnaire/api-auth";
import { mapSubmissionToModeratorView, MODERATOR_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import {
  getAnswersMap,
  getMemberIdByDiscordId,
  getOrCreateSubmission,
  isSubmissionEditable,
  listActiveQuestions,
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

    const submission = await getOrCreateSubmission(memberId, templateId);
    const questions = await listActiveQuestions(templateId);
    const answers = await getAnswersMap(submission.id);

    const moderatorView = mapSubmissionToModeratorView(submission.status);
    const statusMeta = MODERATOR_STATUS_LABELS[moderatorView];

    const answersPayload: Record<string, { answerText: string | null; answerJson: Record<string, unknown> | null }> =
      {};
    answers.forEach((v, k) => {
      answersPayload[k] = v;
    });

    const completedCount = questions.filter((q) => {
      const a = answers.get(q.questionKey);
      if (!a) return false;
      if (q.type === "TEXT_LONG" || q.type === "TEXT_SHORT") return Boolean(a.answerText?.trim());
      if (q.type === "THREE_FIELDS") {
        const fields = (a.answerJson?.fields as string[] | undefined) ?? [];
        return fields.filter((f) => f?.trim()).length >= 3;
      }
      if (q.type === "SCALE_1_5") return Boolean(a.answerJson?.value);
      if (q.type === "SINGLE_CHOICE") return Boolean(a.answerJson?.choice);
      if (q.type === "MULTIPLE_CHOICE") {
        const sel = a.answerJson?.selected as string[] | undefined;
        return Boolean(sel && sel.length > 0);
      }
      return false;
    }).length;

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
