import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAnalysisAuth } from "@/lib/staff-questionnaire/api-auth";
import type { AdminReviewPayload } from "@/lib/staff-questionnaire/types";
import { getMemberIdByDiscordId, getSubmissionById, upsertAdminReview } from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ submissionId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireQuestionnaireAnalysisAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const { submissionId } = await params;
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    const payload = (await request.json()) as AdminReviewPayload;
    const reviewerId = await getMemberIdByDiscordId(auth.discordId);

    await upsertAdminReview(submissionId, reviewerId, payload, "INTERNAL_ANALYSIS_DONE");

    return NextResponse.json({ ok: true, status: "INTERNAL_ANALYSIS_DONE" });
  } catch (error) {
    console.error("[staff-questionnaires analysis]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
