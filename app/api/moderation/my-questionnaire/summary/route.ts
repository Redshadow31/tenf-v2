import { NextResponse } from "next/server";
import { isNextResponse, requireModeratorQuestionnaireAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import {
  getAdminReview,
  getMemberIdByDiscordId,
  getObjectives,
  getOrCreateSubmission,
  getFinalReview,
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
    const review = await getAdminReview(submission.id);
    const objectives = await getObjectives(submission.id);
    const finalReview = await getFinalReview(submission.id);

    const published =
      submission.memberSummaryPublishedAt &&
      ["MEMBER_SUMMARY_PUBLISHED", "OBJECTIVES_DEFINED", "FINAL_REVIEW_DONE"].includes(
        submission.status,
      );

    return NextResponse.json({
      submission: {
        id: submission.id,
        status: submission.status,
        memberSummaryPublishedAt: submission.memberSummaryPublishedAt,
      },
      summary: published ? (review?.member_summary_text ?? null) : null,
      objectives: ["OBJECTIVES_DEFINED", "FINAL_REVIEW_DONE"].includes(submission.status)
        ? objectives.map((o) => ({
            id: o.id,
            title: o.title,
            description: o.description,
            monthIndex: o.month_index,
            status: o.status,
          }))
        : [],
      finalReview:
        submission.status === "FINAL_REVIEW_DONE" && finalReview
          ? {
              text: finalReview.final_review_text,
              decision: finalReview.decision,
            }
          : null,
    });
  } catch (error) {
    console.error("[my-questionnaire summary]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
