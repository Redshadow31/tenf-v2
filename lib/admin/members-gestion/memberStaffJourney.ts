import { supabaseAdmin } from "@/lib/db/supabase";
import { evaluationRepository } from "@/lib/repositories";
import { ADMIN_STATUS_LABELS } from "@/lib/staff-questionnaire/status-labels";
import { normalizeStaffPeriods } from "@/lib/admin/members-gestion/staffPeriods";

export type StaffJourneyQuestionnaireLink = {
  submissionId: string;
  status: string;
  statusLabel: string;
  submittedAt: string | null;
  href: string;
};

export type StaffJourneyEvaluationLink = {
  monthKey: string;
  monthLabel: string;
  finalNote: number | null;
  totalPoints: number | null;
  href: string;
};

export type MemberStaffJourneyExtras = {
  staffPeriods: ReturnType<typeof normalizeStaffPeriods>;
  questionnaire: StaffJourneyQuestionnaireLink | null;
  lastEvaluation: StaffJourneyEvaluationLink | null;
};

export async function fetchMemberStaffJourneyExtras(
  memberId: string | undefined,
  twitchLogin: string | undefined,
): Promise<MemberStaffJourneyExtras> {
  let periods: ReturnType<typeof normalizeStaffPeriods> = [];
  let supabaseMemberId = memberId;

  if (twitchLogin) {
    const { data: row } = await supabaseAdmin
      .from("members")
      .select("id, staff_periods")
      .eq("twitch_login", twitchLogin.toLowerCase())
      .maybeSingle();
    if (row) {
      supabaseMemberId = row.id as string;
      periods = normalizeStaffPeriods(row.staff_periods as unknown[]);
    }
  } else if (memberId) {
    const { data: row } = await supabaseAdmin
      .from("members")
      .select("staff_periods")
      .eq("id", memberId)
      .maybeSingle();
    if (row) periods = normalizeStaffPeriods(row.staff_periods as unknown[]);
  }

  const questionnaire = supabaseMemberId
    ? await fetchQuestionnaireLink(supabaseMemberId)
    : null;

  const lastEvaluation = twitchLogin ? await fetchLastEvaluationLink(twitchLogin) : null;

  return { staffPeriods: periods, questionnaire, lastEvaluation };
}

async function fetchQuestionnaireLink(
  memberId: string,
): Promise<StaffJourneyQuestionnaireLink | null> {
  const { data: sub } = await supabaseAdmin
    .from("staff_questionnaire_submissions")
    .select("id, status, submitted_at, template_id")
    .eq("member_id", memberId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.id) return null;

  const status = String(sub.status);
  return {
    submissionId: sub.id as string,
    status,
    statusLabel:
      ADMIN_STATUS_LABELS[status as keyof typeof ADMIN_STATUS_LABELS] ?? status,
    submittedAt: (sub.submitted_at as string) ?? null,
    href: `/admin/moderation/staff/questionnaires/${sub.id}`,
  };
}

async function fetchLastEvaluationLink(
  twitchLogin: string,
): Promise<StaffJourneyEvaluationLink | null> {
  const evals = await evaluationRepository.findByMember(twitchLogin);
  if (!evals.length) return null;
  const latest = evals[0];
  const monthDate =
    latest.month instanceof Date ? latest.month : new Date(String(latest.month));
  const monthKey = monthDate.toISOString().slice(0, 7);
  const monthLabel = monthDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return {
    monthKey,
    monthLabel,
    finalNote: latest.finalNote ?? null,
    totalPoints: latest.totalPoints ?? null,
    href: `/admin/membres/fiche/${encodeURIComponent(twitchLogin)}`,
  };
}
