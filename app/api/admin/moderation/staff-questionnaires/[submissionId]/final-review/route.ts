import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAnalysisAuth } from "@/lib/staff-questionnaire/api-auth";
import type { FinalReviewPayload } from "@/lib/staff-questionnaire/types";
import {
  getMemberIdByDiscordId,
  getSubmissionById,
  upsertFinalReview,
} from "@/lib/staff-questionnaire/storage";

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

    const payload = (await request.json()) as FinalReviewPayload;
    if (!payload?.finalReviewText?.trim() || !payload?.decision) {
      return NextResponse.json({ error: "Bilan final incomplet" }, { status: 400 });
    }

    const reviewerId = await getMemberIdByDiscordId(auth.discordId);
    await upsertFinalReview(submissionId, reviewerId, payload);

    return NextResponse.json({ ok: true, status: "FINAL_REVIEW_DONE" });
  } catch (error) {
    console.error("[staff-questionnaires final-review]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
