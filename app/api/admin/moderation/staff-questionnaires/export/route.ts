import { NextResponse } from "next/server";
import { isNextResponse, requireQuestionnaireExportAuth } from "@/lib/staff-questionnaire/api-auth";
import { ensureStaffQuestionnaireTemplateSeeded } from "@/lib/staff-questionnaire/seed";
import { buildExportRows, rowsToCsv } from "@/lib/staff-questionnaire/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireQuestionnaireExportAuth();
  if (isNextResponse(auth)) return auth;

  try {
    const templateId = await ensureStaffQuestionnaireTemplateSeeded();
    const rows = await buildExportRows(templateId);
    const csv = rowsToCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="questionnaires-staff-complet.csv"',
      },
    });
  } catch (error) {
    console.error("[staff-questionnaires export]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
