import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAnalysisAuth } from "@/lib/staff-questionnaire/api-auth";
import { generateMemberSummaryDraft } from "@/lib/staff-questionnaire/analysis-generator";
import type { AdminReviewPayload } from "@/lib/staff-questionnaire/types";
import {
  getAdminReview,
  getMemberIdByDiscordId,
  getSubmissionById,
  upsertAdminReview,
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

    const body = await request.json();
    const reviewerId = await getMemberIdByDiscordId(auth.discordId);
    const existing = await getAdminReview(submissionId);

    let payload: AdminReviewPayload = {
      internalAnalysisText: existing?.internal_analysis_text ?? undefined,
      behavioralProfile: existing?.behavioral_profile ?? undefined,
      functioningMode: existing?.functioning_mode ?? undefined,
      supportNeeds: existing?.support_needs ?? undefined,
      vigilancePoints: existing?.vigilance_points ?? undefined,
      communicationStyle: existing?.communication_style ?? undefined,
      autonomyLevel: existing?.autonomy_level ?? undefined,
      conflictRelation: existing?.conflict_relation ?? undefined,
      authorityRelation: existing?.authority_relation ?? undefined,
      emotionalManagement: existing?.emotional_management ?? undefined,
      recommendedMissions: existing?.recommended_missions ?? undefined,
      adminNotes: existing?.admin_notes ?? undefined,
      memberSummaryText: body?.memberSummaryText ?? existing?.member_summary_text ?? undefined,
    };

    if (body?.action === "generate-draft") {
      const draftFields: AdminReviewPayload = {
        behavioralProfile: existing?.behavioral_profile ?? undefined,
        functioningMode: existing?.functioning_mode ?? undefined,
        supportNeeds: existing?.support_needs ?? undefined,
        autonomyLevel: existing?.autonomy_level ?? undefined,
        conflictRelation: existing?.conflict_relation ?? undefined,
        communicationStyle: existing?.communication_style ?? undefined,
      };
      payload.memberSummaryText = generateMemberSummaryDraft(draftFields);
    } else if (typeof body?.memberSummaryText === "string") {
      payload.memberSummaryText = body.memberSummaryText;
    }

    await upsertAdminReview(submissionId, reviewerId, payload, "MEMBER_SUMMARY_READY");

    return NextResponse.json({
      ok: true,
      status: "MEMBER_SUMMARY_READY",
      memberSummaryText: payload.memberSummaryText,
    });
  } catch (error) {
    console.error("[staff-questionnaires member-summary]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
