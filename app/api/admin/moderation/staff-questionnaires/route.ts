import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAdminAuth } from "@/lib/staff-questionnaire/api-auth";
import { ADMIN_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import {
  countAnswersBySubmissionIds,
  listActiveQuestions,
  listAdminSubmissions,
  listModeratorMembersForQuestionnaire,
} from "@/lib/staff-questionnaire/storage";
import { fetchStaffPilotProfilesByMemberIds } from "@/lib/staff-questionnaire/staffMemberPilotProfile";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireQuestionnaireAdminAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const includeAlumni = request.nextUrl.searchParams.get("includeAlumni") === "true";
    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const [submissions, moderators, questions] = await Promise.all([
      listAdminSubmissions(templateId),
      listModeratorMembersForQuestionnaire({ includeAlumni }),
      listActiveQuestions(templateId),
    ]);

    const memberIds = moderators.map((m) => m.id as string);
    const pilotByMember = await fetchStaffPilotProfilesByMemberIds(memberIds);

    const totalQuestions = questions.length;
    const submissionIds = submissions.map((s) => s.id as string);
    const answerCounts = await countAnswersBySubmissionIds(submissionIds);

    const submissionByMember = new Map(
      submissions.map((s) => [s.member_id as string, s]),
    );

    const rows = moderators.map((m) => {
      const sub = submissionByMember.get(m.id as string);
      const review = (sub?.staff_questionnaire_admin_reviews as unknown[])?.[0] as
        | Record<string, unknown>
        | undefined;
      const objectives = (sub?.staff_questionnaire_objectives as unknown[]) ?? [];
      const status = (sub?.status as string) ?? "DRAFT";
      const sid = sub?.id as string | undefined;
      const answersSaved = sid ? (answerCounts.get(sid) ?? 0) : 0;
      const progressPercent =
        totalQuestions > 0 ? Math.min(100, Math.round((answersSaved / totalQuestions) * 100)) : 0;
      const pilot = pilotByMember.get(m.id as string) ?? null;

      return {
        memberId: m.id,
        pseudo: m.discord_username || m.display_name,
        roleStaff: m.role,
        isMemberActive: m.is_active !== false,
        submissionId: sid ?? null,
        status,
        statusLabel: ADMIN_STATUS_LABELS[status as keyof typeof ADMIN_STATUS_LABELS] ?? status,
        startedAt: sub?.started_at ?? null,
        submittedAt: sub?.submitted_at ?? null,
        updatedAt: sub?.updated_at ?? null,
        summaryPublished: Boolean(sub?.member_summary_published_at),
        objectivesDefined: objectives.length > 0,
        hasSummaryDraft: Boolean(review?.member_summary_text),
        progressCompleted: answersSaved,
        progressTotal: totalQuestions,
        progressPercent,
        inProgress: status === "DRAFT" || status === "IN_PROGRESS",
        staffPilot: pilot
          ? {
              alumniStatus: pilot.alumniStatus,
              alumniStatusLabel: pilot.alumniStatusLabel,
              staffTenureDurationLabel: pilot.staffTenureDurationLabel,
              currentRoleDurationLabel: pilot.currentRoleDurationLabel,
              currentRoleLabel: pilot.currentRoleLabel,
              isCurrentlyStaff: pilot.isCurrentlyStaff,
            }
          : null,
      };
    });

    return NextResponse.json({ rows, templateId, includeAlumni });
  } catch (error) {
    console.error("[staff-questionnaires GET]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
