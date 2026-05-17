import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAdminAuth } from "@/lib/staff-questionnaire/api-auth";
import { generateInternalAnalysisDraft } from "@/lib/staff-questionnaire/analysis-generator";
import { computeQuestionnaireProgress } from "@/lib/staff-questionnaire/question-utils";
import {
  getAdminReview,
  getAnswersMap,
  getFinalReview,
  getObjectives,
  getSubmissionById,
  listActiveQuestions,
} from "@/lib/staff-questionnaire/storage";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ submissionId: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireQuestionnaireAdminAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const { submissionId } = await params;
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const { data: member } = await supabaseAdmin
      .from("members")
      .select("id, display_name, discord_username, role, discord_id")
      .eq("id", submission.memberId)
      .maybeSingle();

    const questions = await listActiveQuestions(submission.templateId);
    const answers = await getAnswersMap(submissionId);
    const review = await getAdminReview(submissionId);
    const objectives = await getObjectives(submissionId);
    const finalReview = await getFinalReview(submissionId);

    const answerRows = questions.map((q) => {
      const a = answers.get(q.questionKey);
      return {
        questionKey: q.questionKey,
        label: q.label,
        type: q.type,
        sectionTitle: q.sectionTitle,
        answerText: a?.answerText ?? null,
        answerJson: a?.answerJson ?? null,
        answered: Boolean(a && (a.answerText?.trim() || a.answerJson)),
      };
    });

    const answersRecord: Record<string, { answerText?: string | null; answerJson?: Record<string, unknown> | null }> =
      {};
    for (const q of questions) {
      const a = answers.get(q.questionKey);
      if (a) answersRecord[q.questionKey] = a;
    }
    const progress = computeQuestionnaireProgress(
      questions.map((q) => ({
        key: q.questionKey,
        number: q.questionNumber,
        type: q.type,
        isRequired: q.isRequired,
        options: q.options,
      })),
      answersRecord,
    );

    return NextResponse.json({
      submission,
      member,
      questions,
      answers: answerRows,
      progress,
      review,
      objectives,
      finalReview,
    });
  } catch (error) {
    console.error("[staff-questionnaires detail GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireQuestionnaireAdminAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const { submissionId } = await params;
    const body = await request.json();
    if (body?.action !== "generate-analysis-draft") {
      return NextResponse.json({ error: "Action non supportée" }, { status: 400 });
    }

    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const questions = await listActiveQuestions(submission.templateId);
    const answers = await getAnswersMap(submissionId);
    const answerRows = questions.map((q) => {
      const a = answers.get(q.questionKey);
      return {
        questionKey: q.questionKey,
        label: q.label,
        type: q.type,
        answerText: a?.answerText ?? null,
        answerJson: a?.answerJson ?? null,
      };
    });

    const draft = generateInternalAnalysisDraft(answerRows);
    return NextResponse.json({ draft });
  } catch (error) {
    console.error("[staff-questionnaires generate draft]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
