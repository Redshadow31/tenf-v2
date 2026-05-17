import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAnalysisAuth } from "@/lib/staff-questionnaire/api-auth";
import type { ObjectivePayload } from "@/lib/staff-questionnaire/types";
import {
  getMemberIdByDiscordId,
  getSubmissionById,
  replaceObjectives,
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
    const objectives = (body?.objectives ?? []) as ObjectivePayload[];
    const reviewerId = await getMemberIdByDiscordId(auth.discordId);

    await replaceObjectives(submissionId, reviewerId, objectives);

    return NextResponse.json({ ok: true, status: "OBJECTIVES_DEFINED" });
  } catch (error) {
    console.error("[staff-questionnaires objectives]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
