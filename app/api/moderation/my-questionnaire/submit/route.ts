import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireModeratorQuestionnaireAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import type { SubmissionConsents } from "@/lib/staff-questionnaire/types";
import { notifyStaffQuestionnaireSubmitted } from "@/lib/staff-questionnaire/notifications";
import {
  getMemberIdByDiscordId,
  getOrCreateSubmission,
  listActiveQuestions,
  saveSubmissionAnswers,
  submitQuestionnaire,
} from "@/lib/staff-questionnaire/storage";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const auth = await requireModeratorQuestionnaireAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const body = await request.json().catch(() => ({}));
    const consents = body?.consents as SubmissionConsents | undefined;

    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const memberId = await getMemberIdByDiscordId(auth.discordId);
    if (!memberId) {
      return NextResponse.json({ error: "Profil membre introuvable" }, { status: 404 });
    }

    let submission = await getOrCreateSubmission(memberId, templateId);
    const questions = await listActiveQuestions(templateId);

    if (consents) {
      submission = await saveSubmissionAnswers(submission, questions, [], consents);
    }

    const updated = await submitQuestionnaire(submission, questions, memberId);

    const { data: memberRow } = await supabaseAdmin
      .from("members")
      .select("discord_username, display_name")
      .eq("id", memberId)
      .maybeSingle();
    const label =
      (memberRow?.discord_username as string) ||
      (memberRow?.display_name as string) ||
      auth.username;

    void notifyStaffQuestionnaireSubmitted({
      submissionId: updated.id,
      moderatorDiscordId: auth.discordId,
      moderatorLabel: label,
    });

    return NextResponse.json({
      submission: { id: updated.id, status: updated.status },
      message: "Questionnaire envoyé — merci pour ta sincérité",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "UNKNOWN";
    if (msg.startsWith("INCOMPLETE:")) {
      const missing = msg.replace("INCOMPLETE:", "").split(",");
      return NextResponse.json(
        { error: "Questionnaire incomplet", missing },
        { status: 400 },
      );
    }
    if (msg === "SUBMISSION_LOCKED") {
      return NextResponse.json({ error: "Déjà soumis" }, { status: 409 });
    }
    console.error("[my-questionnaire submit]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
