import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireExportAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import {
  buildFreeTextExportRows,
  getSubmissionById,
  rowsToCsv,
} from "@/lib/staff-questionnaire/storage";
import { supabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ submissionId: string }> };

function slugifyFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireQuestionnaireExportAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const { submissionId } = await params;
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return NextResponse.json({ error: "Questionnaire introuvable" }, { status: 404 });
    }

    const { data: member } = await supabaseAdmin
      .from("members")
      .select("discord_username, display_name")
      .eq("id", submission.memberId)
      .maybeSingle();

    const pseudo = String(member?.discord_username ?? member?.display_name ?? submissionId);
    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const rows = await buildFreeTextExportRows(templateId, submissionId);
    const csv = rowsToCsv(rows);
    const slug = slugifyFilename(pseudo) || submissionId.slice(0, 8);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="questionnaire-staff-${slug}-reponses-libres.csv"`,
      },
    });
  } catch (error) {
    console.error("[staff-questionnaires submission export-free-text]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
