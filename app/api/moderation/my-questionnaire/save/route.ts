import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireModeratorQuestionnaireAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import type { AnswerPayload, SubmissionConsents } from "@/lib/staff-questionnaire/types";
import {
  getMemberIdByDiscordId,
  getOrCreateSubmission,
  listActiveQuestions,
  saveSubmissionAnswers,
} from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireModeratorQuestionnaireAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json();
    const answers = (body?.answers ?? []) as AnswerPayload[];
    const consents = body?.consents as SubmissionConsents | undefined;

    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const memberId = await getMemberIdByDiscordId(auth.discordId);
    if (!memberId) {
      return NextResponse.json({ error: "Profil membre introuvable" }, { status: 404 });
    }

    const submission = await getOrCreateSubmission(memberId, templateId);
    const questions = await listActiveQuestions(templateId);

    const updated = await saveSubmissionAnswers(submission, questions, answers, consents);

    return NextResponse.json({
      submission: { id: updated.id, status: updated.status },
      message: "Progression enregistrée",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "UNKNOWN";
    if (msg === "SUBMISSION_LOCKED") {
      return NextResponse.json(
        { error: "Questionnaire déjà soumis — modification impossible" },
        { status: 409 },
      );
    }
    console.error("[my-questionnaire save]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
