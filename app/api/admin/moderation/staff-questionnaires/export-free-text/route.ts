import { NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireExportAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import { buildFreeTextExportRows, rowsToCsv } from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireQuestionnaireExportAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const rows = await buildFreeTextExportRows(templateId);
    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="questionnaires-staff-reponses-libres.csv"',
      },
    });
  } catch (error) {
    console.error("[staff-questionnaires export-free-text]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
