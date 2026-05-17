import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireAnalysisAuth } from "@/lib/staff-questionnaire/api-auth";
import { getSubmissionById, publishMemberSummary } from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ submissionId: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireQuestionnaireAnalysisAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const { submissionId } = await params;
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Soumission introuvable" }, { status: 404 });
    }

    await publishMemberSummary(submissionId);
    return NextResponse.json({ ok: true, status: "MEMBER_SUMMARY_PUBLISHED" });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "UNKNOWN";
    if (msg === "NO_SUMMARY") {
      return NextResponse.json(
        { error: "Synthèse modérateur vide — rédige-la avant publication" },
        { status: 400 },
      );
    }
    console.error("[staff-questionnaires publish-summary]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
